/**
 * Nhân vật low-poly ĐA DẠNG (nam/nữ · 5 màu da · 9 kiểu tóc · 7 loại trang phục · phụ kiện) + bộ điều khiển đi lại.
 *
 * Mỗi người = 3 lệnh vẽ: THÂN (thân, tay, đầu, mắt, tóc, trang phục, phụ kiện GỘP làm một khối màu theo đỉnh) + 2 CHÂN
 * (tách riêng để vung khi đi, gập khi ngồi). Một vật liệu dùng chung cho mọi người (màu nằm trong đỉnh).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { taoNhan, taoBong, huyNhan } from './nhan.js';
import { ngoaiHinh } from './ngoaiHinh.js';
import { moTaModel, MAU_HANG } from './model.js';

const VAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, flatShading: true });
const VAT_MO = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true, transparent: true, opacity: 0.45 });
const GEO_CHAM = new THREE.SphereGeometry(0.15, 10, 8);
const MAT_LOI = new THREE.MeshBasicMaterial({ color: '#ff3b3b' });
const GEO_COC = new THREE.CylinderGeometry(0.07, 0.055, 0.12, 10);
const VAT_COC = new THREE.MeshStandardMaterial({ color: '#f7f3ec', roughness: 0.6 });
const MAU_CHAM = { ranh: '#94a3b8', dang_chay: '#22d3ee', cho_duyet: '#f59e0b', loi: '#ef4444', can_xu_ly: '#f43f5e', tat: '#475569' };
// Quầng đỏ quanh chấm cảnh báo (cộng màu, dùng chung) — tạo lười lần đầu cần (cần document)
let VAT_HAO = null;
function vatHao() {
    if (VAT_HAO) return VAT_HAO;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,80,80,0.95)'); g.addColorStop(0.4, 'rgba(255,40,40,0.4)'); g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    VAT_HAO = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return VAT_HAO;
}
export const TOC_DO = 2.4;   // đơn vị / giây

const _m = new THREE.Matrix4(); const _q = new THREE.Quaternion(); const _e = new THREE.Euler();
/** Một mảnh: áp vị trí/xoay/tỉ lệ + tô màu đỉnh; trả hình KHÔNG chỉ mục (mergeGeometries cần đồng nhất). */
function manh(geo, mau, [x = 0, y = 0, z = 0] = [], [rx = 0, ry = 0, rz = 0] = [], [sx = 1, sy = 1, sz = 1] = []) {
    _m.compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);
    const c = new THREE.Color(mau);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    return g;
}

const G = {
    nang: new THREE.CapsuleGeometry(0.2, 0.3, 3, 8),
    tay: new THREE.CapsuleGeometry(0.058, 0.3, 2, 6),
    cauNho: new THREE.SphereGeometry(1, 8, 6),
    dau: new THREE.IcosahedronGeometry(0.2, 1),
    chop: new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hop: new THREE.BoxGeometry(1, 1, 1),
    tru: new THREE.CylinderGeometry(1, 1, 1, 10),
    non: new THREE.CylinderGeometry(0.7, 1, 1, 10),
    xoan: new THREE.IcosahedronGeometry(1, 0),
    vong: new THREE.TorusGeometry(1, 0.12, 4, 16),
    chan: new THREE.CylinderGeometry(0.085, 0.075, 0.42, 6),
};

/** Dựng hình THÂN (đã gộp) theo ngoại hình. Gốc toạ độ ở chân, mặt hướng +z. */
function dungThan(h) {
    const ds = [];
    const ao = h.ao; const da = h.da; const toc = h.toc.mau;
    // Thân + tay + tay (bàn tay màu da)
    ds.push(manh(G.nang, ao, [0, 0.74, 0], [], [1, 1, 0.78]));
    for (const s of [-1, 1]) {
        ds.push(manh(G.tay, ao, [s * 0.255, 0.74, 0], [0, 0, s * 0.12]));
        ds.push(manh(G.cauNho, da, [s * 0.29, 0.5, 0.01], [], [0.065, 0.065, 0.065]));
    }
    if (h.vay) ds.push(manh(G.non, h.quan, [0, 0.5, 0], [], [0.27, 0.32, 0.24]));
    // Đầu + mắt
    ds.push(manh(G.dau, da, [0, 1.2, 0]));
    for (const s of [-1, 1]) ds.push(manh(G.cauNho, '#1b1b1f', [s * 0.07, 1.21, 0.178], [], [0.024, 0.03, 0.02]));
    if (h.kinh) ds.push(manh(G.hop, '#1b1b1f', [0, 1.22, 0.19], [], [0.26, 0.05, 0.02]));
    // Tóc
    const k = h.toc.kieu;
    if (k !== 'troc') {
        const r = k === 'bob' ? 0.232 : 0.214;
        if (k === 'xoan') ds.push(manh(G.xoan, toc, [0, 1.3, -0.02], [0.3, 0.4, 0], [0.235, 0.17, 0.235]));
        else ds.push(manh(G.chop, toc, [0, 1.2, -0.012], [-0.28, 0, 0], [r, r * (k === 'bob' ? 1.15 : 1), r]));
        if (k === 'cua') ds.push(manh(G.hop, toc, [0, 1.41, 0.02], [0.2, 0, 0], [0.16, 0.06, 0.2]));
        if (k === 'dai') ds.push(manh(G.hop, toc, [0, 1.06, -0.12], [0.1, 0, 0], [0.36, 0.44, 0.09]));
        if (k === 'bob') ds.push(manh(G.hop, toc, [0, 1.12, -0.1], [0.05, 0, 0], [0.4, 0.2, 0.12]));
        if (k === 'bui') ds.push(manh(G.cauNho, toc, [0, 1.42, -0.12], [], [0.085, 0.085, 0.085]));
        if (k === 'duoi-ngua') ds.push(manh(G.tay, toc, [0, 1.16, -0.2], [0.35, 0, 0], [1.05, 0.8, 1.05]));
    }
    // Phụ kiện
    const pk = new Set(h.phuKien || []);
    if (pk.has('cavat')) {
        ds.push(manh(G.hop, '#f4f6f8', [0, 0.97, 0.155], [], [0.11, 0.08, 0.02]));                    // cổ áo sơ mi trong vest
        ds.push(manh(G.hop, pk.has('cavat-do') ? '#c0272d' : '#7a1f2b', [0, 0.84, 0.162], [], [0.045, 0.22, 0.02]));
    }
    if (pk.has('phanQuang')) for (const y of [0.66, 0.82]) ds.push(manh(G.vong, '#e8ff3a', [0, y, 0], [Math.PI / 2, 0, 0], [0.205, 0.165, 0.32]));
    if (pk.has('muBaoVe')) {
        ds.push(manh(G.tru, '#34507e', [0, 1.38, 0], [], [0.205, 0.07, 0.205]));
        ds.push(manh(G.hop, '#34507e', [0, 1.35, 0.17], [-0.15, 0, 0], [0.24, 0.02, 0.14]));
        ds.push(manh(G.hop, '#f2c94c', [0, 1.39, 0.2], [], [0.06, 0.04, 0.01]));
    }
    if (pk.has('phuHieu')) ds.push(manh(G.hop, '#f2c94c', [-0.09, 0.86, 0.158], [], [0.06, 0.07, 0.015]));
    if (pk.has('muBaoHo')) {
        ds.push(manh(G.chop, '#f6c90e', [0, 1.27, 0], [], [0.245, 0.22, 0.245]));
        ds.push(manh(G.tru, '#f6c90e', [0, 1.28, 0.03], [], [0.27, 0.015, 0.29]));
    }
    if (pk.has('blouse')) ds.push(manh(G.non, '#fbfbfb', [0, 0.52, 0], [], [0.235, 0.36, 0.2]));
    if (pk.has('tapDe')) {   // tạp dề pha chế: yếm nâu trước ngực + dây cổ
        ds.push(manh(G.hop, '#6b4428', [0, 0.62, 0.152], [], [0.3, 0.46, 0.02]));
        ds.push(manh(G.hop, '#6b4428', [0, 0.97, 0.13], [0.35, 0, 0], [0.2, 0.03, 0.02]));
    }
    if (pk.has('daiThe')) {
        ds.push(manh(G.hop, '#2563eb', [0, 0.9, 0.158], [], [0.02, 0.2, 0.01]));
        ds.push(manh(G.hop, '#ffffff', [0, 0.78, 0.162], [], [0.07, 0.09, 0.012]));
    }
    if (pk.has('mu-trum')) ds.push(manh(G.vong, ao, [0, 1.02, -0.12], [Math.PI / 2.4, 0, 0], [0.16, 0.12, 0.5]));
    const g = mergeGeometries(ds, false);
    ds.forEach(x => x.dispose());
    return g;
}

function dungChan(h) {
    const quan = h.vay ? h.da : h.quan;   // mặc váy ⇒ chân màu da
    const ds = [
        manh(G.chan, quan, [0, -0.21, 0]),
        manh(G.hop, '#24262c', [0, -0.42, 0.04], [], [0.13, 0.07, 0.22]),   // giày
    ];
    const g = mergeGeometries(ds, false);
    ds.forEach(x => x.dispose());
    return g;
}

// Thiếu `ten` ⇒ dùng id (bản trước hiện chữ "UNDEFINED")
const tenHien = (agent) => String(agent.ten ?? agent.id ?? '');
const khoaModel = (m) => (m ? `${m.ngan}|${m.hang}|${m.logo || ''}` : '');

export class NhanVat {
    /**
     * @param {{ id:string, ten:string, phong?:string, vaiTro?:string, ngoaiHinh?:object }} agent
     * @param {{ nhan?: boolean, phu?: boolean, khiVeLai?: () => void }} o  nhan=false ⇒ không có nhãn tên; phu ⇒ nhân viên phụ (nhãn xám ghi vai trò);
     *   khiVeLai = gọi khi nhãn tự vẽ lại (logo model nạp xong) để vòng vẽ biết mà vẽ khung mới
     */
    constructor(agent, o = {}) {
        this.id = agent.id;
        this.laChief = agent.vaiTro === 'chief';
        this.h = ngoaiHinh(agent);
        this.khoaHinh = JSON.stringify(agent.ngoaiHinh || null);
        this.coNhan = o.nhan !== false;
        this.laPhu = !!o.phu;   // nhân viên phụ: nhãn XÁM ghi vai trò, chỉ hiện khi rê chuột
        this.khiVeLai = o.khiVeLai;
        this.goc = new THREE.Group();
        this.goc.userData.agentId = agent.id;
        this.khung = new THREE.Group();
        this.than = new THREE.Mesh(dungThan(this.h), VAT);
        this.than.castShadow = true;
        const geoChan = dungChan(this.h);
        this.chanT = new THREE.Mesh(geoChan, VAT); this.chanT.position.set(-0.1, 0.42, 0);
        this.chanP = new THREE.Mesh(geoChan, VAT); this.chanP.position.set(0.1, 0.42, 0);
        this.khung.add(this.than, this.chanT, this.chanP);
        this.khung.scale.setScalar(this.h.cao || 1);
        this.goc.add(this.khung);

        // CHẤM ĐỎ cảnh báo (lỗi / cần xử lý): cầu đỏ + quầng, NHÁY liên tục — nhìn là biết phải vào xem
        this.chamLoi = new THREE.Group();
        this.chamLoi.add(new THREE.Mesh(GEO_CHAM, MAT_LOI));
        if (this.coNhan && typeof document !== 'undefined') {
            const hao = new THREE.Sprite(vatHao()); hao.scale.setScalar(0.95); hao.renderOrder = 5;
            this.chamLoi.add(hao); this.haoLoi = hao;
        }
        this.chamLoi.visible = false;
        this.coCanhBao = false;
        this.goc.add(this.chamLoi);

        this.ten = tenHien(agent);
        this.hienTam = false;   // đang được rê chuột / chọn ⇒ hiện nhãn dù rảnh
        this.model = moTaModel(agent.model);
        this.khoaModel = khoaModel(this.model);
        this.trangThai = null;
        this.nhan = null; this.bong = null; this.viec = '';
        this.duong = []; this.dich = null; this.daoHienTai = null; this.daoDich = null;
        this.t = Math.random() * 10; this.nhay = 0;
        this.capNhatNhan('ranh');
    }

    get dinh() { return 1.48 * (this.h.cao || 1); }

    /**
     * setAgents gọi lại với dữ liệu mới: đổi TÊN ⇒ vẽ lại nhãn · đổi VAI TRÒ (lên/xuống chief) ⇒ luật hiện nhãn ·
     * đổi NGOẠI HÌNH ⇒ dựng lại thân + chân tại chỗ (bản trước bỏ qua cả ba).
     */
    capNhatAgent(agent) {
        const ten = tenHien(agent);
        const laChief = agent.vaiTro === 'chief';
        const khoaHinh = JSON.stringify(agent.ngoaiHinh || null);
        if (khoaHinh !== this.khoaHinh) {
            this.khoaHinh = khoaHinh;
            this.h = ngoaiHinh(agent);
            this.than.geometry.dispose(); this.chanT.geometry.dispose();
            this.than.geometry = dungThan(this.h);
            const geoChan = dungChan(this.h);
            this.chanT.geometry = geoChan; this.chanP.geometry = geoChan;
            this.khung.scale.setScalar(this.h.cao || 1);
            this.xepNhan(this.dayNhan || 0);
        }
        if (laChief !== this.laChief) { this.laChief = laChief; this.capNhatHien(); }
        if (ten !== this.ten) { this.ten = ten; this.capNhatNhan(this.trangThai || 'ranh'); }
    }

    /** Luật hiện nhãn: Chief luôn hiện · người đang rê/chọn hiện · rảnh / tắt (ngồi café) ẩn — café đông mà ai cũng hiện tên là rối. */
    capNhatHien() {
        if (!this.nhan) return;
        const tt = this.trangThai;
        this.nhan.visible = this.laChief || this.hienTam || (tt !== 'ranh' && tt !== 'tat' && tt != null);
        this.xepNhan(this.dayNhan || 0);
    }

    datHienTam(co) {
        if (co === this.hienTam) return;
        this.hienTam = co;
        this.capNhatHien();
    }

    capNhatNhan(trangThai) {
        if (!this.coNhan) return;
        const hien = this.nhan ? this.nhan.visible : true;
        if (this.nhan) { this.goc.remove(this.nhan); huyNhan(this.nhan); }
        const m = this.model && { ...this.model, mauHang: MAU_HANG[this.model.hang] || MAU_HANG.khac };
        this.nhan = this.laPhu
            ? taoNhan(this.ten, { nen: 'rgba(71,85,105,0.92)', mau: '#e2e8f0', dam: false })
            : taoNhan(this.ten, { cham: MAU_CHAM[trangThai] || MAU_CHAM.ranh, model: m, khiVeLai: this.khiVeLai });
        this.nhan.visible = hien;
        this.goc.add(this.nhan);
        this.xepNhan(this.dayNhan || 0);
    }

    /** Đổi model (agent chuyển model) ⇒ vẽ lại nhãn. Trả true nếu có đổi. */
    datModel(model) {
        const mt = moTaModel(model);
        const k = khoaModel(mt);
        if (k === this.khoaModel) return false;
        this.model = mt; this.khoaModel = k;
        this.capNhatNhan(this.trangThai || 'ranh');
        return true;
    }

    /** @param {string} chu  @param {'chay'|'duyet'|'loi'} kieu */
    datBong(chu, kieu = 'chay') {
        const khoa = chu ? `${kieu}|${chu}` : '';
        if (khoa === this.viec) return;
        this.viec = khoa;
        if (this.bong) { this.goc.remove(this.bong); huyNhan(this.bong); this.bong = null; }
        if (chu && this.coNhan) {
            this.bong = taoBong(chu, kieu);
            this.goc.add(this.bong);
        }
        this.xepNhan(this.dayNhan || 0);
    }

    /**
     * Đặt nhãn + bóng chữ theo độ đẩy (đơn vị thế giới) do bộ giải chồng tính. Bóng chữ nằm NGAY TRÊN nhãn tên
     * (cỡ nhãn = sprite.scale.y — index.js đặt theo pixel mỗi lần zoom). Nhãn ẩn (người rảnh) ⇒ bóng ngồi thẳng trên đầu.
     */
    xepNhan(day = 0, pxY = this.pxY) {
        this.dayNhan = day;
        if (pxY) this.pxY = pxY;
        const goc = this.dinh + 0.05 + day;
        if (this.nhan) this.nhan.position.y = goc;
        // Bóng chữ ngay trên nhãn: khoảng cách tính theo PIXEL rồi chia pxY (px màn hình / 1 đơn vị trục Y thế giới).
        // KHÔNG dùng nhan.scale.y: sprite luôn quay thẳng vào camera nên cao (scale.y · px/đơn vị) px, còn dời theo trục Y
        // chỉ được (· pxY) px vì camera nghiêng ⇒ bóng thấp hơn nhãn, đè lên nhãn.
        if (this.bong) this.bong.position.y = goc + (this.nhan?.visible && this.pxY ? (this.nhan.userData.px.h + 3) * (this.tiLeNhan || 1) / this.pxY : 0);
    }

    datTrangThai(tt) {
        if (tt === this.trangThai) return;
        this.trangThai = tt;
        this.capNhatNhan(tt);
        this.capNhatHien();
        this.coCanhBao = tt === 'loi' || tt === 'can_xu_ly';
        this.chamLoi.visible = this.coCanhBao;
        // Đặt chỗ chấm NGAY (giảm chuyển động không gọi buoc() khi đứng yên ⇒ bản trước chấm nằm dưới chân)
        this.datChamLoi();
        const vat = tt === 'tat' ? VAT_MO : VAT;
        this.than.material = vat; this.chanT.material = vat; this.chanP.material = vat;
    }

    diToi(loTrinh, dich, daoDich) { this.duong = loTrinh.slice(); this.dich = dich; this.daoDich = daoDich; }

    datNgay(dich, daoDich) {
        this.goc.position.set(dich.x, dich.y || 0, dich.z);
        this.goc.rotation.y = dich.huong || 0;
        this.duong = []; this.dich = dich; this.daoHienTai = daoDich; this.daoDich = daoDich;
    }

    vui() { this.nhay = 1; }

    /** Cầm / thả cốc cà phê trên tay phải (pha chế mang đồ uống ra bàn). Lưới cốc tạo lười lần đầu. */
    camCoc(co) {
        if (co && !this.coc) {
            this.coc = new THREE.Mesh(GEO_COC, VAT_COC);
            this.coc.position.set(0.3, 0.56, 0.1);
            this.khung.add(this.coc);
        }
        if (this.coc) this.coc.visible = !!co;
    }

    get dangDi() { return this.duong.length > 0; }

    /** @param {number} dt giây */
    buoc(dt) {
        this.t += dt;
        const p = this.goc.position;
        let vung = 0;
        if (this.duong.length) {
            const q = this.duong[0];
            const dx = q.x - p.x; const dz = q.z - p.z; const kc = Math.hypot(dx, dz);
            const b = TOC_DO * dt;
            if (kc <= b) {
                p.x = q.x; p.z = q.z; this.duong.shift();
                if (q.dao) this.daoHienTai = q.dao;   // qua mỗi điểm biết mình đang ở đảo nào (đổi đích giữa đường)
                if (!this.duong.length) { this.daoHienTai = this.daoDich; p.y = this.dich?.y || 0; }
            } else {
                p.y = 0;   // đang đi: chân trên sàn (rời bục)
                p.x += (dx / kc) * b; p.z += (dz / kc) * b;
                this.goc.rotation.y = Math.atan2(dx, dz);
            }
            vung = Math.sin(this.t * 10) * 0.55;
            this.khung.position.y = Math.abs(Math.sin(this.t * 10)) * 0.05;
            this.chanT.rotation.x = vung; this.chanP.rotation.x = -vung;
        } else {
            const d = this.dich || {};
            if (d.huong != null) {
                let lech = d.huong - this.goc.rotation.y;
                lech = Math.atan2(Math.sin(lech), Math.cos(lech));    // quay đường ngắn nhất
                this.goc.rotation.y += lech * Math.min(1, dt * 6);
            }
            const ngoi = d.ngoi || d.ban;
            this.chanT.rotation.x = ngoi ? -Math.PI / 2 : 0;
            this.chanP.rotation.x = ngoi ? -Math.PI / 2 : 0;
            if (ngoi) this.khung.position.y = 0.04 + (this.trangThai === 'dang_chay' && d.ban ? Math.abs(Math.sin(this.t * 16)) * 0.012 : 0);
            else this.khung.position.y = Math.sin(this.t * 1.6) * 0.01;
        }
        if (this.nhay > 0) {
            this.nhay = Math.max(0, this.nhay - dt * 1.8);
            this.khung.position.y += Math.sin((1 - this.nhay) * Math.PI) * 0.45;
        }
        if (this.coCanhBao) {
            // Nháy ~1,1 lần/giây: tắt ngắn, sáng dài; quầng phập phồng
            const pha = Math.sin(this.t * 7);
            this.chamLoi.visible = pha > -0.35;
            if (this.haoLoi) this.haoLoi.scale.setScalar(0.8 + 0.35 * Math.max(0, pha));
            this.datChamLoi(Math.sin(this.t * 4) * 0.04);
        }
    }

    // Chấm đỏ cạnh ĐẦU (ngang tai), không trên đỉnh: nhãn tên neo ngay trên đầu và vẽ đè mọi thứ ⇒ chấm trên đỉnh bị che
    datChamLoi(nhun = 0) {
        this.chamLoi.position.set(0.32, this.dinh - 0.08 + nhun, 0.2);   // hơi ra TRƯỚC mặt: đứng sau đầu thì bị che
    }

    huy() {
        if (this.nhan) huyNhan(this.nhan);
        if (this.bong) huyNhan(this.bong);
        this.than.geometry.dispose();
        this.chanT.geometry.dispose();
    }
}
