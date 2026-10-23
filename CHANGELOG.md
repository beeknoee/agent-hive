# Changelog

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
