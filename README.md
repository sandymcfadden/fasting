# Fasting Calendar

A simple web app for planning and tracking intermittent fasting schedules. Set up a fasting plan, see it laid out on a monthly calendar, and log how each day went. All data is stored in your browser — nothing is sent to a server.

**Live app:** [fasting.sandym.ca](https://fasting.sandym.ca)

---

## Fasting types

The app supports seven fasting styles:

| Type | Fast | Eat | Description |
|------|------|-----|-------------|
| 12/12 | 12 hrs | 12 hrs | Beginner-friendly, even split |
| 14/10 | 14 hrs | 10 hrs | Gentle step up |
| 16/8 | 16 hrs | 8 hrs | The most common method |
| 18/6 | 18 hrs | 6 hrs | Narrower eating window |
| 20/4 | 20 hrs | 4 hrs | Advanced |
| OMAD | ~23 hrs | 1 hr | One Meal A Day |
| Complete | 24 hrs | — | Full 24-hour fast |

---

## How to use it

### 1. Create a schedule

Tap **Schedules** in the top navigation, then **+ New**.

- **Name** — optional label (e.g. "Summer plan")
- **Starts on** — the date your schedule takes effect
- **Pattern** — one or more segments that define your fasting cycle

**Simple (every day the same):** Add one segment, pick a fasting type, set days to 1. It repeats daily.

**Cycle (mix of types):** Add multiple segments. For example:
- OMAD × 9 days
- Complete × 3 days

This creates a 12-day cycle that keeps repeating.

A coloured preview shows what the cycle looks like before you save.

**Switching plans:** When you want to change your fasting style, create a new schedule starting from the date you want to switch. Your past data is preserved — the old schedule stays active for historical dates, and the new one takes over from its start date.

---

### 2. Read the calendar

The **Calendar** view shows the current month. Each day is colour-coded by its fasting type:

- **Green shades** — lighter fasting (12/12, 14/10)
- **Blue** — 16/8
- **Purple shades** — heavier fasting (18/6, 20/4)
- **Orange** — OMAD
- **Red** — Complete fast
- **Grey** — no schedule set for that day

A legend at the bottom of the calendar shows all the colours. Use the **‹** and **›** arrows to navigate between months.

---

### 3. Log a day

Tap any day to open a detail panel. For today or past days, you can record how it went:

- **✓ Completed** — you stuck to the plan
- **~ Partial** — you fasted but not the full window
- **✗ Skipped** — didn't fast that day

Add optional notes, then tap **Save**. The calendar shows a small status icon on logged days. You can change or clear a log by tapping the day again.

Future dates open the detail panel to show what's planned but don't let you log yet.

---

### 4. Back up your data

Everything is stored in your browser's local database (IndexedDB), so it doesn't transfer automatically if you switch browsers or devices.

Go to **Schedules** and scroll to the **Backup & restore** section.

**Export** — downloads a `fasting-backup-YYYY-MM-DD.json` file containing all your schedules and logged days.

**Import** — select a previously exported file. You'll be asked to choose:

- **Replace all** — wipes the current data and loads the backup. Use this when moving to a new browser or device.
- **Merge** — adds records from the backup and updates any conflicts with the imported values. Records not in the backup are kept. Useful for combining data from two sources.

Back up before switching browsers or reinstalling, since clearing browser data will erase everything.

---

## Install as an app (PWA)

The app works as a Progressive Web App, which means you can install it on your home screen and use it like a native app.

**iPhone / iPad (Safari):** Tap the share icon → "Add to Home Screen"

**Android (Chrome):** Tap the three-dot menu → "Add to Home Screen" or "Install app"

**Desktop (Chrome / Edge):** Click the install icon in the address bar

Once installed, it opens full-screen without a browser toolbar.

---

## Run it yourself

If you want to host your own copy:

```bash
git clone https://github.com/sandymcfadden/fasting.git
cd fasting
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
npm run build
```

The output goes to `dist/` and can be hosted on any static file host.
