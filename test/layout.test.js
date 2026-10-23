import test from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT_MAC_DINH as L, dungDoThi, duongNganNhat, loTrinh, loTrinhDayDu, khuDich, choNgoi, dauCau } from '../src/core/layout.js';

const xz = (p) => ({ x: p.x, z: p.z });

test('mọi đảo phụ đi tới được đảo chính qua cầu', () => {
    const g = dungDoThi(L);
    for (const d of L.dao.filter(x => x.id !== 'chinh')) {
        const tu = `${d.id}:tam`;
        const ids = duongNganNhat(g, tu, 'chinh:n');
        assert.ok(ids.length >= 3, `${d.id} không tới được đảo chính: ${ids}`);
        assert.ok(ids.some(id => id.startsWith('cau')), `${d.id} phải đi qua cầu`);
    }
});

test('đầu cầu không nối vào đầu cầu khác (luôn nối vào nút trong đảo)', () => {
    const g = dungDoThi(L);
    for (const [id, ke] of g.ke) {
        if (!id.startsWith('cau')) continue;
        const loCau = ke.filter(([v]) => v.startsWith('cau'));
        assert.equal(loCau.length, 1, `${id} chỉ được nối đúng 1 đầu cầu bên kia, đang nối ${loCau.map(x => x[0])}`);
        assert.ok(ke.some(([v]) => !v.startsWith('cau')), `${id} phải nối vào một nút trong đảo`);
    }
});

test('lộ trình café → bàn Marketing kết thúc đúng chỗ ngồi và đi qua cầu café', () => {
    const g = dungDoThi(L);
    const cafe = L.dao.find(d => d.id === 'cafe');
    const ghe = choNgoi(L.khu.find(k => k.id === 'marketing'), 3)[1];
    const lt = loTrinh(g, 'cafe', { x: cafe.x, z: cafe.z }, 'chinh', ghe);
    assert.deepEqual(xz(lt[lt.length - 1]), xz(ghe));
    assert.ok(lt.every(q => q.dao), 'mọi điểm lộ trình phải mang đảo');
    assert.ok(lt.length >= 3);
});

test('vào bàn đi theo lối sau lưng ghế, ra khỏi bàn cũng theo lối đó', () => {
    const g = dungDoThi(L);
    const mk = L.khu.find(k => k.id === 'marketing');
    const ghe = { ...choNgoi(mk, 4)[3], dao: 'chinh' };
    assert.equal(ghe.loi.length, 2);
    const cafe = L.dao.find(d => d.id === 'cafe');
    const vao = loTrinhDayDu(g, 'cafe', { x: cafe.x, z: cafe.z }, null, ghe);
    // Hai điểm cuối trước ghế phải đúng là lối đi (đầu lối → ngay sau ghế), điểm cuối là ghế
    assert.deepEqual(vao.slice(-3).map(xz), [ghe.loi[0], ghe.loi[1], { x: ghe.x, z: ghe.z }]);
    // Lối đi nằm SAU lưng ghế (z lớn hơn ghế) — không cắt qua bàn (bàn ở phía z nhỏ hơn)
    assert.ok(ghe.loi.every(p => p.z > ghe.z));
    // Ra: đi ngược lối trước
    const caf = { ...choNgoi(L.khu.find(k => k.id === 'cafe'), 1)[0], dao: 'cafe' };
    const ra = loTrinhDayDu(g, 'chinh', ghe, ghe, caf);
    assert.deepEqual(ra.slice(0, 2).map(xz), [ghe.loi[1], ghe.loi[0]]);
    assert.deepEqual(xz(ra[ra.length - 1]), { x: caf.x, z: caf.z });
});

test('đầu lối của khu đảo chính nằm phía bục giữa', () => {
    for (const id of ['khach-hang', 'marketing', 'tai-chinh', 'code']) {
        const k = L.khu.find(x => x.id === id);
        const dau = choNgoi(k, 1)[0].loi[0];
        assert.ok(Math.abs(dau.x) < Math.abs(k.x), `${id}: đầu lối ${dau.x} phải gần tâm hơn khu ${k.x}`);
    }
});

test('khu đích theo trạng thái', () => {
    assert.equal(khuDich({ trangThai: 'dang_chay', phong: 'marketing' }), 'marketing');
    assert.equal(khuDich({ trangThai: 'dang_chay', phong: 'khong-co' }), 'cafe');
    assert.equal(khuDich({ trangThai: 'cho_duyet', phong: 'marketing' }), 'hop');
    assert.equal(khuDich({ trangThai: 'ranh' }), 'cafe');
    // lỗi / cần chủ xử lý ⇒ khu cảnh báo quanh bồn hoa giữa; layout không có khu đó ⇒ lỗi đứng nguyên, cần xử lý sang phòng họp
    assert.equal(khuDich({ trangThai: 'loi' }), 'canh-bao');
    assert.equal(khuDich({ trangThai: 'can_xu_ly', phong: 'marketing' }), 'canh-bao');
    const khongCanhBao = { ...L, khu: L.khu.filter(k => k.id !== 'canh-bao') };
    assert.equal(khuDich({ trangThai: 'loi' }, khongCanhBao), null);
    assert.equal(khuDich({ trangThai: 'can_xu_ly' }, khongCanhBao), 'hop');
    assert.equal(khuDich({ trangThai: 'ranh', vaiTro: 'chief' }), 'chief');
});

test('chỗ ngồi đủ cho số người (bàn tự thêm hàng)', () => {
    const k = L.khu.find(x => x.id === 'marketing');
    assert.ok(choNgoi(k, 9).length >= 9);
    assert.ok(choNgoi(L.khu.find(x => x.id === 'cafe'), 15).length >= 15);
});

test('đầu cầu nằm trong đảo', () => {
    const a = L.dao.find(d => d.id === 'chinh'); const b = L.dao.find(d => d.id === 'qa');
    const p = dauCau(a, b);
    assert.ok(Math.abs(p.x - a.x) <= a.w / 2 && Math.abs(p.z - a.z) <= a.d / 2);
});
