import { create } from 'zustand';
import { db, parseJson } from '@/data/db';

export type ColKey = 'todo' | 'doing' | 'waiting' | 'done';
export const COL_ORDER: ColKey[] = ['todo', 'doing', 'waiting', 'done'];

export interface Project {
  id: number;
  name: string;
  deadline: string | null;
  isActive: boolean;
  coverUri: string | null;
}

export interface KanbanCard {
  id: number;
  projectId: number;
  col: ColKey;
  title: string;
  labels: string[];
  prio: 'high' | 'med' | 'low';
  due: string | null;
  who: string;
  checkDone: number | null;
  checkTotal: number | null;
  overdue: boolean;
  sort: number;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  date: string;
  status: 'done' | 'active' | 'todo';
  barStart: number;
  barEnd: number;
  notifIds: string[] | null;
}

export interface Contact {
  id: number;
  projectId: number;
  name: string;
  role: string;
  phone: string;
  note: string;
  tone: 'accent' | 'info' | 'warning' | 'neutral';
}

export interface Memo {
  id: number;
  projectId: number | null;
  title: string;
  durationSec: number;
  uri: string | null;
  createdAt: number;
}

export interface Minute {
  id: number;
  projectId: number | null;
  title: string;
  date: string;
  items: string[];
  linkedTask: string | null;
}

export interface SopTemplate {
  id: number;
  name: string;
  icon: string;
  items: string[];
}

export interface ChecklistItem {
  id: number;
  cardId: number;
  text: string;
  done: boolean;
  sort: number;
}

export interface CardEvent {
  id: number;
  cardId: number;
  projectId: number;
  fromCol: ColKey | null;
  toCol: ColKey;
  changedAt: number;
}

interface WorkState {
  projects: Project[];
  activeProject: Project | null;
  cards: KanbanCard[];
  milestones: Milestone[];
  contacts: Contact[];
  memos: Memo[];
  minutes: Minute[];
  sops: SopTemplate[];
  checklist: ChecklistItem[];
  cardEvents: CardEvent[];
  load: () => void;
  addProject: (name: string, deadline: string | null, coverUri: string | null) => void;
  setActiveProject: (id: number) => void;
  // kanban
  moveCard: (id: number, col: ColKey) => void;
  advanceCard: (id: number) => void;
  addCard: (col: ColKey, title: string, who: string) => void;
  updateCard: (id: number, patch: Partial<Pick<KanbanCard, 'title' | 'labels' | 'prio' | 'due' | 'who'>>) => void;
  deleteCard: (id: number) => void;
  // kanban checklist
  addChecklistItem: (cardId: number, text: string) => void;
  toggleChecklistItem: (id: number) => void;
  deleteChecklistItem: (id: number) => void;
  // milestones
  addMilestone: (title: string, date: string, notifIds: string[] | null) => void;
  setMilestoneStatus: (id: number, status: Milestone['status']) => void;
  deleteMilestone: (id: number) => number | null;
  // contacts
  addContact: (c: Omit<Contact, 'id' | 'projectId'>) => void;
  deleteContact: (id: number) => void;
  // memos & minutes
  addMemo: (title: string, durationSec: number, uri: string | null) => void;
  deleteMemo: (id: number) => Memo | null;
  addMinute: (title: string, items: string[], linkedTask: string | null) => void;
  deleteMinute: (id: number) => void;
  // SOP
  loadSop: (sopId: number) => string | null;
  addSopTemplate: (name: string, icon: string, items: string[]) => void;
  updateSopTemplate: (id: number, name: string, icon: string, items: string[]) => void;
  deleteSopTemplate: (id: number) => void;
}

function activeProjectId(): number | null {
  const row = db.getFirstSync<{ id: number }>(
    'SELECT id FROM projects WHERE is_active = 1 ORDER BY id LIMIT 1'
  );
  return row?.id ?? null;
}

/** Re-derive each milestone's Gantt bar as an equal date-ordered slice of 0–100%. */
function recomputeMilestoneBars(projectId: number) {
  const rows = db.getAllSync<{ id: number }>(
    'SELECT id FROM milestones WHERE project_id = ? ORDER BY date, id', projectId
  );
  const n = rows.length;
  rows.forEach((r, i) => {
    db.runSync(
      'UPDATE milestones SET bar_start = ?, bar_end = ? WHERE id = ?',
      Math.round((i / n) * 100), Math.round(((i + 1) / n) * 100), r.id
    );
  });
}

/** Re-derive a card's check_done/check_total cache from its checklist items. */
function recomputeChecklistCounts(cardId: number) {
  const row = db.getFirstSync<{ total: number; done: number }>(
    'SELECT COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM card_checklist_items WHERE card_id = ?',
    cardId
  )!;
  if (row.total === 0) {
    db.runSync('UPDATE kanban_cards SET check_done = NULL, check_total = NULL WHERE id = ?', cardId);
  } else {
    db.runSync('UPDATE kanban_cards SET check_done = ?, check_total = ? WHERE id = ?', row.done, row.total, cardId);
  }
}

export const useWork = create<WorkState>((set, get) => ({
  projects: [],
  activeProject: null,
  cards: [],
  milestones: [],
  contacts: [],
  memos: [],
  minutes: [],
  sops: [],
  checklist: [],
  cardEvents: [],

  load: () => {
    const projRows = db.getAllSync<any>('SELECT * FROM projects ORDER BY id');
    const projects: Project[] = projRows.map((r) => ({
      id: r.id, name: r.name, deadline: r.deadline, isActive: !!r.is_active, coverUri: r.cover_uri,
    }));
    const active = projects.find((p) => p.isActive) ?? projects[0] ?? null;
    const pid = active?.id ?? -1;

    const cardRows = db.getAllSync<any>(
      'SELECT * FROM kanban_cards WHERE project_id = ? ORDER BY sort, id', pid
    );
    const msRows = db.getAllSync<any>('SELECT * FROM milestones WHERE project_id = ? ORDER BY date', pid);
    const contactRows = db.getAllSync<any>('SELECT * FROM contacts WHERE project_id = ? ORDER BY id', pid);
    const memoRows = db.getAllSync<any>('SELECT * FROM memos ORDER BY created_at DESC');
    const minuteRows = db.getAllSync<any>('SELECT * FROM minutes ORDER BY date DESC');
    const sopRows = db.getAllSync<any>('SELECT * FROM sop_templates ORDER BY id');
    const checklistRows = db.getAllSync<any>(
      `SELECT cci.* FROM card_checklist_items cci
       JOIN kanban_cards kc ON kc.id = cci.card_id
       WHERE kc.project_id = ? ORDER BY cci.card_id, cci.sort, cci.id`, pid
    );
    const eventRows = db.getAllSync<any>(
      'SELECT * FROM card_events WHERE project_id = ? ORDER BY changed_at DESC', pid
    );

    set({
      projects,
      activeProject: active,
      cards: cardRows.map((r) => ({
        id: r.id, projectId: r.project_id, col: r.col as ColKey, title: r.title,
        labels: parseJson<string[]>(r.labels_json, []),
        prio: (r.prio as KanbanCard['prio']) || 'low',
        due: r.due, who: r.who ?? '',
        checkDone: r.check_done, checkTotal: r.check_total,
        overdue: !!r.overdue, sort: r.sort,
      })),
      milestones: msRows.map((r) => ({
        id: r.id, projectId: r.project_id, title: r.title, date: r.date,
        status: r.status as Milestone['status'],
        barStart: r.bar_start, barEnd: r.bar_end,
        notifIds: parseJson<string[] | null>(r.notif_ids, null),
      })),
      contacts: contactRows.map((r) => ({
        id: r.id, projectId: r.project_id, name: r.name, role: r.role ?? '',
        phone: r.phone ?? '', note: r.note ?? '', tone: (r.tone as Contact['tone']) || 'neutral',
      })),
      memos: memoRows.map((r) => ({
        id: r.id, projectId: r.project_id, title: r.title,
        durationSec: r.duration_sec, uri: r.uri, createdAt: r.created_at,
      })),
      minutes: minuteRows.map((r) => ({
        id: r.id, projectId: r.project_id, title: r.title, date: r.date,
        items: parseJson<string[]>(r.items_json, []), linkedTask: r.linked_task,
      })),
      sops: sopRows.map((r) => ({
        id: r.id, name: r.name, icon: r.icon, items: parseJson<string[]>(r.items_json, []),
      })),
      checklist: checklistRows.map((r) => ({
        id: r.id, cardId: r.card_id, text: r.text, done: !!r.done, sort: r.sort,
      })),
      cardEvents: eventRows.map((r) => ({
        id: r.id, cardId: r.card_id, projectId: r.project_id,
        fromCol: r.from_col as ColKey | null, toCol: r.to_col as ColKey, changedAt: r.changed_at,
      })),
    });
  },

  addProject: (name, deadline, coverUri) => {
    db.runSync('UPDATE projects SET is_active = 0');
    db.runSync(
      'INSERT INTO projects (name, deadline, is_active, cover_uri) VALUES (?,?,1,?)',
      name, deadline, coverUri
    );
    get().load();
  },

  setActiveProject: (id) => {
    db.runSync('UPDATE projects SET is_active = 0');
    db.runSync('UPDATE projects SET is_active = 1 WHERE id = ?', id);
    get().load();
  },

  moveCard: (id, col) => {
    const card = get().cards.find((c) => c.id === id);
    db.runSync('UPDATE kanban_cards SET col = ?, overdue = 0 WHERE id = ?', col, id);
    if (card) {
      db.runSync(
        'INSERT INTO card_events (card_id, project_id, from_col, to_col, changed_at) VALUES (?,?,?,?,?)',
        id, card.projectId, card.col, col, Date.now()
      );
    }
    get().load();
  },

  advanceCard: (id) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const next = COL_ORDER[Math.min(COL_ORDER.indexOf(card.col) + 1, COL_ORDER.length - 1)];
    get().moveCard(id, next);
  },

  addCard: (col, title, who) => {
    const pid = activeProjectId();
    if (pid == null) return;
    const maxSort = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(sort), 0) AS m FROM kanban_cards WHERE project_id = ?', pid
    );
    db.runSync(
      "INSERT INTO kanban_cards (project_id, col, title, labels_json, prio, due, who, sort) VALUES (?,?,?,'[]','low',NULL,?,?)",
      pid, col, title, who, (maxSort?.m ?? 0) + 1
    );
    const inserted = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!;
    db.runSync(
      'INSERT INTO card_events (card_id, project_id, from_col, to_col, changed_at) VALUES (?,?,NULL,?,?)',
      inserted.id, pid, col, Date.now()
    );
    get().load();
  },

  updateCard: (id, patch) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    db.runSync(
      'UPDATE kanban_cards SET title = ?, labels_json = ?, prio = ?, due = ?, who = ? WHERE id = ?',
      patch.title ?? card.title,
      JSON.stringify(patch.labels ?? card.labels),
      patch.prio ?? card.prio,
      patch.due !== undefined ? patch.due : card.due,
      patch.who ?? card.who,
      id
    );
    get().load();
  },

  deleteCard: (id) => {
    db.runSync('DELETE FROM card_checklist_items WHERE card_id = ?', id);
    db.runSync('DELETE FROM card_events WHERE card_id = ?', id);
    db.runSync('DELETE FROM kanban_cards WHERE id = ?', id);
    get().load();
  },

  addChecklistItem: (cardId, text) => {
    const maxSort = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(sort), 0) AS m FROM card_checklist_items WHERE card_id = ?', cardId
    )!.m;
    db.runSync(
      'INSERT INTO card_checklist_items (card_id, text, done, sort) VALUES (?,?,0,?)',
      cardId, text, maxSort + 1
    );
    recomputeChecklistCounts(cardId);
    get().load();
  },

  toggleChecklistItem: (id) => {
    const item = get().checklist.find((i) => i.id === id);
    if (!item) return;
    db.runSync('UPDATE card_checklist_items SET done = ? WHERE id = ?', item.done ? 0 : 1, id);
    recomputeChecklistCounts(item.cardId);
    get().load();
  },

  deleteChecklistItem: (id) => {
    const item = get().checklist.find((i) => i.id === id);
    if (!item) return;
    db.runSync('DELETE FROM card_checklist_items WHERE id = ?', id);
    recomputeChecklistCounts(item.cardId);
    get().load();
  },

  addMilestone: (title, date, notifIds) => {
    const pid = activeProjectId();
    if (pid == null) return;
    db.runSync(
      "INSERT INTO milestones (project_id, title, date, status, bar_start, bar_end, notif_ids) VALUES (?,?,?,'todo',0,100,?)",
      pid, title, date, notifIds ? JSON.stringify(notifIds) : null
    );
    recomputeMilestoneBars(pid);
    get().load();
  },

  setMilestoneStatus: (id, status) => {
    db.runSync('UPDATE milestones SET status = ? WHERE id = ?', status, id);
    get().load();
  },

  deleteMilestone: (id) => {
    const row = db.getFirstSync<{ project_id: number }>('SELECT project_id FROM milestones WHERE id = ?', id);
    db.runSync('DELETE FROM milestones WHERE id = ?', id);
    if (row) recomputeMilestoneBars(row.project_id);
    get().load();
    return null;
  },

  addContact: (c) => {
    const pid = activeProjectId();
    if (pid == null) return;
    db.runSync(
      'INSERT INTO contacts (project_id, name, role, phone, note, tone) VALUES (?,?,?,?,?,?)',
      pid, c.name, c.role, c.phone, c.note, c.tone
    );
    get().load();
  },

  deleteContact: (id) => {
    db.runSync('DELETE FROM contacts WHERE id = ?', id);
    get().load();
  },

  addMemo: (title, durationSec, uri) => {
    const pid = activeProjectId();
    db.runSync(
      'INSERT INTO memos (project_id, title, duration_sec, uri, created_at) VALUES (?,?,?,?,?)',
      pid, title, durationSec, uri, Date.now()
    );
    get().load();
  },

  deleteMemo: (id) => {
    const memo = get().memos.find((m) => m.id === id) ?? null;
    db.runSync('DELETE FROM memos WHERE id = ?', id);
    get().load();
    return memo;
  },

  addMinute: (title, items, linkedTask) => {
    const pid = activeProjectId();
    db.runSync(
      'INSERT INTO minutes (project_id, title, date, items_json, linked_task) VALUES (?,?,?,?,?)',
      pid, title, new Date().toISOString().slice(0, 10), JSON.stringify(items), linkedTask
    );
    get().load();
  },

  deleteMinute: (id) => {
    db.runSync('DELETE FROM minutes WHERE id = ?', id);
    get().load();
  },

  loadSop: (sopId) => {
    const pid = activeProjectId();
    if (pid == null) return null;
    const sop = get().sops.find((s) => s.id === sopId);
    if (!sop) return null;
    const existing = new Set(get().cards.map((c) => c.title.toLowerCase()));
    let sort = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(sort), 0) AS m FROM kanban_cards WHERE project_id = ?', pid
    )!.m;
    for (const item of sop.items) {
      if (!existing.has(item.toLowerCase())) {
        sort += 1;
        db.runSync(
          "INSERT INTO kanban_cards (project_id, col, title, labels_json, prio, due, who, sort) VALUES (?,'todo',?,'[]','med',NULL,'',?)",
          pid, item, sort
        );
      }
    }
    get().load();
    return sop.name;
  },

  addSopTemplate: (name, icon, items) => {
    db.runSync(
      'INSERT INTO sop_templates (name, icon, items_json) VALUES (?,?,?)',
      name, icon, JSON.stringify(items)
    );
    get().load();
  },

  updateSopTemplate: (id, name, icon, items) => {
    db.runSync(
      'UPDATE sop_templates SET name = ?, icon = ?, items_json = ? WHERE id = ?',
      name, icon, JSON.stringify(items), id
    );
    get().load();
  },

  deleteSopTemplate: (id) => {
    db.runSync('DELETE FROM sop_templates WHERE id = ?', id);
    get().load();
  },
}));
