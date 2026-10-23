# agent-hive 🐝

**A low-poly 3D office for your AI agent team.** Every agent is a little employee on floating office islands. They sit and type when **running**, walk to the meeting room when **awaiting approval**, hang out at the café when **idle**, and gather around the central planter with a blinking red dot when something **fails or needs a human**. The sky follows the real clock: dawn, day, dusk and night with the lights on.

Built with [Three.js](https://threejs.org). No external 3D models: everything is generated in code. MIT licensed.

Made by **[Beeknoee](https://beeknoee.com)**.

![agent-hive at dusk](docs/dusk.png)

| Day | Night |
|---|---|
| ![day](docs/day.png) | ![night](docs/night.png) |

*[Tiếng Việt ở cuối trang](#tiếng-việt)*

---

## Features

- **Status → behaviour.** Feed it a snapshot of your agents and they walk to the right place on their own: desk, meeting room, café, or the alert ring around the planter.
- **Readable at a glance.** Name pills with a status dot and a model badge (Haiku → `HK`, Sonnet → `SN`, Opus → `OP`, …). Up to 3 speech bubbles at once, most urgent first. Labels avoid overlapping. Click a person **or their label** to select them.
- **Lively, not noisy.** Optional extra staff: a security guard on patrol, a technician, and a barista who brews coffee and carries steaming cups to the tables.
- **Light.** At most 30 fps. Pauses when the tab is hidden or the canvas is off-screen. Static scene merged by material (about 66 draw calls). Respects `prefers-reduced-motion`. `dispose()` releases the WebGL context.
- **Optional night bloom** (`chatLuong: 'cao'`) for full-screen use. It turns itself off on slow machines.
- **Vietnamese or English UI** (`ngonNgu: 'en'`). Every label can be overridden.
- **Clean licence.** No third-party 3D assets, fonts or brand logos are bundled.

## Requirements

- `three` ≥ 0.160 (peer dependency)
- A browser with WebGL 2 (current Chrome, Edge, Firefox, Safari)
- React ≥ 18 only if you use the `<AgentHive>` component
- A bundler that understands ES modules (Vite, Next.js, webpack 5, …). The package ships plain ES modules, so there is no build step.

## Install

The package is installed straight from GitHub:

```bash
npm install three github:beeknoee/agent-hive
```

You can pin a tag or commit: `github:beeknoee/agent-hive#v0.1.0`.

## Quick start (vanilla JS)

```html
<div id="office" style="height: 520px"></div>
```

```js
import { createAgentHive } from 'agent-hive';

const hive = createAgentHive(document.getElementById('office'), {
  ngonNgu: 'en',          // UI language: 'vi' (default) | 'en'
  chuThich: true,         // status legend, bottom-left
  nhanVienPhu: 10,        // extra staff walking around
  onSelect: (id) => console.log('clicked', id),   // null when clicking empty space
});

hive.setAgents([
  { id: 'ceo', ten: 'Chief AI', vaiTro: 'chief', trangThai: 'dang_chay', model: 'claude-opus-5-5' },
  { id: 'ads', ten: 'Ads Optimizer', phong: 'marketing', trangThai: 'dang_chay', viec: 'Tune ad campaign' },
  { id: 'ops', ten: 'Infra Watch', phong: 'ha-tang', trangThai: 'loi', viec: 'Disk full' },
  { id: 'inbox', ten: 'Inbox Bot', phong: 'khach-hang', trangThai: 'can_xu_ly', viec: '3 messages need a human' },
]);

// Call setAgents again whenever your data changes. Only agents whose status changed will move.
hive.pushEvent({ agentId: 'ads', loai: 'xong' });   // optional: a little jump of joy, then off to the café
```

## React

```jsx
import { AgentHive } from 'agent-hive/react';

export function Office({ agents }) {
  return (
    <AgentHive
      agents={agents}
      ngonNgu="en"
      chuThich
      onSelect={(id) => openDetails(id)}
      onReady={(api) => api.focus('ceo')}
      style={{ height: 520 }}
    />
  );
}
```

Init options are read **once**. To apply new options, change the component's `key`. The `agents` prop can change freely. The component is written without JSX, so it works in Next.js without `transpilePackages`.

## Agent data

Field names are Vietnamese. Here is what they mean:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable id. Appearance (gender, skin, hair, outfit) is generated deterministically from it. |
| `ten` | string | Name shown on the label. |
| `trangThai` | status | See the table below. |
| `phong` | string | Room / zone id for the default layout: `khach-hang` (customers) · `marketing` · `tai-chinh` (finance) · `code` · `ha-tang` (infra) · `qa` · `thu-vien` (AI lab) · `bd` (business dev). |
| `vaiTro` | `'chief'` \| `'staff'` \| `'bot'` | `chief` sits at the private CEO desk in the AI lab. |
| `viec` | string | Current task, shown in a speech bubble (≤ 40 chars is best). |
| `model` | string \| object | Optional model badge. Pass an id string (`'claude-sonnet-5-5'`, `'gpt-…'`, `'gemini-…'`) or `{ id, ngan, hang, logo }`. No brand logos are bundled; pass your own `logo` URL, or a coloured letter tile is drawn. |
| `ngoaiHinh` | object | Optional appearance override: `{ gioi, da, toc, trangPhuc, ao, quan, kinh, … }` (see `src/index.d.ts`). |

| `trangThai` | Meaning | Where they go |
|---|---|---|
| `ranh` | idle | café |
| `dang_chay` | running | their desk, typing |
| `cho_duyet` | awaiting approval | meeting room |
| `loi` | error | around the central planter, blinking red dot |
| `can_xu_ly` | needs a human | around the central planter, blinking red dot |
| `tat` | turned off | café, faded |

`pushEvent({ agentId, loai })` takes `loai` ∈ `bat_dau` (start) · `xong` (done) · `loi` (error) · `cho_duyet` · `duyet` (approved) · `can_xu_ly`.

## Options

| Option | Default | Description |
|---|---|---|
| `ngonNgu` | `'vi'` | UI language for the HUD, legend, bubble prefixes and default room names: `'vi'` or `'en'`. |
| `chu` | – | Override individual UI strings, e.g. `{ can: 'Needs you' }`. Keys are listed in `ChuGiaoDien` in `src/index.d.ts`. |
| `layout` | `LAYOUT_MAC_DINH` / `LAYOUT_EN` | Your own islands, zones and bridges. |
| `bong` | `false` | Real-time shadows. Prettier and heavier, best for full-screen. |
| `chatLuong` | `'thuong'` | `'cao'` enables night bloom (lazy-loaded, auto-disabled under ~22 fps). |
| `nhanVienPhu` | `10` | Extra staff without an agent (0–40). |
| `chuThich` | `false` | Status legend. |
| `hud` | `true` | Clock (`DAWN` / `DAY` / `DUSK` / `NIGHT · 17:42`) and headcount. |
| `dieuKhien` | `true` | Drag to pan, wheel to zoom. |
| `zoomCuon` | `'luon'` | `'ctrl'`: zoom only with Ctrl/⌘ + wheel. Use it when the office is a card inside a long scrolling page. |
| `zoom` | `1` | Initial zoom. |
| `tiLeNhan` | auto | Label scale. Shrinks automatically in short containers. |
| `fps` | `30` | Frame-rate cap. |
| `gio` | `() => new Date()` | Clock used for the sky. Handy for demos and screenshots. |
| `onSelect` | – | `(id \| null) => void` |

## API

`createAgentHive(container, options)` returns:

| Method | Description |
|---|---|
| `setAgents(agents)` | Replace the snapshot. Agents missing from the list are removed. |
| `pushEvent({ agentId, loai, viec? })` | Apply an event without a full snapshot: sets that agent's status (`xong` also plays a jump of joy). |
| `focus(id)` | Smoothly move the camera to an agent. |
| `select(id \| null)` | Highlight ring under an agent. |
| `setZoom(z, x?, z?)` | Zoom, optionally around a point. |
| `viTri(id)` | Current position `{ x, y, z, dao, khu, dangDi }`. |
| `refreshSky()` | Recompute the sky now, e.g. after changing your `gio` clock. |
| `info()` | Draw calls, triangles, fps cap, bloom state. |
| `dispose()` | Remove everything and release the WebGL context. |

Also exported: `LAYOUT_MAC_DINH`, `LAYOUT_EN`, `timDao`, `timKhu`, `bauTroi`, `nhanGio`, `buoiTheoGio`, `moTaModel`, `MAU_HANG`. Full types are in [`src/index.d.ts`](src/index.d.ts).

## Custom layout

A layout has `dao` (islands), `khu` (zones on islands) and `cau` (bridges). The easiest way is to start from the default and rename or move things:

```js
import { createAgentHive, LAYOUT_EN } from 'agent-hive';

const layout = {
  ...LAYOUT_EN,
  dao: LAYOUT_EN.dao.map(d => (d.id === 'thu-vien' ? { ...d, ten: 'RESEARCH · CEO' } : d)),
  khu: LAYOUT_EN.khu.map(k => (k.id === 'marketing' ? { ...k, ten: 'GROWTH' } : k)),
};
createAgentHive(el, { layout, ngonNgu: 'en' });
```

Zone types (`khu.loai`):
- `ban`: desks
- `cafe`: café tables
- `hop`: meeting room
- `buc`: podium
- `ceo`: CEO desk
- `may`: server racks
- `bao`: the alert ring around the planter

Seats are stable: once given, a seat never moves. If a zone overflows, late arrivals stand beside the desks, always inside the island.

## Development

```bash
git clone https://github.com/beeknoee/agent-hive.git
cd agent-hive
npm install
npm run demo     # http://localhost:5190
npm test         # logic tests (paths, seating, appearance, model badges, sky, exports)
```

Demo URL flags: `?en` for English, `?cao` for night bloom, `?gio=17.7` to fix the clock (17:42).

Project layout:

```
src/index.js        createAgentHive: renderer, camera, loop, agents, picking
src/react.js        <AgentHive> React wrapper
src/core/layout.js  islands, zones, seats, walking graph
src/core/canh.js    static scene (floors, furniture, LEDs, clouds)
src/core/nhanVat.js characters · ngoaiHinh.js appearance · nhan.js labels & bubbles
src/core/quanCafe.js barista + steaming cups · cho.js seat manager · troi.js sky
demo/               demo page with fake data
test/               node:test unit tests
```

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © [Beeknoee](https://beeknoee.com)

---

## Tiếng Việt

**agent-hive** là văn phòng 3D low-poly cho đội AI agent. Mỗi agent là một nhân viên trên các đảo văn phòng nổi giữa mây:
- **Đang chạy** thì ngồi gõ máy.
- **Chờ duyệt** thì sang phòng họp.
- **Rảnh** thì ra café.
- **Lỗi / cần người xử lý** thì ra đứng quanh bồn hoa giữa văn phòng, có chấm đỏ nháy.

Trời đổi theo giờ thật: bình minh, ngày, chiều, đêm bật đèn.

Sản phẩm mã nguồn mở của **[Beeknoee](https://beeknoee.com)**, giấy phép MIT.

**Cài:**

```bash
npm install three github:beeknoee/agent-hive
```

**Dùng:**

```js
import { createAgentHive } from 'agent-hive';

const hive = createAgentHive(document.getElementById('van-phong'), {
  chuThich: true,
  onSelect: (id) => console.log('bấm vào', id),
});
hive.setAgents([
  { id: 'ads', ten: 'Ads Optimizer', phong: 'marketing', trangThai: 'dang_chay', viec: 'Tối ưu chiến dịch' },
  { id: 'ops', ten: 'Infra Watch', phong: 'ha-tang', trangThai: 'loi', viec: 'Ổ đĩa đầy' },
]);
```

Dữ liệu mỗi agent:
- `id`, `ten`
- `phong`: khu làm việc
- `trangThai`: `ranh` · `dang_chay` · `cho_duyet` · `loi` · `can_xu_ly` · `tat`
- `viec`: bóng chữ
- `model`: huy hiệu model
- `ngoaiHinh`: ghi đè ngoại hình

Tuỳ chọn và API xem các bảng ở trên.

Chạy demo: `npm install` rồi `npm run demo`, mở http://localhost:5190. Thêm `?en` cho tiếng Anh, `?cao` để bật toả sáng ban đêm, `?gio=17.7` để cố định giờ.

Kiểm thử: `npm test`.
