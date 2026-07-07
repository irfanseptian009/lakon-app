/**
 * Structured PDF report — renders modules 1–4 (+ work summary) into an
 * executive-style HTML document, printed to a local PDF via expo-print,
 * then handed to the OS share sheet (local share intent).
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDaily } from '@/stores/dailyStore';
import { useTravel } from '@/stores/travelStore';
import { useWork } from '@/stores/workStore';

const fmtRp = (n: number) =>
  'Rp ' + (n >= 1000000 ? (n / 1000000).toFixed(1).replace('.', ',') + 'jt' : Math.round(n / 1000) + 'k');

export async function generateReport(userName: string): Promise<string> {
  const travel = useTravel.getState();
  const work = useWork.getState();
  const daily = useDaily.getState();

  const trip = travel.trip;
  const packDone = travel.packing.filter((p) => p.checked).length;
  const estTotal = travel.cats.reduce((s, c) => s + c.est, 0);
  const actTotal = travel.cats.reduce((s, c) => s + c.actual, 0);

  const itinRows = travel.itinerary
    .map(
      (i) => `<tr>
        <td class="mono">H${i.day} · ${i.time}</td>
        <td><b>${esc(i.title)}</b><br/><span class="muted">${esc(i.place)}</span></td>
        <td class="mono">${i.pnr ? `PNR ${esc(i.pnr)}` : ''} ${i.gate ? `· ${esc(i.gate)}` : ''}</td>
      </tr>`
    )
    .join('');

  const budgetRows = travel.cats
    .map((c) => {
      const over = c.actual > c.est;
      return `<tr>
        <td>${esc(c.name)}</td>
        <td class="mono">${fmtRp(c.est)}</td>
        <td class="mono">${fmtRp(c.actual)}</td>
        <td class="mono" style="color:${over ? '#D63638' : '#1B9C42'}">${over ? '+' : '−'}${fmtRp(Math.abs(c.actual - c.est))}</td>
      </tr>`;
    })
    .join('');

  const packRows = travel.packing
    .map(
      (p) =>
        `<li>${p.checked ? '☑' : '☐'} ${esc(p.label)} <span class="muted">· ${
          { checked: 'Bagasi', cabin: 'Kabin', body: 'On Body' }[p.bag]
        }</span></li>`
    )
    .join('');

  const groupBlocks = travel.groups
    .map((g) => {
      const sel = g.options.find((o) => o.selected);
      return `<p><b>${esc(g.title)}</b> — ${g.options.length} opsi${
        sel ? ` · terpilih: <b>${esc(sel.name)}</b> (${esc(sel.price)}${esc(sel.unit)})` : ''
      }</p>`;
    })
    .join('');

  const byCol = (col: string) => work.cards.filter((c) => c.col === col).length;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #101012; padding: 32px; font-size: 13px; }
    h1 { font-size: 26px; letter-spacing: -0.02em; margin: 0; }
    h2 { font-size: 15px; margin: 26px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #C8F03C; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; color: #797E88; font-weight: 700; }
    .muted { color: #797E88; font-size: 11px; }
    .mono { font-family: 'Courier New', monospace; font-size: 11.5px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #EEF0F3; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #797E88; }
    .hero { background: #101012; color: #fff; border-radius: 16px; padding: 20px 24px; margin-top: 16px; }
    .hero .big { font-size: 22px; font-weight: 800; }
    .lime { color: #C8F03C; }
    ul { margin: 4px 0; padding-left: 18px; }
    .stat { display: inline-block; margin-right: 28px; }
    .stat b { font-size: 18px; }
  </style></head><body>
    <div class="eyebrow">Lakon — Laporan Offline</div>
    <h1>Laporan Perencanaan</h1>
    <div class="muted">${esc(userName)} · ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })} · dibuat 100% offline</div>

    ${
      trip
        ? `<div class="hero">
            <div class="eyebrow" style="color:#9AA0AA">Trip Aktif</div>
            <div class="big">${esc(trip.name)} <span class="lime">· ${esc(trip.destination)}</span></div>
            <div style="margin-top:10px">
              <span class="stat"><b>${trip.startDate}</b><br/><span class="muted" style="color:#9AA0AA">berangkat</span></span>
              <span class="stat"><b>${trip.days} hari</b><br/><span class="muted" style="color:#9AA0AA">durasi</span></span>
              <span class="stat"><b>${packDone}/${travel.packing.length}</b><br/><span class="muted" style="color:#9AA0AA">packing</span></span>
              <span class="stat"><b>${fmtRp(trip.budgetTotal)}</b><br/><span class="muted" style="color:#9AA0AA">budget</span></span>
            </div>
          </div>`
        : ''
    }

    <h2>1 · Riset & Perbandingan</h2>
    ${groupBlocks || '<p class="muted">Belum ada comparison group.</p>'}

    <h2>2 · Itinerary</h2>
    <table><tr><th>Waktu</th><th>Aktivitas</th><th>Transit</th></tr>${itinRows || ''}</table>

    <h2>3 · Packing & Tugas Pra-Trip</h2>
    <ul>${packRows || '<li class="muted">Checklist kosong.</li>'}</ul>
    <ul>${travel.pretrip.map((t) => `<li>${t.done ? '☑' : '☐'} ${esc(t.label)}</li>`).join('')}</ul>

    <h2>4 · Budget — Estimasi vs Aktual</h2>
    <table>
      <tr><th>Kategori</th><th>Estimasi</th><th>Aktual</th><th>Selisih</th></tr>
      ${budgetRows}
      <tr><td><b>Total</b></td><td class="mono"><b>${fmtRp(estTotal)}</b></td><td class="mono"><b>${fmtRp(actTotal)}</b></td><td></td></tr>
    </table>
    <p class="muted">Rate manual: 1 ${travel.fxRate.code} = ${travel.fxRate.rate.toLocaleString('id-ID')} (tanpa API live)</p>

    <h2>5 · Dokumen Vault</h2>
    <ul>${travel.docs.map((d) => `<li>${esc(d.name)} <span class="muted">· ${esc(d.meta)}</span></li>`).join('') || '<li class="muted">Kosong.</li>'}</ul>

    <h2>Work — ${esc(work.activeProject?.name ?? '—')}</h2>
    <p>
      <span class="stat"><b>${byCol('todo')}</b><br/><span class="muted">to-do</span></span>
      <span class="stat"><b>${byCol('doing')}</b><br/><span class="muted">berjalan</span></span>
      <span class="stat"><b>${byCol('waiting')}</b><br/><span class="muted">menunggu</span></span>
      <span class="stat"><b>${byCol('done')}</b><br/><span class="muted">selesai</span></span>
    </p>
    <table><tr><th>Milestone</th><th>Tanggal</th><th>Status</th></tr>
      ${work.milestones.map((m) => `<tr><td>${esc(m.title)}</td><td class="mono">${m.date}</td><td>${m.status}</td></tr>`).join('')}
    </table>

    <h2>Harian</h2>
    <p>${daily.agenda.filter((a) => a.done).length}/${daily.agenda.length} agenda hari ini selesai · ${
      daily.habits.filter((h) => h.today).length
    }/${daily.habits.length} kebiasaan · ${daily.focusToday} sesi fokus</p>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareFile(uri: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
