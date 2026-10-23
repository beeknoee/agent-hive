import test from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT_MAC_DINH as L, dungDoThi, loTrinhDayDu, loTrinhDoiDich, choNgoi, timDao, timKhu, dauCau, BAN_CAFE, QUAY_CAFE } from '../src/core/layout.js';
import { taoQuanLyCho, TIEN_TO_PHU } from '../src/core/seats.js';

const xz = (p) => ({ x: +p.x.toFixed(6), z: +p.z.toFixed(6) });
const trongDaoChua = (dao, p, le = 0.3) => (dao.tron
    ? Math.hypot(p.x - dao.x, p.z - dao.z) <= Math.min(dao.w, dao.d) / 2 - le
    : Math.abs(p.x - dao.x) <= dao.w / 2 - le && Math.abs(p.z - dao.z) <= dao.d / 2 - le);

test('chỗ thứ i KHÔNG đổi khi khu đông thêm (không căn giữa lại — bàn scene.js dựng cố định)', () => {
    for (const k of L.khu) {
        const dao = timDao(L, k.dao);
        const it = choNgoi(k, 1, dao);
        for (const n of [it.length + 1, it.length + 5, 30]) {
            const nhieu = choNgoi(k, n, dao);
            assert.ok(nhieu.length >= n, `${k.id}: thiếu chỗ cho ${n} người`);
            assert.deepEqual(nhieu.slice(0, it.length).map(xz), it.map(xz), `${k.id}: chỗ chuẩn bị dời khi có ${n} người`);
            const n5 = choNgoi(k, it.length + 5, dao);
            if (nhieu.length >= n5.length) assert.deepEqual(nhieu.slice(0, n5.length).map(xz), n5.map(xz), `${k.id}: chỗ dư bị dời`);
        }
    }
});

test('mọi chỗ (kể cả chỗ dư tới 30 người) nằm TRONG đảo', () => {
    for (const k of L.khu) {
        const dao = timDao(L, k.dao);
        for (const c of choNgoi(k, 30, dao)) assert.ok(trongDaoChua(dao, c), `${k.id}: chỗ (${c.x.toFixed(2)}, ${c.z.toFixed(2)}) ra ngoài đảo ${dao.id}`);
    }
});

test('phòng họp / café đông: không hai người đứng đè nhau', () => {
    for (const id of ['hop', 'cafe', 'khach-hang', 'ha-tang']) {
        const k = timKhu(L, id);
        const ds = choNgoi(k, id === 'cafe' ? 40 : 16, timDao(L, k.dao));
        for (let i = 0; i < ds.length; i++) {
            for (let j = i + 1; j < ds.length; j++) {
                const kc = Math.hypot(ds[i].x - ds[j].x, ds[i].z - ds[j].z);
                assert.ok(kc > 0.45, `${id}: chỗ ${i} và ${j} cách nhau ${kc.toFixed(2)}`);
            }
        }
    }
});

test('café: không ghế / chỗ đứng nào chắn QUẦY hay LỐI VÀO từ cầu', () => {
    const k = timKhu(L, 'cafe');
    const ds = choNgoi(k, 40, timDao(L, k.dao));
    const tx = Math.cos(QUAY_CAFE.ry); const tz = -Math.sin(QUAY_CAFE.ry);
    const a = { x: k.x + QUAY_CAFE.x - tx * 1.76, z: k.z + QUAY_CAFE.z - tz * 1.76 };
    const b = { x: k.x + QUAY_CAFE.x + tx * 1.76, z: k.z + QUAY_CAFE.z + tz * 1.76 };
    ds.forEach((c, i) => {
        assert.ok(kcDoan(c, a, b) > 0.6, `chỗ ${i} (${c.x.toFixed(2)}, ${c.z.toFixed(2)}) dính quầy`);
        // lối vào: dải |x| < 0.6 từ đầu cầu (mép −z) tới tâm quán
        assert.ok(!(Math.abs(c.x - k.x) < 0.6 && c.z < k.z), `chỗ ${i} chắn lối vào`);
    });
    for (const [bx, bz] of BAN_CAFE) assert.ok(!(Math.abs(bx) < 1.1 && bz < 0.5), `bàn (${bx}, ${bz}) nằm trên lối vào`);
});

test('khu cảnh báo: đứng quanh bồn hoa giữa, ô đầu ở phía camera, không ai đứng trong bồn', () => {
    const k = timKhu(L, 'canh-bao');
    const ds = choNgoi(k, 14, timDao(L, k.dao));
    assert.ok(ds[0].x > k.x && ds[0].z > k.z, 'người đầu tiên đứng phía trước (camera nhìn từ +x +z)');
    for (const c of ds) assert.ok(Math.hypot(c.x - k.x, c.z - k.z) > 1.7, `(${c.x.toFixed(2)}, ${c.z.toFixed(2)}) đứng trong bồn hoa`);
});

test('nhân viên phụ không chiếm chỗ dư; agent cần chỗ thì đuổi phụ', () => {
    const q = taoQuanLyCho(L);
    const phu = (i) => `${TIEN_TO_PHU}${i}`;
    assert.ok(q.lay('qa', phu(0)));
    assert.ok(q.lay('qa', phu(1)));
    assert.equal(q.lay('qa', phu(2)), null, 'QA chỉ 2 bàn — phụ thứ 3 không được tạo chỗ dư');
    const a = q.lay('qa', 'agent-a');
    assert.ok(a.duoi && a.duoi.startsWith(TIEN_TO_PHU), 'agent phải đuổi một nhân viên phụ');
    assert.ok(a.cho.ban, 'agent được ngồi BÀN thật, không phải chỗ đứng');
    assert.equal(q.khuCua(a.duoi), undefined, 'phụ bị đuổi không còn giữ chỗ');
    const b = q.lay('qa', 'agent-b'); const c = q.lay('qa', 'agent-c');
    assert.ok(b.cho.ban);
    assert.ok(!c.cho.ban, 'hết bàn, không còn phụ để đuổi ⇒ chỗ đứng dư');
    assert.equal(q.dem('qa'), 3);
});

test('khu đích không tồn tại ⇒ GIỮ chỗ cũ (không nhả trước)', () => {
    const q = taoQuanLyCho(L);
    assert.ok(q.lay('marketing', 'x'));
    assert.equal(q.lay('khong-co', 'x'), null);
    assert.equal(q.khuCua('x'), 'marketing');
    assert.equal(q.dem('marketing'), 1);
    q.lay('cafe', 'x');
    assert.equal(q.dem('marketing'), 0, 'đổi khu thành công ⇒ nhả chỗ cũ');
    q.tra('x');
    assert.equal(q.dem('cafe'), 0);
});

// ── Đổi đích GIỮA ĐƯỜNG: mọi đoạn đi phải nằm trên đảo hoặc trên cầu ──
const g = dungDoThi(L);
const cau = L.cau.map(c => { const a = timDao(L, c.tu); const b = timDao(L, c.den); return [dauCau(a, b), dauCau(b, a)]; });
const kcDoan = (p, a, b) => {
    const dx = b.x - a.x; const dz = b.z - a.z; const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
};
const diDuoc = (p) => L.dao.some(d => trongDaoChua(d, p, 0)) || cau.some(([a, b]) => kcDoan(p, a, b) < 0.7);
function kiemDuong(tu, ds, nhan) {
    let a = tu;
    for (const b of ds) {
        for (let s = 0; s <= 20; s++) {
            const p = { x: a.x + (b.x - a.x) * s / 20, z: a.z + (b.z - a.z) * s / 20 };
            assert.ok(diDuoc(p), `${nhan}: điểm (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) giữa trời`);
        }
        a = b;
    }
}
/** Đi `quang` đơn vị dọc lộ trình từ `p` ⇒ { p, conLai } */
function diMotDoan(p, ds, quang) {
    let cur = { ...p }; const con = ds.slice();
    while (con.length && quang > 0) {
        const q = con[0]; const kc = Math.hypot(q.x - cur.x, q.z - cur.z);
        if (kc <= quang) { quang -= kc; cur = { x: q.x, z: q.z }; con.shift(); } else { cur = { x: cur.x + (q.x - cur.x) * quang / kc, z: cur.z + (q.z - cur.z) * quang / kc }; quang = 0; }
    }
    return { p: cur, conLai: con };
}

test('đổi đích khi đang đi (ở mọi quãng): không đi xuyên khoảng trời giữa hai đảo', () => {
    const cho = (khu, i = 0) => ({ ...choNgoi(timKhu(L, khu), i + 1, timDao(L, timKhu(L, khu).dao))[i], dao: timKhu(L, khu).dao });
    const cap = [['cafe', 'qa', 'khach-hang'], ['qa', 'cafe', 'thu-vien'], ['ha-tang', 'hop', 'cafe'], ['thu-vien', 'qa', 'ha-tang'], ['marketing', 'cafe', 'hop']];
    for (const [tu, den, moi] of cap) {
        const c0 = cho(tu); const c1 = cho(den); const c2 = cho(moi);
        const lt = loTrinhDayDu(g, c0.dao, c0, c0, c1);
        let tong = 0; let a = c0;
        for (const b of lt) { tong += Math.hypot(b.x - a.x, b.z - a.z); a = b; }
        for (let k = 1; k < 12; k++) {
            const { p, conLai } = diMotDoan(c0, lt, (tong * k) / 12);
            if (!conLai.length) continue;
            const ltMoi = loTrinhDoiDich(g, c0.dao, conLai[0], c2);
            kiemDuong(p, ltMoi, `${tu}→${den} đổi sang ${moi} ở ${k}/12`);
            assert.deepEqual(xz(ltMoi[ltMoi.length - 1]), xz(c2));
        }
    }
});
