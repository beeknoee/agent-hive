# Contributing to agent-hive

Thanks for helping! agent-hive is maintained by [Beeknoee](https://beeknoee.com).

## Setup

```bash
npm install
npm run demo   # http://localhost:5190  (?en · ?cao · ?gio=17.7)
npm test
```

## Guidelines

- **Keep it light.** The office runs inside dashboards all day: ≤ 30 fps, pause when hidden, merge static meshes, no per-frame allocations. Check `hive.info()` (draw calls, triangles) before and after your change.
- **No external assets with restrictive licences.** Geometry is built in code, textures are drawn on canvas. Don't bundle brand logos; apps pass their own `logo` URL.
- **Logic gets a test.** Pure functions (layout, paths, seats, appearance, sky) live in `src/core/*` and are tested with `node:test` in `test/`.
- **Types.** Update `src/index.d.ts` when you add or change an option / export (`test/exports.test.js` checks exports match).
- Field and option names are Vietnamese (e.g. `ten` = name, `trangThai` = status). Keep new public names consistent and document them in the README.

## Pull requests

1. Fork and create a branch.
2. `npm test` must pass; try the demo in day and night (`?gio=10`, `?gio=22`).
3. Describe what changed and add a screenshot for visual changes.

By contributing you agree your work is released under the [MIT License](LICENSE).
