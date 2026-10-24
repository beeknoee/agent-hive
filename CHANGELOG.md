# Changelog

## 0.1.2 — 中文

- Chinese UI: `language: 'zh'` translates the HUD (黄昏 · 17:42), legend, bubble prefixes, extra-staff roles, default room names (`LAYOUT_ZH`) and chat lines. `labels.phases` overrides the time-of-day words. Demo: `?lang=zh`.

## 0.1.1 — the office comes alive

- The chief walks around: every 40–70 s (while idle or running) they look over 1–2 working agents' shoulders, sit at the café for a coffee, then go back to the CEO desk. Option `chiefWalks` (default `true`).
- Small talk: now and then two people standing or sitting close together chat with purple speech bubbles (2–4 lines, Vietnamese or English); the chief asks how things are going when checking on someone. Options `chatter` (default `true`) and `chatLines` to supply your own lines. `info().troChuyen` lists the conversations in progress.
- Alerts (`error` / `needs_attention`): the status dot **inside the name label** blinks, instead of a separate red sphere next to the head.

## 0.1.0 — first public release

- 3D low-poly office: islands with LED trims and glass rails, café, meeting room, AI lab with a CEO desk, machine deck, QA lab, BD room, central planter.
- Agents walk to their desk / meeting room / café / alert ring according to their status; stable seats, labels that avoid overlapping, up to 3 speech bubbles, model badges.
- Extra staff: patrolling guard, technician, barista serving steaming coffee.
- Real-time sky: dawn · day · dusk · night (HUD shows `DAWN` / `DAY` / `DUSK` / `NIGHT`).
- English API (`name`, `status`, `room`, `task`, `shadows`, `quality`, `language`, `labels`, custom `{ islands, zones, bridges }` layouts, `position()`, English helper exports); the original Vietnamese names keep working.
- English or Vietnamese UI (`language: 'en' | 'vi'`), every string overridable.
- Custom layouts: target zones are found by zone type (`meeting`, `alert`, `cafe`, `ceo`), a planter is drawn at each `alert` zone.
- Options: `shadows`, `quality: 'high'` (night bloom, auto-off on slow machines), `wheelZoom: 'ctrl'`, `extraStaff`, `legend`, `clock`.
- React wrapper `agent-hive/react`; TypeScript types.
