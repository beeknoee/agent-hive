# AGENTS.md — guide for AI coding assistants

This file is for AI assistants (Claude Code, Cursor, Copilot, Codex, …). Use it to **add agent-hive to a user's project** or to **work on this repository**. People should read [README.md](README.md) first.

agent-hive renders a 3D office where each of the user's AI agents (bots, cron jobs, workers, pipelines…) is a little employee. The user gives you a list of agents with a status, and the office shows who is working, idle, waiting for approval, failing, or needing a human. It is made by [Beeknoee](https://beeknoee.com) and MIT licensed.

---

## A. Integrating agent-hive into a user's app

### 1. Install

```bash
npm install three github:beeknoee/agent-hive
```

- `three` is a peer dependency, version ≥ 0.160.
- `react` ≥ 18 is only needed for the React component.
- The package ships plain ES modules with no build step. Import it from `'agent-hive'` (vanilla) or `'agent-hive/react'`.

### 2. Map the user's data to agents

This is the main job. Find where the user's app already knows about its agents, jobs or bots, and their state. Then write **one mapping function**:

```js
// Example: the user's jobs → agent-hive agents
function toHiveAgents(jobs) {
  return jobs.map(j => ({
    id: j.id,                                  // stable, unique
    name: j.displayName,                       // label text (keep it short)
    status: j.running ? 'running'
          : j.lastRunFailed ? 'error'
          : j.waitingForReview ? 'awaiting_approval'
          : j.needsHuman ? 'needs_attention'
          : j.enabled === false ? 'off'
          : 'idle',
    room: 'code',                              // a zone id, see below
    task: j.currentStep ?? '',                 // short text for the speech bubble
    model: j.model,                            // optional, e.g. 'claude-sonnet-5-5'
  }));
}
```

`status` must be one of:

| status | Use when | Where the agent goes |
|---|---|---|
| `running` | the agent is doing work right now | their desk in `room` |
| `idle` | enabled, nothing to do | café |
| `awaiting_approval` | waiting for a human to review or approve | meeting room |
| `error` | the last run failed | the alert ring around the central planter, with a red dot |
| `needs_attention` | not an error, but a human must act (unanswered customer message, invoice to approve, …) | the alert ring, with a red dot |
| `off` | disabled | café, faded |

**Rooms in the default layout:**
- `customers`
- `marketing`
- `finance`
- `code`
- `infra`
- `qa`
- `lab` (AI lab / research / memory)
- `bd` (business development)

Pick the closest room per agent. An unknown room falls back to the café while running. If the user's domain doesn't fit, build a custom layout (section A5). One agent may have `role: 'chief'`; it sits at the CEO desk.

### 3. Feed snapshots

Call `hive.setAgents(toHiveAgents(data))`:
- once at start;
- again every time the data changes (polling, websocket, SSE, …).

It is cheap. Agents whose status didn't change don't move, and agents missing from the list are removed. You don't need to diff anything.

Optional: `hive.pushEvent({ agentId, type: 'done' })` when a job finishes. The agent jumps for joy, then goes to the café.

### 4. Framework recipes

**Vanilla / any framework**

```js
import { createAgentHive } from 'agent-hive';

const el = document.getElementById('office');          // MUST have a height, e.g. 480px
const hive = createAgentHive(el, { language: 'en', legend: true, onSelect: id => showDetails(id) });
hive.setAgents(toHiveAgents(data));
// when the view is destroyed:
hive.dispose();                                         // releases the WebGL context — always call it
```

**React**

```jsx
import { AgentHive } from 'agent-hive/react';

<AgentHive agents={toHiveAgents(data)} language="en" legend onSelect={setSelectedId} style={{ height: 480 }} />
```

Init options are read once; change the `key` prop to re-create with new options. Use `onReady={(api) => …}` to get the imperative API (`focus`, `pushEvent`, `setZoom`).

**Next.js (App Router)**
- `agent-hive/react` is a client component (it has `'use client'`).
- Use it from a client component, or from a server component as a child; no `dynamic(..., { ssr: false })` is needed.
- Importing the package on the server is safe, because WebGL is only touched inside `useEffect`.

**Vue / Svelte / Angular**
- Call `createAgentHive(el, options)` in the mounted / onMount / ngAfterViewInit hook.
- Call `dispose()` in the unmount / onDestroy hook.
- Call `setAgents` whenever your reactive data changes.

### 5. Options you will most likely need

| Option | Use |
|---|---|
| `language: 'en'` | English UI (`'vi'` Vietnamese is the default, `'zh'` Chinese) |
| `legend: true` | colour legend |
| `wheelZoom: 'ctrl'` | **use this when the office is a card inside a scrolling page**, otherwise the wheel zooms instead of scrolling |
| `shadows: true`, `quality: 'high'` | prettier, for full-screen views only |
| `extraStaff: 0` | no decorative walkers (default 10) |
| `labels: { … }` | rename UI strings, e.g. `{ needsAttention: 'Needs you' }` |
| `layout` | custom islands and zones (see below) |

Custom layout, when the user's teams don't match the default rooms:

```js
layout: {
  islands: [
    { id: 'main', name: 'MAIN OFFICE', x: 0, z: 0, w: 18, d: 12 },
    { id: 'cafe', name: 'CAFÉ', x: 0, z: 15, w: 11, d: 11, round: true },
  ],
  zones: [
    { id: 'support', island: 'main', name: 'SUPPORT', type: 'desks', x: -4, z: 0, cols: 2, rows: 2 },
    { id: 'billing', island: 'main', name: 'BILLING', type: 'desks', x: 4,  z: 0, cols: 2, rows: 2 },
    { id: 'alert',   island: 'main',                  type: 'alert', x: 0,  z: 0 },
    { id: 'cafe',    island: 'cafe',                  type: 'cafe',  x: 0,  z: 15 },
  ],
  bridges: [{ from: 'main', to: 'cafe' }],
}
// agents then use room: 'support' | 'billing'
```

Zone types:
- `desks`
- `cafe`
- `meeting`
- `podium`
- `ceo`
- `servers`
- `alert`

Every layout should have a `cafe` zone and an `alert` zone. Coordinates are world units on an isometric view: +x points to the lower right of the screen, +z to the lower left. Keep islands about 4 units apart and connect them with bridges.

### 6. Checklist / common mistakes

- [ ] The container has an explicit **height**. With no height you get an invisible 0 px canvas.
- [ ] `dispose()` is called on unmount. Browsers allow about 16 WebGL contexts; leaking them breaks the page after a few navigations.
- [ ] `id`s are stable across snapshots. Changing ids makes people disappear and reappear.
- [ ] Map **errors** to `error` and "a human must act" to `needs_attention`. Don't leave them as `idle`.
- [ ] Keep `task` short (≤ 40 characters).
- [ ] Inside a scrolling page, set `wheelZoom: 'ctrl'`.
- [ ] Don't fork or copy the source into the user's app; install the package.

Types: [`src/index.d.ts`](src/index.d.ts). API and options: [README.md](README.md#options).

---

## B. Working on this repository

```bash
npm install
npm test          # node:test, must stay green
npm run demo      # http://localhost:5190  (?lang=vi · ?bloom · ?hour=17.7)
```

- **Internal names are Vietnamese, the public API is English.**
  - `ten` = name, `trangThai` = status, `phong` = room, `viec` = task, `dao` = island, `khu` = zone, `cau` = bridge.
  - Status values: `ranh` = idle, `dang_chay` = running, `cho_duyet` = awaiting approval, `loi` = error, `can_xu_ly` = needs attention, `tat` = off.
  - English input is translated in `src/core/aliases.js`. A new public field or option needs an English name there, a test in `test/aliases.test.js`, a type in `src/index.d.ts` and a README entry.
- **Code comments are in Vietnamese.** Keep the surrounding style when editing.
- **Performance budget:**
  - ≤ 30 fps, and pause when hidden.
  - Merge static meshes by material (`gomTinh` in `scene.js`).
  - No allocations per frame.
  - Check `hive.info()` (draw calls, triangles) before and after a visual change.
- **Licences:** no external models, fonts or brand logos. Geometry is made in code, textures are drawn on canvas (`textures.js`).
- Pure logic (layout, paths, seats, appearance, sky, aliases) lives in `src/core/*` and has unit tests. Rendering is verified in the demo.

Map of `src/`:

| File | What it does |
|---|---|
| `index.js` | `createAgentHive`: renderer, camera, loop, picking, public API |
| `react.js` | React wrapper |
| `core/aliases.js` | English → internal names |
| `core/layout.js` | default layouts, seats, walking graph, `khuDich` (status → target zone) |
| `core/seats.js` | stable seat manager |
| `core/scene.js` | static scene |
| `core/textures.js` | canvas textures |
| `core/character.js` | person mesh + walking + alert dot |
| `core/appearance.js` | deterministic look from id |
| `core/labels.js` | name pills and bubbles |
| `core/declutter.js` | label overlap avoidance |
| `core/cafe.js` | barista |
| `core/sky.js` | time-of-day |
| `core/bloom.js` | optional bloom |
| `core/model.js` | model badges |
