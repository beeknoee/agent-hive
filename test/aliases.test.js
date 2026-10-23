import test from 'node:test';
import assert from 'node:assert/strict';
import { chuanHoaAgent, chuanHoaSuKien, chuanHoaTuyChon, chuanHoaLayout, chuanHoaChu, viTriEn } from '../src/core/aliases.js';
import { LAYOUT_MAC_DINH, timKhu, khuDich, choNgoi } from '../src/core/layout.js';
import { skyAt, describeModel, PROVIDER_COLORS, DEFAULT_LAYOUT, findZone } from '../src/index.js';

const coKhu = (k) => !!timKhu(LAYOUT_MAC_DINH, k);

test('English agent fields → internal', () => {
    const a = chuanHoaAgent({ id: 'x', name: 'Ads', status: 'running', room: 'finance', task: 'Tune', role: 'chief',
        appearance: { gender: 'female', outfit: 'lab-coat', hair: { style: 'ponytail', color: 'blonde' }, glasses: true },
        model: { id: 'm', short: 'M1', provider: 'openai' } }, coKhu);
    assert.equal(a.ten, 'Ads');
    assert.equal(a.trangThai, 'dang_chay');
    assert.equal(a.phong, 'tai-chinh');
    assert.equal(a.viec, 'Tune');
    assert.equal(a.vaiTro, 'chief');
    assert.deepEqual([a.ngoaiHinh.gioi, a.ngoaiHinh.trangPhuc, a.ngoaiHinh.toc.kieu, a.ngoaiHinh.toc.mau, a.ngoaiHinh.kinh], ['nu', 'blouse', 'duoi-ngua', 'vang', true]);
    assert.deepEqual([a.model.ngan, a.model.hang], ['M1', 'openai']);
});

test('Vietnamese fields still work and win over English ones', () => {
    const a = chuanHoaAgent({ id: 'x', ten: 'Tên', name: 'Name', trangThai: 'loi', status: 'idle', phong: 'tai-chinh' }, coKhu);
    assert.deepEqual([a.ten, a.trangThai, a.phong], ['Tên', 'loi', 'tai-chinh']);
    // English status value under the Vietnamese key is accepted too
    assert.equal(chuanHoaAgent({ id: 'y', trangThai: 'needs_attention' }).trangThai, 'can_xu_ly');
});

test('English room id maps only when the layout has no zone of that name', () => {
    assert.equal(chuanHoaAgent({ id: 'a', room: 'infra' }, coKhu).phong, 'ha-tang');
    assert.equal(chuanHoaAgent({ id: 'a', room: 'infra' }, (k) => k === 'infra').phong, 'infra');
    // mapped agent ends up in the right zone
    assert.equal(khuDich(chuanHoaAgent({ id: 'a', room: 'customers', status: 'running' }, coKhu)), 'khach-hang');
});

test('events, options, labels', () => {
    assert.deepEqual(chuanHoaSuKien({ agentId: 'a', type: 'done', task: 'x' }), { agentId: 'a', type: 'done', task: 'x', loai: 'xong', viec: 'x' });
    const o = chuanHoaTuyChon({ language: 'en', chiefWalks: false, shadows: true, quality: 'high', extraStaff: 4, legend: true, wheelZoom: 'ctrl', labels: { needsAttention: 'Needs you', roles: { barista: 'Barista' } } });
    assert.deepEqual([o.ngonNgu, o.bong, o.chatLuong, o.nhanVienPhu, o.chuThich, o.zoomCuon], ['en', true, 'cao', 4, true, 'ctrl']);
    assert.equal(o.chu.can, 'Needs you');
    assert.equal(o.ceoDiDao, false);
    assert.equal(o.chu.vai['phuc-vu'], 'Barista');
    assert.deepEqual(chuanHoaChu({ agents: 'people' }), { nhanVien: 'people' });
});

test('English layout → internal layout that seats people', () => {
    const l = chuanHoaLayout({
        islands: [{ id: 'main', name: 'MAIN', x: 0, z: 0, w: 16, d: 12 }, { id: 'cafe', name: 'CAFE', x: 0, z: 14, w: 10, d: 10, round: true }],
        zones: [{ id: 'dev', island: 'main', name: 'DEV', type: 'desks', x: 0, z: 0, cols: 2, rows: 1 }, { id: 'cafe', island: 'cafe', type: 'cafe', x: 0, z: 14 }],
        bridges: [{ from: 'main', to: 'cafe' }],
    });
    assert.equal(l.dao[1].tron, true);
    assert.equal(l.khu[0].loai, 'ban');
    assert.deepEqual(l.cau, [{ tu: 'main', den: 'cafe' }]);
    assert.ok(choNgoi(l.khu[0], 3).length >= 3);
    assert.equal(chuanHoaLayout(LAYOUT_MAC_DINH), LAYOUT_MAC_DINH);   // internal format passes through
});

test('English helper exports', () => {
    const d = new Date(2026, 0, 1, 17, 42);
    assert.equal(skyAt(d).phase, 'dusk');
    assert.deepEqual(describeModel('claude-sonnet-5-5'), { short: 'SN', provider: 'anthropic', logo: null, name: 'claude-sonnet-5-5' });
    assert.equal(PROVIDER_COLORS.anthropic.letter, 'A');
    assert.equal(findZone(DEFAULT_LAYOUT, 'qa').id, 'qa');
    assert.deepEqual(viTriEn({ x: 1, y: 0, z: 2, dao: 'a', khu: 'b', dangDi: true, dayNhan: 0 }), { x: 1, y: 0, z: 2, island: 'a', zone: 'b', walking: true, labelOffset: 0 });
});

test('custom layout: target zones are found by zone TYPE, not by fixed ids', () => {
    const l = chuanHoaLayout({
        islands: [{ id: 'main', name: 'M', x: 0, z: 0, w: 18, d: 12 }, { id: 'lounge', name: 'L', x: 0, z: 15, w: 11, d: 11, round: true }],
        zones: [
            { id: 'dev', island: 'main', type: 'desks', x: -4, z: 0 },
            { id: 'ring', island: 'main', type: 'alert', x: 0, z: 0 },
            { id: 'talk', island: 'main', type: 'meeting', x: 4, z: 0 },
            { id: 'lounge', island: 'lounge', type: 'cafe', x: 0, z: 15 },
            { id: 'boss', island: 'main', type: 'ceo', x: 0, z: -4 },
        ],
        bridges: [{ from: 'main', to: 'lounge' }],
    });
    const dich = (a) => khuDich(chuanHoaAgent(a), l);
    assert.equal(dich({ status: 'error' }), 'ring');
    assert.equal(dich({ status: 'needs_attention' }), 'ring');
    assert.equal(dich({ status: 'awaiting_approval' }), 'talk');
    assert.equal(dich({ status: 'idle' }), 'lounge');
    assert.equal(dich({ status: 'running', room: 'dev' }), 'dev');
    assert.equal(dich({ status: 'running', room: 'nope' }), 'lounge');
    assert.equal(dich({ status: 'running', role: 'chief' }), 'boss');
});
