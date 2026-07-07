import { create } from 'zustand';
import { db, parseJson } from '@/data/db';

export type ColKey = 'todo' | 'doing' | 'waiting' | 'done';
export const COL_ORDER: ColKey[] = ['todo', 'doing', 'waiting', 'done'];

export interface Project {
  id: number;
  name: string;
  deadline: string | null;
  isActive: boolean;
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

interface WorkState {
  projects: Project[];
  activeProject: Project | null;
  cards: KanbanCard[];
  milestones: Milestone[];
  contacts: Contact[];
  memos: Memo[];
  minutes: Minute[];
  sops: SopTemplate[];
  load: () => void;
  addProject: (name: string, deadline: string | null) => void;
  setActiveProject: (id: number) => void;
  // kanban
  moveCard: (id: number, col: ColKey) => void;
  advanceCard: (id: number) => void;
  addCard: (col: ColKey, title: string, who: string) => void;
  deleteCard: (id: number) => void;
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
}

function activeProjectId(): number | null {
  const row = db.getFirstSync<{ id: number }>(
    'SELECT id FROM projects WHERE is_active = 1 ORDER BY id LIMIT 1'
  );
  return row?.id ?? null;
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

  load: () => {
    const projRows = db.getAllSync<any>('SELECT * FROM projects ORDER BY id');
    const projects: Project[] = projRows.map((r) => ({
      id: r.id, name: r.name, deadline: r.deadline, isActive: !!r.is_active,
    }));
    const active = projects.find((p) => p.isActive) ?? projects[0] ?? null;
    const pid = active?.id ?? -1;

    const cardRows = db.getAllSync<any>(
      'SELECT * FROM kanban_cards WHERE project_id = ? ORDER BY sort, id', pid
    );
    // milestones live on whichever project has them; show active project's first, else any
    let msRows = db.getAllSync<any>('SELECT * FROM milestones WHERE project_id = ? ORDER BY date', pid);
    if (msRows.length === 0) {
      msRows = db.getAllSync<any>('SELECT * FROM milestones ORDER BY date');
    }
    const contactRows = db.getAllSync<any>('SELECT * FROM contacts WHERE project_id = ? ORDER BY id', pid);
    const memoRows = db.getAllSync<any>('SELECT * FROM memos ORDER BY created_at DESC');
    const minuteRows = db.getAllSync<any>('SELECT * FROM minutes ORDER BY date DESC');
    const sopRows = db.getAllSync<any>('SELECT * FROM sop_templates ORDER BY id');

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
    });
  },

  addProject: (name, deadline) => {
    db.runSync('UPDATE projects SET is_active = 0');
    db.runSync('INSERT INTO projects (name, deadline, is_active) VALUES (?,?,1)', name, deadline);
    get().load();
  },

  setActiveProject: (id) => {
    db.runSync('UPDATE projects SET is_active = 0');
    db.runSync('UPDATE projects SET is_active = 1 WHERE id = ?', id);
    get().load();
  },

  moveCard: (id, col) => {
    db.runSync('UPDATE kanban_cards SET col = ?, overdue = 0 WHERE id = ?', col, id);
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
    get().load();
  },

  deleteCard: (id) => {
    db.runSync('DELETE FROM kanban_cards WHERE id = ?', id);
    get().load();
  },

  addMilestone: (title, date, notifIds) => {
    const ms = get().milestones;
    const pid = ms[0]?.projectId ?? activeProjectId();
    if (pid == null) return;
    db.runSync(
      "INSERT INTO milestones (project_id, title, date, status, bar_start, bar_end, notif_ids) VALUES (?,?,?,'todo',74,100,?)",
      pid, title, date, notifIds ? JSON.stringify(notifIds) : null
    );
    get().load();
  },

  setMilestoneStatus: (id, status) => {
    db.runSync('UPDATE milestones SET status = ? WHERE id = ?', status, id);
    get().load();
  },

  deleteMilestone: (id) => {
    db.runSync('DELETE FROM milestones WHERE id = ?', id);
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
}));
