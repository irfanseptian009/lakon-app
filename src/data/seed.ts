/**
 * First-run starter content — installs only the built-in, reusable packing
 * and SOP templates. No personal records (trips, habits, projects, contacts,
 * notes...) are ever created here: every real user starts with a clean,
 * empty account. Users can edit/delete the templates too.
 */
import { db, setSetting } from './db';

export function isSeeded(): boolean {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'seeded'"
  );
  return row?.value === '1';
}

/**
 * Clears every user-generated record (trips, habits, projects, notes, etc.)
 * for a full "Clear All Data" reset. Deliberately leaves `settings` (theme,
 * language, profile name, security prefs) and the built-in packing/SOP
 * templates untouched — those are app configuration and reusable content,
 * not personal data tied to a trip or project.
 */
export function wipeAll() {
  db.execSync(`
    DELETE FROM habits; DELETE FROM habit_logs; DELETE FROM agenda; DELETE FROM notes;
    DELETE FROM focus_sessions; DELETE FROM trips; DELETE FROM itinerary_items;
    DELETE FROM day_notes; DELETE FROM packing_items;
    DELETE FROM pretrip_tasks; DELETE FROM budget_cats; DELETE FROM expenses;
    DELETE FROM fx_rates; DELETE FROM documents; DELETE FROM comp_groups;
    DELETE FROM comp_options; DELETE FROM projects; DELETE FROM kanban_cards;
    DELETE FROM card_checklist_items; DELETE FROM card_events;
    DELETE FROM milestones; DELETE FROM contacts; DELETE FROM memos;
    DELETE FROM minutes;
  `);
}

export function seed() {
  db.withTransactionSync(() => {
    const templates = [
      {
        name: 'Trip Pantai', icon: 'package',
        items: [
          { label: 'Sunscreen SPF 50', bag: 'checked' },
          { label: 'Baju ganti 3 hari', bag: 'checked' },
          { label: 'Power bank 10.000mAh', bag: 'cabin' },
          { label: 'Charger + adapter', bag: 'cabin' },
          { label: 'Dompet + KTP', bag: 'body' },
          { label: 'Jaket tipis', bag: 'body' },
        ],
      },
      {
        name: 'Pindahan Kost', icon: 'package',
        items: [
          { label: 'Kardus besar x5', bag: 'checked' },
          { label: 'Lakban + gunting', bag: 'cabin' },
          { label: 'Dokumen kontrak kost', bag: 'body' },
          { label: 'Peralatan mandi', bag: 'cabin' },
          { label: 'Kasur lipat', bag: 'checked' },
        ],
      },
      {
        name: 'Perjalanan Bisnis', icon: 'briefcase',
        items: [
          { label: 'Laptop + charger', bag: 'cabin' },
          { label: 'Kemeja 2 lembar', bag: 'checked' },
          { label: 'Kartu nama', bag: 'body' },
          { label: 'Materi presentasi (offline)', bag: 'cabin' },
        ],
      },
    ];
    for (const t of templates) {
      db.runSync(
        'INSERT INTO packing_templates (name, icon, items_json) VALUES (?,?,?)',
        t.name, t.icon, JSON.stringify(t.items)
      );
    }

    const sops = [
      {
        name: 'SOP Pemotretan Wedding', icon: 'camera',
        items: ['Brief klien & moodboard', 'Survey lokasi', 'Checklist alat (kamera, lensa, lighting)', 'Backup memory card', 'Susun rundown hari-H', 'Kontrak & DP', 'Edit batch 1 (H+3)', 'Preview ke klien', 'Final delivery (H+14)'],
      },
      {
        name: 'SOP Pindah Kantor', icon: 'package',
        items: ['Inventaris aset', 'Vendor pindahan (3 penawaran)', 'Label kardus per divisi', 'Backup server lokal', 'Update alamat legal', 'Setting internet kantor baru'],
      },
      {
        name: 'SOP Onboarding Klien', icon: 'briefcase',
        items: ['Kirim welcome kit', 'Kontrak & invoice DP', 'Buat folder proyek', 'Kickoff meeting', 'Set jadwal review mingguan'],
      },
    ];
    for (const s of sops) {
      db.runSync(
        'INSERT INTO sop_templates (name, icon, items_json) VALUES (?,?,?)',
        s.name, s.icon, JSON.stringify(s.items)
      );
    }
  });

  setSetting('seeded', '1');
}
