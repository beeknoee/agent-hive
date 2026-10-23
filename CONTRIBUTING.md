# Contributing to agent-hive

Thanks for helping! agent-hive is maintained by [Beeknoee](https://beeknoee.com).

## Setup

```bash
npm install
npm run demo   # http://localhost:5190  (?lang=vi · ?bloom · ?hour=17.7)
npm test
```

## Guidelines

- **Keep it light.** The office runs inside dashboards all day: ≤ 30 fps, pause when hidden, merge static meshes, no per-frame allocations. Check `hive.info()` (draw calls, triangles) before and after your change.
- **No external assets with restrictive licences.** Geometry is built in code, textures are drawn on canvas. Don't bundle brand logos; apps pass their own `logo` URL.
- **Logic gets a test.** Pure functions (layout, paths, seats, appearance, sky) live in `src/core/*` and are tested with `node:test` in `test/`.
- **Types.** Update `src/index.d.ts` when you add or change an option / export (`test/exports.test.js` checks exports match).
- **Public names in English.** Internals and comments use Vietnamese names (`ten` = name, `trangThai` = status, `phong` = room…). Any new public field / option gets an English name, translated in `src/core/aliases.js` (with a test in `test/aliases.test.js`), and is documented in the README.
- File names are English, camelCase or single words.

## Pull requests

1. Fork and create a branch.
2. `npm test` must pass; try the demo in day and night (`?hour=10`, `?hour=22`).
3. Describe what changed and add a screenshot for visual changes.

By contributing you agree your work is released under the [MIT License](LICENSE).
