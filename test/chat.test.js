import test from 'node:test';
import assert from 'node:assert/strict';
import { LOI_THOAI, timCap, thoiGianCau } from '../src/core/chat.js';
import { chuanHoaTuyChon } from '../src/core/aliases.js';

test('chat pairs: same island, within distance', () => {
    const ds = [
        { id: 'a', x: 0, z: 0, dao: 'cafe' },
        { id: 'b', x: 10, z: 0, dao: 'cafe' },     // too far
        { id: 'c', x: 1.2, z: 0.5, dao: 'chinh' },  // close but another island
        { id: 'd', x: 1.5, z: 0, dao: 'cafe' },
    ];
    for (let k = 0; k < 20; k++) {
        const cap = timCap(ds);
        assert.ok(cap, 'must find a pair');
        assert.deepEqual(cap.map(p => p.id).sort(), ['a', 'd']);
    }
    assert.equal(timCap([{ id: 'a', x: 0, z: 0, dao: 'x' }, { id: 'b', x: 0.1, z: 0, dao: 'x' }]), null, 'too close (same seat) is not a chat');
    assert.equal(timCap([]), null);
});

test('chat lines: both languages, every dialog has ≥ 2 lines, line time bounded', () => {
    for (const ng of ['vi', 'en']) {
        for (const loai of ['thuong', 'ceo']) {
            assert.ok(LOI_THOAI[ng][loai].length >= 4);
            for (const d of LOI_THOAI[ng][loai]) assert.ok(d.length >= 2 && d.every(c => c.length <= 40), `${ng}/${loai}: ${d}`);
        }
    }
    assert.equal(thoiGianCau(''), 2400);
    assert.equal(thoiGianCau('x'.repeat(500)), 4500);
});

test('chatter options in English', () => {
    const o = chuanHoaTuyChon({ chatter: false, chatLines: { casual: [['Hi', 'Hello']], chief: [['Status?', 'Fine']] } });
    assert.equal(o.troChuyen, false);
    assert.deepEqual(o.loiThoai, { thuong: [['Hi', 'Hello']], ceo: [['Status?', 'Fine']] });
});
