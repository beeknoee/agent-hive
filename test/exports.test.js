import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Mọi `export function / export const` khai báo trong index.d.ts phải có thật ở src/index.js (bắt lỗi xuất thiếu / import thiếu)
test('export trong index.d.ts khớp src/index.js', async () => {
    const mod = await import('../src/index.js');
    const dts = readFileSync(new URL('../src/index.d.ts', import.meta.url), 'utf8');
    const ten = [...dts.matchAll(/^export (?:function|const) (\w+)/gm)].map(m => m[1]);
    assert.ok(ten.length >= 8);
    for (const t of ten) assert.ok(t in mod, `thiếu export ${t}`);
});
