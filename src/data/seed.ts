/**
 * Demo seed — mirrors the design-handoff prototype content so the app boots
 * looking exactly like the mockups. Dates are relative to "today" so the
 * demo stays alive. Users can edit/delete everything.
 */
import { addDays, db, isoDate, setSetting } from './db';

export function isSeeded(): boolean {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'seeded'"
  );
  return row?.value === '1';
}

export function wipeAll() {
  db.execSync(`
    DELETE FROM habits; DELETE FROM habit_logs; DELETE FROM agenda; DELETE FROM notes;
    DELETE FROM focus_sessions; DELETE FROM trips; DELETE FROM itinerary_items;
    DELETE FROM day_notes; DELETE FROM packing_items; DELETE FROM packing_templates;
    DELETE FROM pretrip_tasks; DELETE FROM budget_cats; DELETE FROM expenses;
    DELETE FROM fx_rates; DELETE FROM documents; DELETE FROM comp_groups;
    DELETE FROM comp_options; DELETE FROM projects; DELETE FROM kanban_cards;
    DELETE FROM milestones; DELETE FROM contacts; DELETE FROM memos;
    DELETE FROM minutes; DELETE FROM sop_templates;
    DELETE FROM sqlite_sequence;
  `);
}

export function seed() {
  const now = Date.now();
  const today = new Date();
  const d = (n: number) => isoDate(addDays(today, n));

  db.withTransactionSync(() => {
    /* ===== Daily ===== */
    const habits = [
      { name: 'Minum 8 gelas air', icon: 'zap', color: '#2F8DFF' },
      { name: 'Olahraga 30 menit', icon: 'flame', color: '#2FD25A' },
      { name: 'Baca 10 halaman', icon: 'file-text', color: '#FFB020' },
      { name: 'Tidur sebelum 11', icon: 'moon', color: '#93B814' },
    ];
    const habitWeeks = [
      [1, 1, 1, 1, 1, 0, 0],
      [1, 0, 1, 1, 1, 0, 0],
      [1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 0, 0],
    ];
    habits.forEach((h, hi) => {
      db.runSync(
        'INSERT INTO habits (name, icon, color, created_at) VALUES (?,?,?,?)',
        h.name, h.icon, h.color, now
      );
      const habitId = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;
      // paint the past 12 days so streaks look real, then this week's pattern
      for (let back = 12; back >= 7; back--) {
        if (hi === 0 || (hi === 3 && back % 2 === 0) || (hi === 1 && back % 3 !== 0)) {
          db.runSync('INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?,?)', habitId, d(-back));
        }
      }
      habitWeeks[hi].forEach((v, i) => {
        if (v) db.runSync('INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?,?)', habitId, d(i - 6));
      });
    });

    const agenda = [
      { time: '07:00', title: 'Olahraga pagi', area: 'daily', done: 1 },
      { time: '09:00', title: 'Standup — Wedding A', area: 'work', done: 1 },
      { time: '13:00', title: 'Tasting catering Bu Linda', area: 'work', done: 0 },
      { time: '16:00', title: 'Packing checklist Trip Bali', area: 'travel', done: 0 },
      { time: '20:00', title: 'Jurnal & refleksi', area: 'daily', done: 0 },
    ];
    for (const a of agenda) {
      db.runSync(
        'INSERT INTO agenda (date, time, title, area, done) VALUES (?,?,?,?,?)',
        d(0), a.time, a.title, a.area, a.done
      );
    }

    const notes = [
      { text: 'Cek promo tiket kereta buat mudik Lebaran', cat: 'idea', at: now - 5 * 60000 },
      { text: 'Beli kado ulang tahun Dewi — voucher buku?', cat: 'buy', at: now - 2 * 3600000 },
      { text: 'Follow up vendor catering soal menu vegetarian', cat: 'todo', at: now - 26 * 3600000 },
      { text: 'Ide konten: "5 barang wajib pindahan kost"', cat: 'idea', at: now - 30 * 3600000 },
      { text: 'Backup foto trip ke storage lokal', cat: 'note', at: now - 50 * 3600000 },
    ];
    for (const n of notes) {
      db.runSync('INSERT INTO notes (text, cat, created_at) VALUES (?,?,?)', n.text, n.cat, n.at);
    }

    db.runSync(
      'INSERT INTO focus_sessions (date, mode, minutes, completed_at) VALUES (?,?,?,?),(?,?,?,?)',
      d(0), 'focus', 25, now - 3 * 3600000,
      d(0), 'focus', 25, now - 1 * 3600000
    );

    /* ===== Travel ===== */
    db.runSync(
      'INSERT INTO trips (name, destination, start_date, days, tz_label, budget_total, is_active) VALUES (?,?,?,?,?,?,?)',
      'Trip Bali', 'Denpasar, Bali', d(3), 3, 'WITA · GMT+8', 12400000, 1
    );
    const tripId = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;

    const itin: [number, string, string, string, string, string, string | null, string | null][] = [
      [1, '06:00', 'Garuda GA-402', 'CGK → DPS · Terminal 3', 'plane', 'accent', 'XR8K2', '7 · 14B'],
      [1, '09:30', 'Tiba di DPS', 'Ambil bagasi, sewa motor', 'map-pin', 'plain', null, null],
      [1, '11:00', 'Check-in Villa Ubud', 'Jl. Monkey Forest No. 8', 'briefcase', 'plain', null, null],
      [1, '13:00', 'Makan + Tegallalang', 'Catatan rute di bawah', 'map', 'plain', null, null],
      [2, '08:00', 'Sunrise Campuhan Ridge', 'Jalan kaki dari villa', 'mountain', 'accent', null, null],
      [2, '12:00', 'Lunch di Sayan', 'Rekomendasi host', 'flame', 'plain', null, null],
      [2, '15:00', 'Pasar Seni Ubud', 'Oleh-oleh & suvenir', 'map-pin', 'plain', null, null],
      [3, '10:00', 'Check-out villa', 'Simpan bagasi di lobi', 'briefcase', 'plain', null, null],
      [3, '14:00', 'Pantai Sanur', 'Santai sebelum pulang', 'map', 'plain', null, null],
      [3, '19:30', 'Garuda GA-411', 'DPS → CGK', 'plane', 'accent', 'XR8K2', '3 · 21C'],
    ];
    itin.forEach((it, i) => {
      db.runSync(
        'INSERT INTO itinerary_items (trip_id, day, time, title, place, icon, tone, pnr, gate, sort) VALUES (?,?,?,?,?,?,?,?,?,?)',
        tripId, it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], i
      );
    });
    db.runSync(
      'INSERT INTO day_notes (trip_id, day, text) VALUES (?,?,?)',
      tripId, 1,
      'Dari villa, ke arah utara 2km lewat Jl. Raya Ubud. Belok kanan di pertigaan pasar seni, lurus sampai ketemu papan "Tegallalang Rice Terrace".'
    );

    const packing: [string, string, number][] = [
      ['Sunscreen SPF 50', 'checked', 1],
      ['Baju ganti 3 hari', 'checked', 1],
      ['Power bank 10.000mAh', 'cabin', 1],
      ['Charger + adapter', 'cabin', 0],
      ['Dompet + KTP', 'body', 1],
      ['Jaket tipis', 'body', 0],
    ];
    for (const p of packing) {
      db.runSync(
        'INSERT INTO packing_items (trip_id, label, bag, checked) VALUES (?,?,?,?)',
        tripId, p[0], p[1], p[2]
      );
    }

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

    const pretrip: [string, number][] = [
      ['Bayar DP villa', 1],
      ['Print tiket pesawat', 1],
      ['Konfirmasi kedatangan', 0],
    ];
    for (const p of pretrip) {
      db.runSync('INSERT INTO pretrip_tasks (trip_id, label, done) VALUES (?,?,?)', tripId, p[0], p[1]);
    }

    const cats: [string, string, string, number][] = [
      ['Transportasi', 'plane', '#C8F03C', 4500000],
      ['Akomodasi', 'briefcase', '#101012', 3400000],
      ['Makanan', 'flame', '#2F8DFF', 2500000],
      ['Lain-lain', 'package', '#FFB020', 1600000],
    ];
    const catIds: number[] = [];
    for (const c of cats) {
      db.runSync(
        'INSERT INTO budget_cats (trip_id, name, icon, color, est) VALUES (?,?,?,?,?)',
        tripId, c[0], c[1], c[2], c[3]
      );
      catIds.push(db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id);
    }
    const expenses: [number, string, number][] = [
      [0, 'Tiket Garuda PP', 4200000],
      [1, 'Villa Ubud 2 malam', 1700000],
      [1, 'DP villa', 1700000],
      [2, 'Kuliner hari 1', 1400000],
      [2, 'Kuliner hari 2', 1500000],
      [3, 'Sewa motor + bensin', 900000],
      [3, 'Oleh-oleh', 900000],
    ];
    for (const e of expenses) {
      db.runSync(
        'INSERT INTO expenses (trip_id, cat_id, name, amount, currency, rate, created_at) VALUES (?,?,?,?,?,?,?)',
        tripId, catIds[e[0]], e[1], e[2], 'IDR', 1, now
      );
    }
    db.runSync("INSERT OR REPLACE INTO fx_rates (code, rate) VALUES ('USD', 16000)");

    const docs: [string, string, string][] = [
      ['KTP — Sari Wijaya', 'Kartu Identitas · JPG', 'file-text'],
      ['Paspor', 'C 1234567 · exp 2029', 'file-text'],
      ['Tiket Garuda GA-402', 'E-ticket · PDF', 'plane'],
      ['Booking Villa Ubud', 'Konfirmasi · PDF', 'briefcase'],
    ];
    for (const doc of docs) {
      db.runSync(
        'INSERT INTO documents (name, meta, icon, uri, created_at) VALUES (?,?,?,?,?)',
        doc[0], doc[1], doc[2], null, now
      );
    }

    db.runSync(
      'INSERT INTO comp_groups (title, location, created_at) VALUES (?,?,?)',
      'Kandidat Kost Jaksel', 'Jakarta Selatan', now
    );
    const groupId = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;
    const options = [
      {
        name: 'Kost Bapak Budi', price: 'Rp 1.2jt', unit: '/bulan',
        fac: ['WiFi', 'AC', 'K. Mandi Dalam', 'Dapur'],
        pros: ['Dekat kampus', 'Ada dapur'], cons: ['Parkir sempit'], sel: 1,
      },
      {
        name: 'Kost Bu Sari', price: 'Rp 950k', unit: '/bulan',
        fac: ['WiFi', 'Kipas', 'K. Mandi Luar'],
        pros: ['Murah', 'Tenang'], cons: ['Tanpa AC', '1.8km ke kampus'], sel: 0,
      },
    ];
    for (const o of options) {
      db.runSync(
        'INSERT INTO comp_options (group_id, name, price, unit, facilities_json, pros_json, cons_json, media_json, selected) VALUES (?,?,?,?,?,?,?,?,?)',
        groupId, o.name, o.price, o.unit,
        JSON.stringify(o.fac), JSON.stringify(o.pros), JSON.stringify(o.cons), '[]', o.sel
      );
    }

    /* ===== Work ===== */
    db.runSync(
      'INSERT INTO projects (name, deadline, is_active) VALUES (?,?,?)',
      'Wedding Andi & Sera', d(12), 1
    );
    const projId = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;
    db.runSync("INSERT INTO projects (name, deadline, is_active) VALUES ('Renovasi Rumah', ?, 0)", d(30));
    const projId2 = db.getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')!.id;
    db.runSync("INSERT INTO projects (name, deadline, is_active) VALUES ('Konten Q3', ?, 0)", d(45));

    const cards = [
      { col: 'todo', title: 'Survey lokasi venue outdoor', labels: ['venue'], prio: 'high', due: d(1), who: 'Rian P', cd: 1, ct: 4 },
      { col: 'todo', title: 'Brief konsep dekorasi rustic', labels: ['decor'], prio: 'med', due: d(2), who: 'Dewi K', cd: null, ct: null },
      { col: 'doing', title: 'Edit foto prewedding batch 1', labels: ['editing'], prio: 'med', due: d(0), who: 'Rian P', cd: 6, ct: 10 },
      { col: 'doing', title: 'Final layout undangan', labels: ['decor'], prio: 'low', due: d(1), who: 'Dewi K', cd: null, ct: null },
      { col: 'waiting', title: 'Approval mockup undangan', labels: ['client'], prio: 'high', due: d(-1), who: 'Klien', cd: null, ct: null, overdue: 1 },
      { col: 'done', title: 'DP venue lunas', labels: ['budget'], prio: 'med', due: d(-4), who: 'Dewi K', cd: 2, ct: 2 },
    ];
    cards.forEach((c, i) => {
      db.runSync(
        'INSERT INTO kanban_cards (project_id, col, title, labels_json, prio, due, who, check_done, check_total, overdue, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        projId, c.col, c.title, JSON.stringify(c.labels), c.prio, c.due, c.who, c.cd, c.ct, c.overdue ?? 0, i
      );
    });

    const milestones = [
      { title: 'Desain & Konsep Selesai', date: d(-9), status: 'done', b: [0, 28] },
      { title: 'Pembelian Material', date: d(-2), status: 'done', b: [22, 52] },
      { title: 'Pengerjaan Struktur', date: d(11), status: 'active', b: [48, 78] },
      { title: 'Finishing & Cat', date: d(24), status: 'todo', b: [74, 100] },
    ];
    for (const m of milestones) {
      db.runSync(
        'INSERT INTO milestones (project_id, title, date, status, bar_start, bar_end) VALUES (?,?,?,?,?,?)',
        projId2, m.title, m.date, m.status, m.b[0], m.b[1]
      );
    }

    const contacts = [
      { name: 'Pak Joko', role: 'Kontraktor', phone: '0812-3456-7890', note: 'Nego turun 8%, mulai 1 Jul', tone: 'accent' },
      { name: 'Bu Linda', role: 'Vendor Catering', phone: '0857-1122-3344', note: 'Tasting menu 28 Jun', tone: 'info' },
      { name: 'CV Maju Jaya', role: 'Tukang Ledeng', phone: '0821-9988-7766', note: 'Standby on-call', tone: 'warning' },
      { name: 'Sera A.', role: 'Klien', phone: '0813-5566-7788', note: 'Approval via WA', tone: 'neutral' },
    ];
    for (const c of contacts) {
      db.runSync(
        'INSERT INTO contacts (project_id, name, role, phone, note, tone) VALUES (?,?,?,?,?,?)',
        projId, c.name, c.role, c.phone, c.note, c.tone
      );
    }

    db.runSync(
      'INSERT INTO memos (project_id, title, duration_sec, uri, created_at) VALUES (?,?,?,?,?),(?,?,?,?,?)',
      projId, 'Briefing klien — konsep rustic', 134, null, now - 5 * 3600000,
      projId, 'Survei venue outdoor', 348, null, now - 29 * 3600000
    );

    db.runSync(
      'INSERT INTO minutes (project_id, title, date, items_json, linked_task) VALUES (?,?,?,?,?)',
      projId, 'Rapat Vendor', d(-6),
      JSON.stringify([
        'Catering fix menu paket B, 150 pax.',
        'Dekorasi rustic, deadline mockup H-1.',
        'DP tahap 2 cair setelah approval klien.',
      ]),
      'Task #4'
    );

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

export function reseed() {
  wipeAll();
  seed();
}
