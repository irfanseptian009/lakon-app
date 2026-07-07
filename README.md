# Lakon — Offline Second Brain

**Lakon** (Bahasa Jawa: *the story / role one lives out*) is a privacy-first, **fully-offline** planning & itinerary manager built with **Expo SDK 57 / React Native 0.86**. Everything runs on-device — SQLite, local file sandbox, biometric auth. No accounts, no cloud, 100% private.

Implemented 1:1 from the **Singgah Design System** handoff (electric-lime `#C8F03C` + ink-black `#101012` + soft-white, Hanken Grotesk + Space Mono, pill buttons with circular icon discs, lime-circle active tabs, light + dark theme).

## Run

```bash
npm install
npm start          # Expo dev server → scan QR with Expo Go, or:
npm run android    # launch on Android
npm run ios        # launch on iOS (macOS)
```

> Biometrics, notifications, audio recording, and file sharing work best in a development build (`npx expo run:android`) or production build; Expo Go supports most of them too.

## Workspaces & modules

Switched from the top-left pill (**Harian / Travel / Work**) — each swaps the screen set and bottom nav.

### Harian (Daily)
| Screen | Features |
|---|---|
| Hari Ini | Daily score ring, habit mini-rings, cross-area agenda timeline (add/check/delete) |
| Kebiasaan | Weekly habit grid, streak tracking, today toggle, add/delete habits |
| Fokus | Working Pomodoro (25/5/15) on a ring, session log to SQLite |
| Inbox | Quick-capture composer with categories (Ide/Tugas/Belanja/Catatan) |

### Travel
| Screen | Module | Features |
|---|---|---|
| Beranda | M2 | Countdown badge, real weekly-activity bar chart, packing progress, budget stat tiles, upcoming itinerary, new-trip creator |
| Riset | M1 | Comparison groups, option cards (price, facility chips, pros/cons matrix), **offline media caching** (photos copied into the app sandbox), **Mark as Selected** → pushes a budget line + booking agenda |
| Jadwal | M2 | Day tabs, time-blocked timeline, **Transit Hub** (PNR / gate / seat in mono), editable offline routing note |
| Budget | M4 | Estimated vs Actual segmented view, locally-rendered SVG donut, category matrix (long-press to edit estimates), **manual multi-currency rate** (no live API) |
| Vault | M5 | **Biometric lock gate**, secure document list (files copied offline), **structured PDF report** (modules 1–4) + local share intent |
| Packing | M3 | Templates (Trip Pantai / Pindahan Kost / Bisnis), bag-allocation tags (Bagasi/Kabin/On Body), pre-trip admin checklist |

### Work
| Screen | Module | Features |
|---|---|---|
| Proyek | M10 | Active-project overview + switcher, quick tiles, **loadable SOP templates** → board cards |
| Board | M6 | 4-column Kanban (tap to advance, long-press to move/delete), WIP limits, priority spines, checklist progress, inline add-card |
| Timeline | M7 | Mini-Gantt on ink card, milestone list (tap to cycle status), **local H-3/H-1 notifications** (device-side, offline) |
| Kontak | M8 | Per-project directory isolated from the phone book, search, tap-to-call |
| Catatan | M9 | **Offline voice recorder** (.m4a into the app sandbox) with playback, task-linked meeting minutes |

### Settings (gear, top-right)
Biometric app lock + auto-lock (relocks after 60s in background), **backup/restore `.lakon` file**, full PDF export, dark mode, local notifications toggle, **Bahasa Indonesia ⇄ English**, profile name, demo-data reset.

## Architecture

```
src/
  app/          expo-router entry (_layout: fonts, db init, providers)
  theme/        design tokens (1:1 from the handoff CSS) + ThemeContext
  i18n/         ID/EN dictionaries + useI18n
  data/         expo-sqlite schema + demo seed (dates relative to today)
  stores/       zustand stores mirroring SQLite (daily / travel / work / nav / settings)
  services/     biometric, local notifications, PDF (expo-print), backup, media sandbox
  ui/           15 design-system primitives (Button, Ring, Chip, BottomNav, …)
  shell/        AppShell (workspace switcher, lock, onboarding)
  screens/      15 screens + Settings
```

SQLite is the source of truth; every mutation writes to the DB, then refreshes the in-memory store. The demo seed reproduces the design-handoff content so the app boots looking exactly like the mockups.
