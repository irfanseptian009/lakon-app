import { create } from 'zustand';
import { db, isoDate, parseJson } from '@/data/db';

export interface Trip {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  days: number;
  tzLabel: string;
  budgetTotal: number;
  isActive: boolean;
}

export interface ItineraryItem {
  id: number;
  tripId: number;
  day: number;
  time: string;
  title: string;
  place: string;
  icon: string;
  tone: 'accent' | 'plain';
  pnr: string | null;
  gate: string | null;
  sort: number;
}

export type BagKey = 'checked' | 'cabin' | 'body';

export interface PackingItem {
  id: number;
  label: string;
  bag: BagKey;
  checked: boolean;
}

export interface PackingTemplate {
  id: number;
  name: string;
  icon: string;
  items: { label: string; bag: BagKey }[];
}

export interface PretripTask {
  id: number;
  label: string;
  done: boolean;
}

export interface BudgetCat {
  id: number;
  name: string;
  icon: string;
  color: string;
  est: number;
  actual: number;
}

export interface Expense {
  id: number;
  catId: number;
  name: string;
  amount: number;
  currency: string;
  rate: number;
  createdAt: number;
}

export interface Doc {
  id: number;
  name: string;
  meta: string;
  icon: string;
  uri: string | null;
  createdAt: number;
}

export interface CompOption {
  id: number;
  groupId: number;
  name: string;
  price: string;
  unit: string;
  facilities: string[];
  pros: string[];
  cons: string[];
  media: string[];
  selected: boolean;
}

export interface CompGroup {
  id: number;
  title: string;
  location: string;
  options: CompOption[];
}

interface TravelState {
  trip: Trip | null;
  itinerary: ItineraryItem[];
  dayNotes: Record<number, string>;
  packing: PackingItem[];
  templates: PackingTemplate[];
  pretrip: PretripTask[];
  cats: BudgetCat[];
  expenses: Expense[];
  fxRate: { code: string; rate: number };
  docs: Doc[];
  groups: CompGroup[];
  load: () => void;
  addTrip: (name: string, destination: string, startDate: string, days: number, budget: number) => void;
  // itinerary
  addItineraryItem: (item: Omit<ItineraryItem, 'id' | 'tripId' | 'sort'>) => void;
  deleteItineraryItem: (id: number) => void;
  setDayNote: (day: number, text: string) => void;
  // packing
  togglePacking: (id: number) => void;
  addPackingItem: (label: string, bag: BagKey) => void;
  deletePackingItem: (id: number) => void;
  loadTemplate: (templateId: number) => void;
  togglePretrip: (id: number) => void;
  addPretrip: (label: string) => void;
  deletePretrip: (id: number) => void;
  // finance
  addExpense: (catId: number, name: string, amount: number, currency: string, rate: number) => void;
  deleteExpense: (id: number) => void;
  setCatEst: (catId: number, est: number) => void;
  setFxRate: (code: string, rate: number) => void;
  // vault
  addDoc: (name: string, meta: string, icon: string, uri: string | null) => void;
  deleteDoc: (id: number) => void;
  // comparison
  selectOption: (groupId: number, optionId: number) => void;
  addOption: (groupId: number, o: { name: string; price: string; unit: string; facilities: string[]; pros: string[]; cons: string[] }) => void;
  deleteOption: (id: number) => void;
  addOptionMedia: (optionId: number, uri: string) => void;
  addGroup: (title: string, location: string) => void;
  /** convert selected option into a budget line + agenda hint (Mark as Selected flow) */
  promoteSelected: (option: CompOption) => void;
}

function activeTripId(): number | null {
  const row = db.getFirstSync<{ id: number }>(
    'SELECT id FROM trips WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
  );
  return row?.id ?? null;
}

export const useTravel = create<TravelState>((set, get) => ({
  trip: null,
  itinerary: [],
  dayNotes: {},
  packing: [],
  templates: [],
  pretrip: [],
  cats: [],
  expenses: [],
  fxRate: { code: 'USD', rate: 16000 },
  docs: [],
  groups: [],

  load: () => {
    const tripRow = db.getFirstSync<{
      id: number; name: string; destination: string; start_date: string;
      days: number; tz_label: string; budget_total: number; is_active: number;
    }>('SELECT * FROM trips WHERE is_active = 1 ORDER BY id DESC LIMIT 1');

    const trip: Trip | null = tripRow
      ? {
          id: tripRow.id, name: tripRow.name, destination: tripRow.destination ?? '',
          startDate: tripRow.start_date, days: tripRow.days, tzLabel: tripRow.tz_label ?? '',
          budgetTotal: tripRow.budget_total, isActive: !!tripRow.is_active,
        }
      : null;

    const tid = trip?.id ?? -1;

    const itin = db.getAllSync<any>(
      'SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY day, time, sort', tid
    );
    const dayNoteRows = db.getAllSync<{ day: number; text: string }>(
      'SELECT day, text FROM day_notes WHERE trip_id = ?', tid
    );
    const packRows = db.getAllSync<any>('SELECT * FROM packing_items WHERE trip_id = ? ORDER BY id', tid);
    const tmplRows = db.getAllSync<any>('SELECT * FROM packing_templates ORDER BY id');
    const preRows = db.getAllSync<any>('SELECT * FROM pretrip_tasks WHERE trip_id = ? ORDER BY id', tid);
    const catRows = db.getAllSync<any>('SELECT * FROM budget_cats WHERE trip_id = ? ORDER BY id', tid);
    const expRows = db.getAllSync<any>('SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC', tid);
    const fxRow = db.getFirstSync<{ code: string; rate: number }>('SELECT * FROM fx_rates LIMIT 1');
    const docRows = db.getAllSync<any>('SELECT * FROM documents ORDER BY created_at DESC');
    const groupRows = db.getAllSync<any>('SELECT * FROM comp_groups ORDER BY created_at DESC');

    const actualByCat = new Map<number, number>();
    for (const e of expRows) {
      actualByCat.set(e.cat_id, (actualByCat.get(e.cat_id) ?? 0) + e.amount * (e.rate || 1));
    }

    set({
      trip,
      itinerary: itin.map((r) => ({
        id: r.id, tripId: r.trip_id, day: r.day, time: r.time, title: r.title,
        place: r.place ?? '', icon: r.icon, tone: r.tone === 'accent' ? 'accent' : 'plain',
        pnr: r.pnr, gate: r.gate, sort: r.sort,
      })),
      dayNotes: Object.fromEntries(dayNoteRows.map((r) => [r.day, r.text])),
      packing: packRows.map((r) => ({
        id: r.id, label: r.label, bag: r.bag as BagKey, checked: !!r.checked,
      })),
      templates: tmplRows.map((r) => ({
        id: r.id, name: r.name, icon: r.icon,
        items: parseJson<{ label: string; bag: BagKey }[]>(r.items_json, []),
      })),
      pretrip: preRows.map((r) => ({ id: r.id, label: r.label, done: !!r.done })),
      cats: catRows.map((r) => ({
        id: r.id, name: r.name, icon: r.icon, color: r.color, est: r.est,
        actual: actualByCat.get(r.id) ?? 0,
      })),
      expenses: expRows.map((r) => ({
        id: r.id, catId: r.cat_id, name: r.name, amount: r.amount,
        currency: r.currency, rate: r.rate, createdAt: r.created_at,
      })),
      fxRate: fxRow ?? { code: 'USD', rate: 16000 },
      docs: docRows.map((r) => ({
        id: r.id, name: r.name, meta: r.meta ?? '', icon: r.icon, uri: r.uri, createdAt: r.created_at,
      })),
      groups: groupRows.map((g) => ({
        id: g.id, title: g.title, location: g.location ?? '',
        options: db
          .getAllSync<any>('SELECT * FROM comp_options WHERE group_id = ? ORDER BY id', g.id)
          .map((o) => ({
            id: o.id, groupId: o.group_id, name: o.name, price: o.price, unit: o.unit ?? '',
            facilities: parseJson<string[]>(o.facilities_json, []),
            pros: parseJson<string[]>(o.pros_json, []),
            cons: parseJson<string[]>(o.cons_json, []),
            media: parseJson<string[]>(o.media_json, []),
            selected: !!o.selected,
          })),
      })),
    });
  },

  addTrip: (name, destination, startDate, days, budget) => {
    db.runSync('UPDATE trips SET is_active = 0');
    db.runSync(
      'INSERT INTO trips (name, destination, start_date, days, tz_label, budget_total, is_active) VALUES (?,?,?,?,?,?,1)',
      name, destination, startDate, days, 'WIB · GMT+7', budget
    );
    const tid = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;
    // default budget categories for a fresh trip
    const defaults: [string, string, string][] = [
      ['Transportasi', 'plane', '#C8F03C'],
      ['Akomodasi', 'briefcase', '#101012'],
      ['Makanan', 'flame', '#2F8DFF'],
      ['Lain-lain', 'package', '#FFB020'],
    ];
    for (const [n, i, c] of defaults) {
      db.runSync(
        'INSERT INTO budget_cats (trip_id, name, icon, color, est) VALUES (?,?,?,?,?)',
        tid, n, i, c, Math.round(budget / 4)
      );
    }
    get().load();
  },

  addItineraryItem: (item) => {
    const tid = activeTripId();
    if (tid == null) return;
    db.runSync(
      'INSERT INTO itinerary_items (trip_id, day, time, title, place, icon, tone, pnr, gate, sort) VALUES (?,?,?,?,?,?,?,?,?,0)',
      tid, item.day, item.time, item.title, item.place, item.icon, item.tone, item.pnr, item.gate
    );
    get().load();
  },

  deleteItineraryItem: (id) => {
    db.runSync('DELETE FROM itinerary_items WHERE id = ?', id);
    get().load();
  },

  setDayNote: (day, text) => {
    const tid = activeTripId();
    if (tid == null) return;
    if (text.trim()) {
      db.runSync('INSERT OR REPLACE INTO day_notes (trip_id, day, text) VALUES (?,?,?)', tid, day, text);
    } else {
      db.runSync('DELETE FROM day_notes WHERE trip_id = ? AND day = ?', tid, day);
    }
    get().load();
  },

  togglePacking: (id) => {
    db.runSync('UPDATE packing_items SET checked = 1 - checked WHERE id = ?', id);
    get().load();
  },

  addPackingItem: (label, bag) => {
    const tid = activeTripId();
    if (tid == null) return;
    db.runSync('INSERT INTO packing_items (trip_id, label, bag, checked) VALUES (?,?,?,0)', tid, label, bag);
    get().load();
  },

  deletePackingItem: (id) => {
    db.runSync('DELETE FROM packing_items WHERE id = ?', id);
    get().load();
  },

  loadTemplate: (templateId) => {
    const tid = activeTripId();
    if (tid == null) return;
    const tmpl = get().templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    const existing = new Set(get().packing.map((p) => p.label.toLowerCase()));
    for (const item of tmpl.items) {
      if (!existing.has(item.label.toLowerCase())) {
        db.runSync(
          'INSERT INTO packing_items (trip_id, label, bag, checked) VALUES (?,?,?,0)',
          tid, item.label, item.bag
        );
      }
    }
    get().load();
  },

  togglePretrip: (id) => {
    db.runSync('UPDATE pretrip_tasks SET done = 1 - done WHERE id = ?', id);
    get().load();
  },

  addPretrip: (label) => {
    const tid = activeTripId();
    if (tid == null) return;
    db.runSync('INSERT INTO pretrip_tasks (trip_id, label, done) VALUES (?,?,0)', tid, label);
    get().load();
  },

  deletePretrip: (id) => {
    db.runSync('DELETE FROM pretrip_tasks WHERE id = ?', id);
    get().load();
  },

  addExpense: (catId, name, amount, currency, rate) => {
    const tid = activeTripId();
    if (tid == null) return;
    db.runSync(
      'INSERT INTO expenses (trip_id, cat_id, name, amount, currency, rate, created_at) VALUES (?,?,?,?,?,?,?)',
      tid, catId, name, amount, currency, rate, Date.now()
    );
    get().load();
  },

  deleteExpense: (id) => {
    db.runSync('DELETE FROM expenses WHERE id = ?', id);
    get().load();
  },

  setCatEst: (catId, est) => {
    db.runSync('UPDATE budget_cats SET est = ? WHERE id = ?', est, catId);
    get().load();
  },

  setFxRate: (code, rate) => {
    db.runSync('DELETE FROM fx_rates');
    db.runSync('INSERT INTO fx_rates (code, rate) VALUES (?,?)', code, rate);
    get().load();
  },

  addDoc: (name, meta, icon, uri) => {
    db.runSync(
      'INSERT INTO documents (name, meta, icon, uri, created_at) VALUES (?,?,?,?,?)',
      name, meta, icon, uri, Date.now()
    );
    get().load();
  },

  deleteDoc: (id) => {
    db.runSync('DELETE FROM documents WHERE id = ?', id);
    get().load();
  },

  selectOption: (groupId, optionId) => {
    db.runSync('UPDATE comp_options SET selected = 0 WHERE group_id = ?', groupId);
    db.runSync('UPDATE comp_options SET selected = 1 WHERE id = ?', optionId);
    get().load();
  },

  addOption: (groupId, o) => {
    db.runSync(
      'INSERT INTO comp_options (group_id, name, price, unit, facilities_json, pros_json, cons_json, media_json, selected) VALUES (?,?,?,?,?,?,?,?,0)',
      groupId, o.name, o.price, o.unit,
      JSON.stringify(o.facilities), JSON.stringify(o.pros), JSON.stringify(o.cons), '[]'
    );
    get().load();
  },

  deleteOption: (id) => {
    db.runSync('DELETE FROM comp_options WHERE id = ?', id);
    get().load();
  },

  addOptionMedia: (optionId, uri) => {
    const row = db.getFirstSync<{ media_json: string }>(
      'SELECT media_json FROM comp_options WHERE id = ?', optionId
    );
    const media = parseJson<string[]>(row?.media_json, []);
    media.push(uri);
    db.runSync('UPDATE comp_options SET media_json = ? WHERE id = ?', JSON.stringify(media), optionId);
    get().load();
  },

  addGroup: (title, location) => {
    db.runSync(
      'INSERT INTO comp_groups (title, location, created_at) VALUES (?,?,?)',
      title, location, Date.now()
    );
    get().load();
  },

  promoteSelected: (option) => {
    const tid = activeTripId();
    if (tid == null) return;
    // parse a numeric amount out of the price text if possible; else store as note-only
    const digits = option.price.replace(/[^\d]/g, '');
    const amount = digits ? Number(digits) : 0;
    const catRow = db.getFirstSync<{ id: number }>(
      "SELECT id FROM budget_cats WHERE trip_id = ? AND name = 'Akomodasi'", tid
    );
    if (catRow && amount > 0) {
      db.runSync(
        'INSERT INTO expenses (trip_id, cat_id, name, amount, currency, rate, created_at) VALUES (?,?,?,?,?,?,?)',
        tid, catRow.id, `Terpilih: ${option.name}`, amount, 'IDR', 1, Date.now()
      );
    }
    db.runSync(
      'INSERT INTO agenda (date, time, title, area, done) VALUES (?,?,?,?,0)',
      isoDate(), '10:00', `Booking ${option.name}`, 'travel'
    );
    get().load();
  },
}));
