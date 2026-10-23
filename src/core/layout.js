/**
 * Bố cục mặc định "văn phòng trên mây" + các hàm THUẦN (không phụ thuộc Three.js) để kiểm thử bằng `node --test`.
 *
 * Toạ độ: mặt sàn mọi đảo ở y = 0; x sang phải, z về phía người xem. Đơn vị ≈ 1 m.
 * Một đảo có các KHU (zone); mỗi khu là một loại chỗ đứng: bàn làm việc (`ban`), ghế café (`cafe`), chỗ đứng họp (`hop`),
 * bục (`buc`), bàn CEO (`ceo`) hoặc tủ máy (`may`). Nhân viên được xếp chỗ theo `agent.phong` = id khu.
 */

/** @typedef {{ id:string, ten:string, x:number, z:number, w:number, d:number, tron?:boolean, kinh?:boolean, mau?:string }} Dao */
/** @typedef {{ id:string, dao:string, ten?:string, loai:'ban'|'cafe'|'hop'|'buc'|'ceo'|'bao'|'may', x:number, z:number, cot?:number, hang?:number, mau?:string }} Khu */
/** @typedef {{ tu:string, den:string }} Cau */

/** @type {{ dao: Dao[], khu: Khu[], cau: Cau[] }} */
export const LAYOUT_MAC_DINH = {
    dao: [
        { id: 'chinh', ten: 'VĂN PHÒNG CHÍNH', x: 0, z: 0, w: 20, d: 15 },
        { id: 'may', ten: 'MACHINE DECK', x: -17, z: -11, w: 9, d: 7 },
        // AI Lab: thủ thư + kệ sách + hologram, và phòng CEO (bàn ghế riêng) ⇒ đảo rộng 14
        { id: 'thu-vien', ten: 'AI LAB · CEO', x: 0, z: -16.5, w: 14, d: 7.5 },
        { id: 'hop', ten: 'PHÒNG HỌP', x: 16, z: -10, w: 7.5, d: 6.5, kinh: true },
        { id: 'qa', ten: 'QA LAB', x: 17, z: 4, w: 7, d: 6 },
        // Phòng BD (Business Development · phát triển kinh doanh), đối xứng QA Lab bên trái
        { id: 'bd', ten: 'BD · PHÁT TRIỂN KD', x: -17, z: 5, w: 8, d: 6.5 },
        // Café rộng 13 (đủ 6 bàn + quầy), cách đảo chính đủ xa cho cầu dài vừa
        { id: 'cafe', ten: 'CAFÉ', x: 0, z: 17.5, w: 13, d: 13, tron: true },
    ],
    khu: [
        { id: 'chief', dao: 'thu-vien', ten: 'CEO', loai: 'ceo', x: 4.3, z: -16.8 },
        { id: 'khach-hang', dao: 'chinh', ten: 'KHÁCH HÀNG', loai: 'ban', x: -5.5, z: -3.6, mau: '#3b82f6' },
        { id: 'marketing', dao: 'chinh', ten: 'MARKETING', loai: 'ban', x: 5.5, z: -3.6, mau: '#ec4899' },
        { id: 'tai-chinh', dao: 'chinh', ten: 'TÀI CHÍNH', loai: 'ban', x: -5.5, z: 3.8, mau: '#10b981' },
        { id: 'code', dao: 'chinh', ten: 'CODE & DEPLOY', loai: 'ban', x: 5.5, z: 3.8, mau: '#8b5cf6' },
        { id: 'ha-tang', dao: 'may', ten: 'HẠ TẦNG', loai: 'may', x: -17, z: -11, mau: '#f59e0b' },
        { id: 'thu-vien', dao: 'thu-vien', ten: 'AI LAB', loai: 'ban', x: -3.5, z: -16.5, cot: 2, hang: 1, mau: '#eab308' },
        { id: 'hop', dao: 'hop', loai: 'hop', x: 16, z: -10 },
        { id: 'qa', dao: 'qa', ten: 'QA', loai: 'ban', x: 17, z: 4, cot: 2, hang: 1, mau: '#06b6d4' },
        { id: 'bd', dao: 'bd', ten: 'BD', loai: 'ban', x: -17, z: 4.6, cot: 2, hang: 2, mau: '#f97316' },
        { id: 'cafe', dao: 'cafe', loai: 'cafe', x: 0, z: 17.5 },
        // Agent LỖI / CẦN XỬ LÝ ra đứng quanh BỒN HOA giữa đảo chính, chấm đỏ nháy — nhìn là thấy ngay
        { id: 'canh-bao', dao: 'chinh', loai: 'bao', x: 0, z: 0 },
    ],
    cau: [
        { tu: 'chinh', den: 'may' },
        { tu: 'chinh', den: 'thu-vien' },
        { tu: 'chinh', den: 'hop' },
        { tu: 'chinh', den: 'qa' },
        { tu: 'chinh', den: 'cafe' },
        { tu: 'chinh', den: 'bd' },
    ],
};

/** Bố cục mặc định với tên tiếng Anh — createAgentHive tự dùng khi `ngonNgu: 'en'` và không truyền `layout`. Vị trí y hệt. */
const TEN_EN = {
    dao: { chinh: 'MAIN OFFICE', 'thu-vien': 'AI LAB · CEO', hop: 'MEETING ROOM', 'bd': 'BD · BUSINESS DEV', cafe: 'CAFÉ' },
    khu: { 'khach-hang': 'CUSTOMERS', 'tai-chinh': 'FINANCE', 'ha-tang': 'INFRA' },
};
export const LAYOUT_EN = {
    ...LAYOUT_MAC_DINH,
    dao: LAYOUT_MAC_DINH.dao.map(d => (TEN_EN.dao[d.id] ? { ...d, ten: TEN_EN.dao[d.id] } : d)),
    khu: LAYOUT_MAC_DINH.khu.map(k => (TEN_EN.khu[k.id] ? { ...k, ten: TEN_EN.khu[k.id] } : k)),
};

export const TRANG_THAI = ['ranh', 'dang_chay', 'cho_duyet', 'loi', 'can_xu_ly', 'tat'];

/**
 * Café (toạ độ TƯƠNG ĐỐI tâm khu): 5 bàn tròn × 4 ghế. Lối từ cầu đảo chính vào theo trục x = 0 phía −z ⇒ không bàn nào nằm trên đó.
 * QUẦY ở mép phải (hướng (0,75; −0,66)) — cạnh lối vào từ cầu nhưng không chắn lối.
 */
// thêm bàn + ghế QUẦY cho bớt người đứng: 6 bàn × 4 ghế (cách nhau ≥ 2,6) + 4 ghế quầy = 28 chỗ ngồi
export const BAN_CAFE = [[-2.8, -2], [-4.4, 0.6], [-2.2, 2.6], [0.4, 4.2], [3, 3.2], [2.6, 0.6]];
export const QUAY_CAFE = { x: 3.2, z: -2.85, ry: -0.85 };   // ry: trục dài của quầy chạy dọc mép đảo
/** Ghế quầy (tương đối tâm khu): dọc quầy phía TRONG quán, cách trục quầy 0,8, quay mặt vào quầy. */
export function gheQuayCafe() {
    const tx = Math.cos(QUAY_CAFE.ry); const tz = -Math.sin(QUAY_CAFE.ry);   // trục dài quầy
    const ix = -tz; const iz = tx;                                           // pháp tuyến hướng VÀO trong quán
    return [-1.2, -0.4, 0.4, 1.2].map(t => ({ x: QUAY_CAFE.x + t * tx + 0.8 * ix, z: QUAY_CAFE.z + t * tz + 0.8 * iz, huong: Math.atan2(-ix, -iz) }));
}

const timDao = (layout, id) => layout.dao.find(d => d.id === id);
const timKhu = (layout, id) => layout.khu.find(k => k.id === id);

/**
 * Điểm trên MÉP đảo `a` nhìn về phía đảo `b` (đầu cầu). Đảo chữ nhật: cắt tia tâm→tâm với hình chữ nhật; đảo tròn: bán kính.
 */
export function dauCau(a, b) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dai = Math.hypot(dx, dz) || 1;
    const ux = dx / dai;
    const uz = dz / dai;
    let t;
    if (a.tron) t = Math.min(a.w, a.d) / 2;
    else {
        const tx = Math.abs(ux) > 1e-6 ? (a.w / 2) / Math.abs(ux) : Infinity;
        const tz = Math.abs(uz) > 1e-6 ? (a.d / 2) / Math.abs(uz) : Infinity;
        t = Math.min(tx, tz);
    }
    t -= 0.6;   // lùi vào trong mép một chút để nhân vật không đứng trên lan can
    return { x: a.x + ux * t, z: a.z + uz * t };
}

/** Kéo điểm vào trong đảo (cách mép `le`) — chỗ dư không được rơi ra ngoài lan can / giữa trời. */
export function trongDao(dao, p, le = 0.9) {
    if (!dao) return p;
    if (dao.tron) {
        const r = Math.min(dao.w, dao.d) / 2 - le;
        const dx = p.x - dao.x; const dz = p.z - dao.z; const kc = Math.hypot(dx, dz);
        return kc <= r ? p : { ...p, x: dao.x + (dx / kc) * r, z: dao.z + (dz / kc) * r };
    }
    const x = Math.max(dao.x - dao.w / 2 + le, Math.min(dao.x + dao.w / 2 - le, p.x));
    const z = Math.max(dao.z - dao.d / 2 + le, Math.min(dao.z + dao.d / 2 - le, p.z));
    return x === p.x && z === p.z ? p : { ...p, x, z };
}

/**
 * Thêm một chỗ DƯ: kéo vào trong đảo; nếu sau khi kéo trùng (< 0,7) chỗ đã có ⇒ lấy ô lưới trống gần điểm muốn nhất trong đảo.
 * Tất định (không ngẫu nhiên) ⇒ gọi lại ra đúng chỗ cũ.
 */
function themChoDu(ds, p, dao) {
    const trung = (q) => ds.some(c => Math.hypot(c.x - q.x, c.z - q.z) < 0.7);
    let q = trongDao(dao, p);
    if (dao && trung(q)) {
        let tot = null; let min = Infinity;
        const buoc = 0.9; const nx = Math.floor(dao.w / buoc); const nz = Math.floor(dao.d / buoc);
        for (let i = 0; i <= nx; i++) {
            for (let j = 0; j <= nz; j++) {
                const o = { x: dao.x - dao.w / 2 + i * buoc, z: dao.z - dao.d / 2 + j * buoc };
                if (trongDao(dao, o) !== o || trung(o)) continue;   // ngoài vùng an toàn hoặc đã có người
                const kc = Math.hypot(o.x - p.x, o.z - p.z);
                if (kc < min) { min = kc; tot = o; }
            }
        }
        if (tot) q = { ...p, x: tot.x, z: tot.z };
    }
    ds.push(q);
}

/**
 * Chỗ ngồi/đứng của một khu — sinh ĐỦ cho `soNguoi` người. Mỗi chỗ: { x, z, huong } (huong = góc quay mặt).
 * Bàn: lưới cot × hang cụm bàn đôi, người ngồi phía nam của bàn quay mặt về bắc (về màn hình).
 *
 * BẤT BIẾN: chỗ thứ i KHÔNG phụ thuộc soNguoi — gọi lại với số lớn hơn chỉ NỐI THÊM chỗ dư phía sau, chỗ cũ giữ
 * nguyên. Bản trước căn giữa lại cả lưới khi đông người ⇒ mọi người lệch khỏi bàn scene.js đã dựng, không bao giờ về lại.
 * Chỗ CHUẨN (có bàn/ghế thật) = choNgoi(khu, 1).length; chỗ dư là chỗ ĐỨNG (không `ban`/`ngoi`), kéo vào trong đảo nếu có `dao`.
 */
export function choNgoi(khu, soNguoi = 1, dao = null) {
    const ds = [];
    // y = mặt bục (scene.js dựng bục cao 0,22) — không có thì Chief đứng lún vào trong bục
    if (khu.loai === 'bao') {
        // Vòng quanh bồn hoa (bán kính bồn 1,25 + lá): r = 2,05, ô ĐẦU TIÊN ở phía camera (+x+z), rồi xen kẽ hai bên;
        // đứng QUAY MẶT RA (về phía người xem) như đang chờ. 8 ô cách nhau ~1,5; đông hơn ⇒ vòng ngoài r = 2,9 (ngoài hành lang 2,6)
        const r1 = 2.05; const r2 = 2.9;
        for (let i = 0; i < Math.max(1, soNguoi); i++) {
            const vong = i < 8 ? 0 : 1; const j = vong ? i - 8 : i;
            const buoc = vong ? 0.55 : 0.75;
            const g = Math.PI / 4 + (j === 0 ? 0 : (j % 2 ? 1 : -1) * Math.ceil(j / 2) * buoc);
            const r = vong ? r2 : r1;
            themChoDu(ds, { x: khu.x + Math.cos(g) * r, z: khu.z + Math.sin(g) * r, huong: Math.atan2(Math.cos(g), Math.sin(g)) }, dao);
        }
        return ds;
    }
    if (khu.loai === 'ceo') {
        // Bàn CEO (scene.js): CEO NGỒI sau bàn, quay mặt +z (về phía camera); vào ghế từ bên trái sau bàn — không đi xuyên bàn
        ds.push({ x: khu.x, z: khu.z - 0.75, huong: 0, ngoi: true, ban: true, loi: [{ x: khu.x - 1.7, z: khu.z - 0.75 }] });
        // Người thứ hai trở đi (khách / chief thứ hai): đứng trước bàn
        for (let i = 1; i < soNguoi; i++) {
            themChoDu(ds, { x: khu.x + (i % 2 ? -0.7 : 0.7) * Math.ceil(i / 2), z: khu.z + 1.4, huong: Math.PI }, dao);
        }
        return ds;
    }
    if (khu.loai === 'buc') {
        ds.push({ x: khu.x, z: khu.z, y: 0.22, huong: Math.PI / 4 });
        // Người thứ hai trở đi (2 chief / agent phong 'chief') đứng quanh bục, không chồng lên nhau
        for (let i = 1; i < soNguoi; i++) {
            const g = Math.PI / 4 + (i - 1) * (Math.PI / 3);
            themChoDu(ds, { x: khu.x + Math.sin(g) * 1.7, z: khu.z + Math.cos(g) * 1.7, huong: g + Math.PI }, dao);
        }
        return ds;
    }
    if (khu.loai === 'ban') {
        const cot = khu.cot || 2;
        const hang = khu.hang || 2;
        // LỐI ĐI: vào bàn phải đi dọc lối giữa các dãy (sau lưng ghế) rồi mới rẽ vào chỗ — bản 1 đi thẳng
        // từ hành lang tới ghế nên xuyên qua bàn người khác. Đầu lối nằm ở cạnh khu GẦN TÂM ĐẢO (đảo chính: phía bục giữa).
        const nuaRong = ((cot - 1) * 2.4) / 2 + 1.5;
        const canhX = khu.dao === 'chinh' ? khu.x - Math.sign(khu.x || 1) * nuaRong : khu.x - nuaRong;
        for (let h = 0; h < hang; h++) {
            for (let c = 0; c < cot; c++) {
                const x = khu.x + (c - (cot - 1) / 2) * 2.4;
                const z = khu.z + (h - (hang - 1) / 2) * 2.2 + 0.55;
                const loiZ = z + 0.95;   // lối đi sau lưng ghế
                ds.push({ x, z, huong: Math.PI, ban: true, loi: [{ x: canhX, z: loiZ }, { x, z: loiZ }] });
            }
        }
        // Chỗ dư: ĐỨNG cạnh bàn — dọc hai mép ngoài của khu (trái/phải), quay vào bàn
        for (let i = ds.length; i < soNguoi; i++) {
            const k = i - cot * hang;
            const ben = k % 2 ? 1 : -1; const tang = Math.floor(k / 2);
            const z = khu.z + ((tang % hang) - (hang - 1) / 2) * 2.2 + 0.55 + Math.floor(tang / hang) * 0.8;
            themChoDu(ds, { x: khu.x + ben * (nuaRong + 0.3), z, huong: ben > 0 ? -Math.PI / 2 : Math.PI / 2 }, dao);
        }
        return ds;
    }
    if (khu.loai === 'cafe') {
        // Bàn tròn nhỏ, mỗi bàn 4 ghế (BAN_CAFE — scene.js dựng đúng các bàn này)
        for (const [bx, bz] of BAN_CAFE) {
            for (let i = 0; i < 4; i++) {
                const g = (i / 4) * Math.PI * 2 + Math.PI / 4;
                ds.push({ x: khu.x + bx + Math.cos(g) * 0.8, z: khu.z + bz + Math.sin(g) * 0.8, huong: Math.atan2(-Math.cos(g), -Math.sin(g)), ngoi: true });
            }
        }
        for (const g of gheQuayCafe()) ds.push({ x: khu.x + g.x, z: khu.z + g.z, huong: g.huong, ngoi: true });
        // Chỗ dư: đứng thành 2 vòng sát lan can (cố định — bản trước rải NGẪU NHIÊN, có thể trùng bàn/quầy).
        // Bỏ các ô trước QUẦY và trước LỐI VÀO từ cầu (phía −z) để không ai đứng chắn.
        const gQuay = Math.atan2(QUAY_CAFE.z, QUAY_CAFE.x);
        const lech = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
        const oTrong = [];
        for (let vong = 0; vong < 2; vong++) {
            for (let j = 0; j < 16; j++) {
                const g = (j / 16) * Math.PI * 2 + vong * (Math.PI / 16);
                if (lech(g, gQuay) < 0.6 || lech(g, -Math.PI / 2) < 0.35) continue;
                oTrong.push({ g, r: 4.9 + vong * 0.75 });
            }
        }
        for (let i = ds.length; i < soNguoi; i++) {
            const k = i - BAN_CAFE.length * 4 - 4;
            const o = oTrong[k] || oTrong[k % oTrong.length];
            themChoDu(ds, { x: khu.x + Math.cos(o.g) * o.r, z: khu.z + Math.sin(o.g) * o.r, huong: Math.atan2(-Math.cos(o.g), -Math.sin(o.g)) }, dao);
        }
        return ds;
    }
    if (khu.loai === 'hop') {
        // NGỒI quanh bàn họp (6 ghế — scene.js), quay mặt vào bàn. huong = góc quay quanh Y để mặt (+z cục bộ)
        // nhìn về tâm bàn: hướng nhìn (−cos g, −sin g) ⇒ atan2(−cos g, −sin g).
        for (let i = 0; i < 6; i++) {
            const g = (i / 6) * Math.PI * 2;
            ds.push({ x: khu.x + Math.cos(g) * 1.5, z: khu.z + Math.sin(g) * 1.2, huong: Math.atan2(-Math.cos(g), -Math.sin(g)), ngoi: true });
        }
        // Người thứ 7+: ĐỨNG vòng ngoài, lệch góc so với ghế (bản trước tính lại cả vòng ⇒ hai người cách nhau 0,21 — đè nhau)
        for (let i = 6; i < soNguoi; i++) {
            const k = i - 6; const g = ((k % 10) / 10) * Math.PI * 2 + Math.PI / 10;
            const r = 1 + Math.floor(k / 10) * 0.25;
            themChoDu(ds, { x: khu.x + Math.cos(g) * 2.4 * r, z: khu.z + Math.sin(g) * 1.95 * r, huong: Math.atan2(-Math.cos(g), -Math.sin(g)) }, dao);
        }
        return ds;
    }
    // may: đứng trước dãy tủ, 3 người một hàng (hàng thứ 4 trở đi tràn ra ngoài lan can)
    for (let i = 0; i < Math.max(3, soNguoi); i++) {
        themChoDu(ds, { x: khu.x - 2 + (i % 3) * 1.6, z: khu.z + 1.6 + Math.floor(i / 3) * 1.1, huong: Math.PI }, dao);
    }
    return ds;
}

/**
 * Đồ thị đường đi: mỗi đảo một nút TÂM (đảo chính có 4 nút hành lang quanh bục để không đi xuyên bục) + hai đầu mỗi cầu.
 * Trả { nut: Map<id,{x,z,dao}>, ke: Map<id, Array<[id, dai]>> }.
 */
export function dungDoThi(layout) {
    const nut = new Map();
    const ke = new Map();
    const them = (id, x, z, dao) => { nut.set(id, { x, z, dao }); ke.set(id, []); };
    const noi = (a, b) => {
        const A = nut.get(a); const B = nut.get(b);
        const dai = Math.hypot(A.x - B.x, A.z - B.z);
        ke.get(a).push([b, dai]); ke.get(b).push([a, dai]);
    };
    for (const d of layout.dao) {
        if (d.id === 'chinh') {
            // Hành lang chữ thập quanh bục giữa: 4 góc cách tâm ~2.6
            const r = 2.6;
            them('chinh:b', d.x, d.z - r, 'chinh');
            them('chinh:n', d.x, d.z + r, 'chinh');
            them('chinh:t', d.x - r, d.z, 'chinh');
            them('chinh:d', d.x + r, d.z, 'chinh');
            noi('chinh:b', 'chinh:t'); noi('chinh:t', 'chinh:n'); noi('chinh:n', 'chinh:d'); noi('chinh:d', 'chinh:b');
        } else {
            them(`${d.id}:tam`, d.x, d.z, d.id);
        }
    }
    // boQuaCau: khi NỐI đầu cầu vào đảo thì phải chọn nút trong đảo (tâm / hành lang), không chọn chính đầu cầu khác.
    const nutGanNhatTrenDao = (daoId, p, { boQuaCau = false } = {}) => {
        let tot = null; let min = Infinity;
        for (const [id, n] of nut) {
            if (n.dao !== daoId) continue;
            if (boQuaCau && id.startsWith('cau')) continue;
            const kc = Math.hypot(n.x - p.x, n.z - p.z);
            if (kc < min) { min = kc; tot = id; }
        }
        return tot;
    };
    layout.cau.forEach((c, i) => {
        const a = timDao(layout, c.tu); const b = timDao(layout, c.den);
        const pa = dauCau(a, b); const pb = dauCau(b, a);
        const ia = `cau${i}:${a.id}`; const ib = `cau${i}:${b.id}`;
        const trongA = nutGanNhatTrenDao(a.id, pa, { boQuaCau: true });
        const trongB = nutGanNhatTrenDao(b.id, pb, { boQuaCau: true });
        them(ia, pa.x, pa.z, a.id); them(ib, pb.x, pb.z, b.id);
        noi(ia, ib);
        noi(ia, trongA);
        noi(ib, trongB);
    });
    return { nut, ke, nutGanNhatTrenDao };
}

/** Dijkstra trên đồ thị nhỏ (< 100 nút) — trả mảng id nút từ `tu` tới `den` (rỗng nếu không tới được). */
export function duongNganNhat(doThi, tu, den) {
    if (tu === den) return [tu];
    const kc = new Map([[tu, 0]]);
    const truoc = new Map();
    const chua = new Set(doThi.nut.keys());
    while (chua.size) {
        let u = null; let min = Infinity;
        for (const id of chua) { const v = kc.get(id) ?? Infinity; if (v < min) { min = v; u = id; } }
        if (u == null || min === Infinity) break;
        chua.delete(u);
        if (u === den) break;
        for (const [v, dai] of doThi.ke.get(u)) {
            const moi = min + dai;
            if (moi < (kc.get(v) ?? Infinity)) { kc.set(v, moi); truoc.set(v, u); }
        }
    }
    if (!truoc.has(den)) return [];
    const ds = [den];
    while (ds[0] !== tu) ds.unshift(truoc.get(ds[0]));
    return ds;
}

/**
 * Lộ trình từ điểm p (đang đứng trên đảo daoTu) tới điểm q (trên đảo daoDen): các điểm {x,z} nối tiếp.
 * Cùng đảo (trừ đảo chính) ⇒ đi thẳng. Đảo chính ⇒ qua hành lang quanh bục.
 */
export function loTrinh(doThi, daoTu, p, daoDen, q) {
    const cuoi = { x: q.x, z: q.z, dao: daoDen };
    if (daoTu === daoDen && daoTu !== 'chinh') return [cuoi];
    const a = doThi.nutGanNhatTrenDao(daoTu, p);
    const b = doThi.nutGanNhatTrenDao(daoDen, q);
    if (!a || !b) return [cuoi];
    const ids = duongNganNhat(doThi, a, b);
    // Mỗi điểm mang `dao` (đảo chứa điểm đó) ⇒ người đổi đích GIỮA ĐƯỜNG biết mình đang ở đảo nào
    return [...ids.map(id => { const n = doThi.nut.get(id); return { x: n.x, z: n.z, dao: n.dao }; }), cuoi];
}

/**
 * Lộ trình ĐẦY ĐỦ cho một người: (ra khỏi chỗ cũ theo lối của nó) → đường qua cầu → (vào chỗ mới theo lối của nó) → chỗ.
 * Mọi điểm trả về có `dao`.
 * @param {{x:number,z:number}} p      vị trí hiện tại
 * @param {any} choCu                   chỗ đang ngồi (có thể có `loi`)
 * @param {any} cho                     chỗ mới (có thể có `loi`), kèm `dao`
 */
export function loTrinhDayDu(doThi, daoTu, p, choCu, cho) {
    const ra = choCu?.loi ? [...choCu.loi].reverse().map(d => ({ x: d.x, z: d.z, dao: daoTu })) : [];
    const vao = (cho.loi || []).map(d => ({ x: d.x, z: d.z, dao: cho.dao }));
    const xuatPhat = ra.length ? ra[ra.length - 1] : p;
    const diemVao = vao.length ? vao[0] : cho;
    const giua = loTrinh(doThi, daoTu, xuatPhat, cho.dao, diemVao);
    // loTrinh luôn kết thúc bằng điểm đích truyền vào (diemVao) ⇒ bỏ để khỏi lặp với `vao`
    if (vao.length) giua.pop();
    return [...ra, ...giua, ...vao, { x: cho.x, z: cho.z, dao: cho.dao }];
}

/**
 * Đổi đích khi ĐANG ĐI: đi nốt tới điểm kế tiếp của lộ trình cũ (nó có `dao`) rồi tính đường mới TỪ ĐÓ.
 * Bản trước tính từ đảo xuất phát (daoHienTai chỉ cập nhật khi tới nơi) ⇒ đi lùi về đảo cũ hoặc đi thẳng xuyên khoảng trời giữa hai đảo.
 * @param {{x:number,z:number,dao?:string}} diemKe  điểm kế tiếp đang hướng tới
 */
export function loTrinhDoiDich(doThi, daoDuPhong, diemKe, cho) {
    const dao = diemKe.dao || daoDuPhong;
    return [{ x: diemKe.x, z: diemKe.z, dao }, ...loTrinhDayDu(doThi, dao, diemKe, null, cho)];
}

/**
 * Khu ĐÍCH của một agent theo trạng thái: chạy ⇒ phòng của nó · chờ duyệt ⇒ phòng họp · rảnh/tắt ⇒ café · lỗi ⇒ đứng nguyên (null).
 * Chief luôn ở khu `chief` (mặc định: bàn CEO trong AI Lab).
 */
export function khuDich(agent, layout = LAYOUT_MAC_DINH) {
    const cafe = khuTheoLoai(layout, 'cafe', 'cafe');
    const ban = timKhu(layout, agent.phong) ? agent.phong : null;
    if (agent.vaiTro === 'chief') { const ceo = khuTheoLoai(layout, 'ceo', 'chief'); if (ceo) return ceo; }
    // Khu tìm theo LOẠI (layout tự tạo đặt id gì cũng được); layout mặc định khớp đúng id cũ: chief · hop · canh-bao · cafe
    const hop = khuTheoLoai(layout, 'hop', 'hop');
    const bao = khuTheoLoai(layout, 'bao', 'canh-bao');
    switch (agent.trangThai) {
        case 'dang_chay': return ban || cafe;
        case 'cho_duyet': return hop || ban || cafe;
        // Lỗi / cần chủ xử lý ⇒ ra khu CẢNH BÁO (bồn hoa giữa) nếu layout có; không có thì lỗi đứng nguyên, cần xử lý sang phòng họp
        case 'loi': return bao;
        case 'can_xu_ly': return bao || hop;
        default: return cafe;
    }
}

/** Id khu cho một LOẠI khu: ưu tiên khu có id `uuTien` (đúng loại), không thì khu đầu tiên thuộc loại đó; không có ⇒ null. */
export function khuTheoLoai(layout, loai, uuTien) {
    const k = timKhu(layout, uuTien);
    if (k && k.loai === loai) return k.id;
    return layout.khu.find(x => x.loai === loai)?.id ?? null;
}

export { timDao, timKhu };
