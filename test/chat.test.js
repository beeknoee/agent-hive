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
    for (const ng of ['vi', 'en', 'zh']) {
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

test('Chinese: default layout names and labels', async () => {
    const { LAYOUT_ZH, LAYOUT_MAC_DINH } = await import('../src/core/layout.js');
    assert.equal(LAYOUT_ZH.dao.find(d => d.id === 'chinh').ten, '主办公区');
    assert.equal(LAYOUT_ZH.khu.find(k => k.id === 'tai-chinh').ten, '财务');
    assert.deepEqual(LAYOUT_ZH.khu.map(k => [k.id, k.x, k.z]), LAYOUT_MAC_DINH.khu.map(k => [k.id, k.x, k.z]), 'same positions');
    assert.deepEqual(chuanHoaTuyChon({ labels: { phases: { dusk: 'Evening' } } }).chu, { buoi: { dusk: 'Evening' } });
});

test('chat pools: every language has every context, enough lines, ≤ 40 chars, {viec} only in ceoViec', async () => {
    const { NGU_CANH } = await import('../src/core/chat.js');
    const toiThieu = { thuong: 20, lamViec: 15, cafe: 10, toi: 6, ceo: 12, ceoViec: 5 };
    for (const ng of ['vi', 'en', 'zh']) {
        for (const k of NGU_CANH) {
            const ds = LOI_THOAI[ng][k];
            assert.ok(ds.length >= toiThieu[k], `${ng}/${k}: only ${ds.length}`);
            for (const d of ds) {
                assert.ok(d.length >= 2, `${ng}/${k}: ${d}`);
                for (const c of d) assert.ok(c.length <= 40, `${ng}/${k} too long: ${c}`);
                assert.equal(d[0].includes('{viec}'), k === 'ceoViec', `${ng}/${k}: {viec} placement ${d[0]}`);
            }
        }
        // same number of dialogs per context in every language (translations kept in sync)
        for (const k of NGU_CANH) assert.equal(LOI_THOAI[ng][k].length, LOI_THOAI.vi[k].length, `${ng}/${k} out of sync with vi`);
    }
});

test('dialog picker does not repeat recent dialogs; {viec} is filled and shortened', async () => {
    const { taoBoChon, dienViec } = await import('../src/core/chat.js');
    const chon = taoBoChon();
    const ds = LOI_THOAI.vi.thuong;
    const dau = [];
    for (let i = 0; i < Math.floor(ds.length / 2); i++) dau.push(chon(ds)[0]);
    assert.equal(new Set(dau).size, dau.length, 'no repeats within half the pool');
    assert.deepEqual(dienViec(['"{viec}" sao rồi?', 'Ổn'], 'Tối ưu quảng cáo'), ['"Tối ưu quảng cáo" sao rồi?', 'Ổn']);
    assert.ok(dienViec(['{viec}'], 'x'.repeat(60))[0].length <= 22);
    assert.equal(chon([]), null);
});

test('chatLines English contexts map to internal ones', () => {
    const o = chuanHoaTuyChon({ chatLines: { work: [['a', 'b']], evening: [['c', 'd']], chiefTask: [['{viec}?', 'ok']] } });
    assert.deepEqual(Object.keys(o.loiThoai).sort(), ['ceoViec', 'lamViec', 'toi']);
});
