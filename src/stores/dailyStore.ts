import { create } from 'zustand';
import { addDays, db, isoDate } from '@/data/db';

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  /** last 7 days ending today: 0/1 */
  week: number[];
  today: boolean;
  streak: number;
}

export interface AgendaItem {
  id: number;
  date: string;
  time: string;
  title: string;
  area: 'daily' | 'travel' | 'work';
  done: boolean;
}

export interface Note {
  id: number;
  text: string;
  cat: 'idea' | 'todo' | 'buy' | 'note';
  createdAt: number;
}

interface DailyState {
  habits: Habit[];
  agenda: AgendaItem[];
  notes: Note[];
  focusToday: number;
  load: () => void;
  toggleHabitToday: (id: number) => void;
  addHabit: (name: string, icon: string, color: string) => void;
  deleteHabit: (id: number) => void;
  toggleAgenda: (id: number) => void;
  addAgenda: (title: string, time: string, area: AgendaItem['area']) => void;
  deleteAgenda: (id: number) => void;
  addNote: (text: string, cat: Note['cat']) => void;
  deleteNote: (id: number) => void;
  logFocusSession: (mode: string, minutes: number) => void;
}

function computeHabit(row: { id: number; name: string; icon: string; color: string }): Habit {
  const today = new Date();
  const dates = new Set(
    db
      .getAllSync<{ date: string }>('SELECT date FROM habit_logs WHERE habit_id = ?', row.id)
      .map((r) => r.date)
  );
  const week: number[] = [];
  for (let i = 6; i >= 0; i--) {
    week.push(dates.has(isoDate(addDays(today, -i))) ? 1 : 0);
  }
  const doneToday = dates.has(isoDate(today));
  // streak: consecutive days ending today (or yesterday if today not yet done)
  let streak = 0;
  let cursor = doneToday ? 0 : -1;
  while (dates.has(isoDate(addDays(today, cursor - streak)))) streak++;
  return { ...row, week, today: doneToday, streak };
}

export const useDaily = create<DailyState>((set, get) => ({
  habits: [],
  agenda: [],
  notes: [],
  focusToday: 0,

  load: () => {
    const habitRows = db.getAllSync<{ id: number; name: string; icon: string; color: string }>(
      'SELECT id, name, icon, color FROM habits ORDER BY id'
    );
    const agendaRows = db.getAllSync<{
      id: number; date: string; time: string; title: string; area: string; done: number;
    }>('SELECT * FROM agenda WHERE date = ? ORDER BY time', isoDate());
    const noteRows = db.getAllSync<{ id: number; text: string; cat: string; created_at: number }>(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    const focus = db.getFirstSync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM focus_sessions WHERE date = ? AND mode = 'focus'",
      isoDate()
    );
    set({
      habits: habitRows.map(computeHabit),
      agenda: agendaRows.map((r) => ({
        id: r.id, date: r.date, time: r.time, title: r.title,
        area: r.area as AgendaItem['area'], done: !!r.done,
      })),
      notes: noteRows.map((r) => ({
        id: r.id, text: r.text, cat: r.cat as Note['cat'], createdAt: r.created_at,
      })),
      focusToday: focus?.n ?? 0,
    });
  },

  toggleHabitToday: (id) => {
    const today = isoDate();
    const exists = db.getFirstSync(
      'SELECT 1 AS x FROM habit_logs WHERE habit_id = ? AND date = ?', id, today
    );
    if (exists) {
      db.runSync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', id, today);
    } else {
      db.runSync('INSERT INTO habit_logs (habit_id, date) VALUES (?,?)', id, today);
    }
    get().load();
  },

  addHabit: (name, icon, color) => {
    db.runSync(
      'INSERT INTO habits (name, icon, color, created_at) VALUES (?,?,?,?)',
      name, icon, color, Date.now()
    );
    get().load();
  },

  deleteHabit: (id) => {
    db.runSync('DELETE FROM habits WHERE id = ?', id);
    db.runSync('DELETE FROM habit_logs WHERE habit_id = ?', id);
    get().load();
  },

  toggleAgenda: (id) => {
    db.runSync('UPDATE agenda SET done = 1 - done WHERE id = ?', id);
    get().load();
  },

  addAgenda: (title, time, area) => {
    db.runSync(
      'INSERT INTO agenda (date, time, title, area, done) VALUES (?,?,?,?,0)',
      isoDate(), time, title, area
    );
    get().load();
  },

  deleteAgenda: (id) => {
    db.runSync('DELETE FROM agenda WHERE id = ?', id);
    get().load();
  },

  addNote: (text, cat) => {
    db.runSync('INSERT INTO notes (text, cat, created_at) VALUES (?,?,?)', text, cat, Date.now());
    get().load();
  },

  deleteNote: (id) => {
    db.runSync('DELETE FROM notes WHERE id = ?', id);
    get().load();
  },

  logFocusSession: (mode, minutes) => {
    db.runSync(
      'INSERT INTO focus_sessions (date, mode, minutes, completed_at) VALUES (?,?,?,?)',
      isoDate(), mode, minutes, Date.now()
    );
    get().load();
  },
}));
