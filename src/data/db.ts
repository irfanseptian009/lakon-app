/**
 * Lakon local database — expo-sqlite, fully offline.
 * The DB is the single source of truth; zustand stores mirror it in memory.
 */
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('lakon.db');

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    -- ===== Daily =====
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'zap',
      color TEXT NOT NULL DEFAULT '#2F8DFF',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (habit_id, date)
    );
    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      area TEXT NOT NULL DEFAULT 'daily',
      done INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      cat TEXT NOT NULL DEFAULT 'note',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      mode TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      completed_at INTEGER NOT NULL
    );

    -- ===== Travel =====
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      destination TEXT,
      start_date TEXT NOT NULL,
      days INTEGER NOT NULL DEFAULT 3,
      tz_label TEXT DEFAULT 'WIB · GMT+7',
      budget_total REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS itinerary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      day INTEGER NOT NULL DEFAULT 1,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      place TEXT,
      icon TEXT NOT NULL DEFAULT 'map-pin',
      tone TEXT NOT NULL DEFAULT 'plain',
      pnr TEXT,
      gate TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS day_notes (
      trip_id INTEGER NOT NULL,
      day INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (trip_id, day)
    );
    CREATE TABLE IF NOT EXISTS packing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      bag TEXT NOT NULL DEFAULT 'checked',
      checked INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS packing_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'package',
      items_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pretrip_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS budget_cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'package',
      color TEXT NOT NULL DEFAULT '#C8F03C',
      est REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      cat_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      rate REAL NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fx_rates (
      code TEXT PRIMARY KEY NOT NULL,
      rate REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      meta TEXT,
      icon TEXT NOT NULL DEFAULT 'file-text',
      uri TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS comp_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS comp_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      unit TEXT,
      facilities_json TEXT NOT NULL DEFAULT '[]',
      pros_json TEXT NOT NULL DEFAULT '[]',
      cons_json TEXT NOT NULL DEFAULT '[]',
      media_json TEXT NOT NULL DEFAULT '[]',
      selected INTEGER NOT NULL DEFAULT 0
    );

    -- ===== Work =====
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      deadline TEXT,
      is_active INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS kanban_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      col TEXT NOT NULL DEFAULT 'todo',
      title TEXT NOT NULL,
      labels_json TEXT NOT NULL DEFAULT '[]',
      prio TEXT NOT NULL DEFAULT 'low',
      due TEXT,
      who TEXT,
      check_done INTEGER,
      check_total INTEGER,
      overdue INTEGER NOT NULL DEFAULT 0,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      bar_start REAL NOT NULL DEFAULT 0,
      bar_end REAL NOT NULL DEFAULT 100,
      notif_ids TEXT
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      note TEXT,
      tone TEXT NOT NULL DEFAULT 'neutral'
    );
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      uri TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS minutes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      items_json TEXT NOT NULL DEFAULT '[]',
      linked_task TEXT
    );
    CREATE TABLE IF NOT EXISTS sop_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'briefcase',
      items_json TEXT NOT NULL DEFAULT '[]'
    );
  `);
}

/* ---------- tiny helpers ---------- */

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** YYYY-MM-DD in local time */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
