import test from 'node:test';
import assert from 'node:assert/strict';
import { bauTroi, nhanGio, buoiTheoGio } from '../src/core/troi.js';

const luc = (h, m = 0) => { const d = new Date(2026, 0, 1); d.setHours(h, m, 0, 0); return d; };

test('buổi theo giờ: bình minh · ngày · chiều · đêm', () => {
    assert.equal(buoiTheoGio(5.2), 'dawn');
    assert.equal(buoiTheoGio(9), 'day');
    assert.equal(buoiTheoGio(16), 'dusk');
    assert.equal(buoiTheoGio(19.4), 'dusk');
    assert.equal(buoiTheoGio(19.5), 'night');
    assert.equal(buoiTheoGio(2), 'night');
});

test('nhãn HUD có buổi chiều', () => {
    assert.equal(nhanGio(luc(17, 42)), 'DUSK · 17:42');
    assert.equal(nhanGio(luc(9, 5)), 'DAY · 09:05');
    assert.equal(nhanGio(luc(21, 0)), 'NIGHT · 21:00');
    assert.equal(nhanGio(luc(5, 40)), 'DAWN · 05:40');
});

test('bầu trời: đèn bật buổi tối, tắt giữa trưa; màu là mã hex', () => {
    assert.equal(bauTroi(luc(12)).den, false);
    assert.equal(bauTroi(luc(22)).den, true);
    assert.equal(bauTroi(luc(22)).dem, true);
    for (const h of [0, 5, 7, 12, 17, 19, 23]) assert.match(bauTroi(luc(h)).tren, /^#[0-9a-f]{6}$/);
});
