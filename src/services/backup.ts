/**
 * Local backup & restore — serializes every table into a portable `.lakon`
 * JSON file in the app sandbox, shared via the OS share sheet. Restore reads
 * a picked file, validates, and rebuilds the database. No cloud involved.
 */
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '@/data/db';

const TABLES = [
  'settings',
  'habits', 'habit_logs', 'agenda', 'notes', 'focus_sessions',
  'trips', 'itinerary_items', 'day_notes', 'packing_items', 'packing_templates',
  'pretrip_tasks', 'budget_cats', 'expenses', 'fx_rates', 'documents',
  'comp_groups', 'comp_options',
  'projects', 'kanban_cards', 'milestones', 'contacts', 'memos', 'minutes', 'sop_templates',
] as const;

interface BackupFile {
  app: 'lakon';
  version: 1;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export async function createBackup(): Promise<string> {
  const data: BackupFile = {
    app: 'lakon',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {},
  };
  for (const table of TABLES) {
    data.tables[table] = db.getAllSync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }

  const dir = new Directory(Paths.document, 'backups');
  if (!dir.exists) dir.create({ intermediates: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const file = new File(dir, `lakon-backup-${stamp}.lakon`);
  file.write(JSON.stringify(data));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
  }
  return file.uri;
}

export async function restoreBackup(): Promise<boolean> {
  const picked = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: '*/*',
  });
  if (picked.canceled || !picked.assets?.[0]) return false;

  let parsed: BackupFile;
  try {
    const text = new File(picked.assets[0].uri).textSync();
    parsed = JSON.parse(text) as BackupFile;
  } catch {
    return false;
  }
  if (parsed.app !== 'lakon' || !parsed.tables) return false;

  db.withTransactionSync(() => {
    for (const table of TABLES) {
      db.runSync(`DELETE FROM ${table}`);
      const rows = parsed.tables[table] ?? [];
      for (const row of rows) {
        const keys = Object.keys(row);
        if (keys.length === 0) continue;
        const placeholders = keys.map(() => '?').join(',');
        db.runSync(
          `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
          ...keys.map((k) => row[k] as never)
        );
      }
    }
  });
  return true;
}
