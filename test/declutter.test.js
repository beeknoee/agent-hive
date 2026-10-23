import test from 'node:test';
import assert from 'node:assert/strict';
import { giaiChong } from '../src/core/declutter.js';

const de = (a, b) => !(a.x + a.w / 2 <= b.x - b.w / 2 || a.x - a.w / 2 >= b.x + b.w / 2
    || a.y - a.d <= b.y - b.d - b.h || a.y - a.d - a.h >= b.y - b.d);

test('hai nhãn đè nhau ⇒ khối ưu tiên thấp bị đẩy lên, hết đè', () => {
    const k = [
        { id: 'a', x: 100, y: 200, w: 80, h: 20, uuTien: 4 },
        { id: 'b', x: 120, y: 205, w: 80, h: 20, uuTien: 1 },
    ];
    const d = giaiChong(k);
    assert.equal(d.get('a'), 0);
    assert.ok(d.get('b') > 0);
    const A = { ...k[0], d: d.get('a') }; const B = { ...k[1], d: d.get('b') };
    assert.ok(!de(A, B), 'sau khi giải không còn đè');
});

test('không đè thì không đẩy', () => {
    const d = giaiChong([{ id: 'a', x: 0, y: 100, w: 50, h: 20, uuTien: 1 }, { id: 'b', x: 300, y: 100, w: 50, h: 20, uuTien: 1 }]);
    assert.equal(d.get('a'), 0); assert.equal(d.get('b'), 0);
});

test('đám đông 10 nhãn cùng chỗ: không ai bị đẩy quá trần', () => {
    const k = Array.from({ length: 10 }, (_, i) => ({ id: String(i), x: 200 + i * 3, y: 300, w: 90, h: 20, uuTien: 1 }));
    const d = giaiChong(k, { toiDa: 90 });
    for (const v of d.values()) assert.ok(v <= 90);
    assert.ok([...d.values()].filter(v => v > 0).length >= 3);
});
