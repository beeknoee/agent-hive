/**
 * Dựng CẢNH TĨNH bằng code (low-poly, không tải model ngoài): đảo nổi, lan can kính, cầu, nội thất từng khu, mây.
 *
 * Phong cách: sàn gỗ ấm, viền LED ấm quanh mép đảo + LED xanh dưới đáy, lan can kính tay vịn
 * phát sáng, biển tên tối có icon, dây leo rủ vách, vệt đèn hắt trên sàn, bóng mờ dưới đồ đạc, hologram AI Lab, phòng CEO có
 * tường gỗ + sofa + tranh, café thành phòng sinh hoạt chung có màn chiếu, mây bông. TẤT CẢ là mẹo rẻ (vật liệu tự phát sáng,
 * hoạ tiết canvas, InstancedMesh) — không đèn điểm, không hậu kỳ.
 *
 * Ngân sách hiệu năng: mọi vật tĩnh cùng VẬT LIỆU được GỘP thành MỘT lưới (gomTinh) ⇒ cả cảnh ≈ 35–45 lệnh vẽ
 * (bản trước ≈ 60 lệnh cho cảnh tĩnh). Vật chuyển động (mây, vòng hologram) để riêng.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { choNgoi, dauCau, timDao, BAN_CAFE, QUAY_CAFE, gheQuayCafe } from './layout.js';
import { texGo, texQuang, texBong, texMay, texBienTen, texBieuDo, texTranh, ngauNhien } from './hoaTiet.js';

const M = (mau, o = {}) => new THREE.MeshStandardMaterial({ color: mau, roughness: 0.85, metalness: 0, flatShading: true, ...o });
const SANG = (mau, o = {}) => new THREE.MeshBasicMaterial({ color: mau, ...o });   // tự phát sáng (không chịu ánh sáng)
const MO = (mau, opacity, o = {}) => new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity, depthWrite: false, ...o });

/** Gom các ma trận rồi tạo MỘT InstancedMesh (gomTinh sau đó còn gộp tiếp theo vật liệu). */
class Bo {
    constructor(geo, mat, { bong = true } = {}) { this.geo = geo; this.mat = mat; this.ds = []; this.bong = bong; }
    them(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0) {
        const m = new THREE.Matrix4();
        m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ'))   /* YXZ: nằm phẳng rồi mới xoay quanh trục đứng */, new THREE.Vector3(sx, sy, sz));
        this.ds.push(m);
    }
    xong(nhom) {
        if (!this.ds.length) { this.geo.dispose(); return null; }
        const im = new THREE.InstancedMesh(this.geo, this.mat, this.ds.length);
        this.ds.forEach((m, i) => im.setMatrixAt(i, m));
        im.castShadow = this.bong; im.receiveShadow = true;
        im.instanceMatrix.needsUpdate = true;
        nhom.add(im);
        return im;
    }
}

function hinhDao(d) {
    const s = new THREE.Shape();
    if (d.tron) {
        // Bát giác
        const r = Math.min(d.w, d.d) / 2;
        for (let i = 0; i < 8; i++) {
            const g = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const x = Math.cos(g) * r; const z = Math.sin(g) * r;
            if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
        }
        s.closePath();
        return s;
    }
    // Chữ nhật vát góc (góc cắt chéo)
    const w = d.w / 2; const h = d.d / 2; const v = Math.min(1.6, Math.min(w, h) * 0.3);
    s.moveTo(-w + v, -h); s.lineTo(w - v, -h); s.lineTo(w, -h + v); s.lineTo(w, h - v);
    s.lineTo(w - v, h); s.lineTo(-w + v, h); s.lineTo(-w, h - v); s.lineTo(-w, -h + v); s.closePath();
    return s;
}

/** Các điểm trên chu vi (đã lùi vào 0.25) — để cắm cột lan can / đèn. */
function chuVi(d, buoc = 1.4) {
    const pts = hinhDao({ ...d, w: d.w - 0.5, d: d.d - 0.5 }).getSpacedPoints(Math.max(8, Math.round(((d.w + d.d) * 2) / buoc)));
    return pts.map(p => ({ x: d.x + p.x, z: d.z + p.y }));
}

/** Ống chạy dọc ĐƯỜNG VIỀN đảo (dải LED): các đoạn thẳng nối đỉnh hình đảo, khép kín. */
function ongVien(d, y, banKinh, co = 0) {
    const hinh = hinhDao({ ...d, w: d.w - co, d: d.d - co });
    const dinh = hinh.getPoints(1).filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 1e-4);
    if (dinh.length > 2 && dinh[0].distanceTo(dinh[dinh.length - 1]) < 1e-4) dinh.pop();
    const duong = new THREE.CurvePath();
    for (let i = 0; i < dinh.length; i++) {
        const a = dinh[i]; const b = dinh[(i + 1) % dinh.length];
        duong.add(new THREE.LineCurve3(new THREE.Vector3(d.x + a.x, y, d.z + a.y), new THREE.Vector3(d.x + b.x, y, d.z + b.y)));
    }
    return new THREE.TubeGeometry(duong, dinh.length * 4, banKinh, 4, true);
}

const DAY_SAN = 1.15;  // bề dày vách đảo (1,15 cho biển tên to, dễ đọc)
const ICON_DAO = { chinh: 'toaNha', may: 'server', 'thu-vien': 'nao', hop: 'nguoi', qa: 'kiem', cafe: 'coc', bd: 'bieuDo' };

/**
 * Chữ in trên SÀN (tên khu: KHÁCH HÀNG, MARKETING, AI LAB…) — chữ sáng viền tối (đọc được cả ngày lẫn đêm), tự thu cỡ cho vừa.
 */
function chuNen(chu, mau = {}) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const ctx = c.getContext('2d');
    let co = 54; ctx.letterSpacing = '6px';
    const font = () => `800 ${co}px ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
    ctx.font = font();
    while (co > 20 && ctx.measureText(chu).width > 496) { co -= 4; ctx.font = font(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(5, co * 0.13); ctx.strokeStyle = mau.vien || 'rgba(30,34,44,0.5)';
    ctx.strokeText(chu, 256, 50);
    ctx.fillStyle = mau.nen || 'rgba(255,255,255,0.9)';
    ctx.fillText(chu, 256, 50);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.8), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
}

/**
 * GỘP mọi vật TĨNH cùng vật liệu thành một lưới (InstancedMesh được bung ra). Giữ nguyên: vật có userData.dong (chuyển động),
 * Points, vật nhiều vật liệu, vật liệu dùng riêng một lần (gộp không lợi gì).
 */
function gomTinh(nhom) {
    const theoVat = new Map();
    const giu = [];
    nhom.updateMatrixWorld(true);
    for (const o of [...nhom.children]) {
        if (!o.isMesh || o.userData.dong || Array.isArray(o.material)) { giu.push(o); continue; }
        if (!theoVat.has(o.material)) theoVat.set(o.material, []);
        theoVat.get(o.material).push(o);
    }
    const _m = new THREE.Matrix4();
    for (const [mat, ds] of theoVat) {
        const soPhan = ds.reduce((t, o) => t + (o.isInstancedMesh ? o.count : 1), 0);
        if (soPhan < 2 || (ds.length === 1 && !ds[0].isInstancedMesh)) continue;
        const hinh = [];
        let bong = false;
        for (const o of ds) {
            bong ||= o.castShadow;
            const goc = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
            for (const k of Object.keys(goc.attributes)) if (!['position', 'normal', 'uv'].includes(k)) goc.deleteAttribute(k);
            if (!goc.attributes.uv) goc.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(goc.attributes.position.count * 2), 2));
            const n = o.isInstancedMesh ? o.count : 1;
            for (let i = 0; i < n; i++) {
                if (o.isInstancedMesh) { o.getMatrixAt(i, _m); _m.premultiply(o.matrixWorld); } else _m.copy(o.matrixWorld);
                hinh.push(goc.clone().applyMatrix4(_m));
            }
            if (goc !== o.geometry) goc.dispose();
            o.geometry.dispose();
            nhom.remove(o);
        }
        const gop = new THREE.Mesh(mergeGeometries(hinh, false), mat);
        hinh.forEach(h => h.dispose());
        gop.castShadow = bong; gop.receiveShadow = true;
        if (mat.transparent) gop.renderOrder = 2;
        nhom.add(gop);
    }
}

/**
 * @param {{dao:any[], khu:any[], cau:any[]}} layout
 * @param {{ bong?: boolean }} o
 * @returns {{ nhom: THREE.Group, capNhatDen(bat:boolean): void, mauMay(mau:string): void, troi(dt:number): void, huy(): void }}
 */
export function dungCanh(layout, o = {}) {
    const nhom = new THREE.Group();
    const tGo = texGo(); tGo.repeat.set(0.32, 0.32);
    const tQuang = texQuang(); const tBong = texBong();
    const vat = {
        san: M('#ffffff', { map: tGo, roughness: 0.75, emissive: '#ffb878', emissiveMap: tGo, emissiveIntensity: 0 }),   // sàn gỗ ấm; đêm tự sáng nhẹ
        vien: M('#3a3b52', { roughness: 0.6, metalness: 0.15 }),         // vách đảo: xám than (chữ / biển tên sáng nổi lên)
        da: M('#24223a'),
        go: M('#a77b52'), goTham: M('#7b5636'), goSang: M('#c89a6a'), trang: M('#f4f2ee'), xam: M('#9aa0aa'), den: M('#23252d'),
        la: M('#4f9a4a'), la2: M('#3f8a52'), la3: M('#5fae55'), chau: M('#e8e3da'),
        manHinh: M('#1d2b44', { emissive: '#3aa0ff', emissiveIntensity: 0.25 }),
        denDuong: M('#fff4d6', { emissive: '#ffd27a', emissiveIntensity: 0.2 }),
        ledAm: SANG('#ffc46b'), ledXanh: SANG('#4f7bff'),                // dải LED: ấm trên mép, xanh dưới đáy
        quangAm: MO('#ffb85c', 0.28, { blending: THREE.AdditiveBlending }), quangXanh: MO('#4f7bff', 0.35, { blending: THREE.AdditiveBlending }),
        kinhLC: MO('#cfe6ff', 0.14, { side: THREE.DoubleSide }),          // kính lan can
        kinh: new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, depthWrite: false }),
        holo: MO('#4fd1ff', 0.55, { side: THREE.DoubleSide }),
        holoDay: SANG('#5ee7ff', { wireframe: true, transparent: true, opacity: 0.75 }),
        nao: M('#ffd68a', { emissive: '#ffb84d', emissiveIntensity: 0.9 }),
        tuMay: M('#2c303a', { roughness: 0.5, metalness: 0.3 }),
        led: SANG('#34d399'), ledLam: SANG('#38bdf8'),
        buc: M('#f5efe6', { emissive: '#ff9a3d', emissiveIntensity: 0.35 }),
        menu: new THREE.MeshBasicMaterial({ color: '#2b2f3a' }),
        gheBanh: M('#5b7c99'), sofa: M('#e9e4da'), sofaToi: M('#3b4256'), goi: M('#c2703d'),
        goCeo: M('#4a2f1d'), da2: M('#17191f', { roughness: 0.55 }), dong: M('#c9a24a', { metalness: 0.6, roughness: 0.35 }),
        vang: SANG('#ffcf70'), tham: M('#6b2737'), thamXanh: M('#2f3f63'),
        bong: new THREE.MeshBasicMaterial({ map: tBong, transparent: true, depthWrite: false, opacity: 0.9 }),
        vetDen: new THREE.MeshBasicMaterial({ map: tQuang, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
        may: new THREE.MeshBasicMaterial({ map: texMay(), color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false }),
    };
    // Bảng menu café: chữ phấn trên nền tối — vẽ một lần
    {
        const c = document.createElement('canvas'); c.width = 256; c.height = 100;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#23262f'; ctx.fillRect(0, 0, 256, 100);
        ctx.fillStyle = '#f5e6c8'; ctx.font = '700 26px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('☕  COFFEE', 128, 40);
        ctx.font = '500 15px ui-sans-serif, system-ui, sans-serif'; ctx.fillStyle = '#c9cdd6';
        ctx.fillText('latte · espresso · trà', 128, 72);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        vat.menu.map = t; vat.menu.color.set('#ffffff');
    }
    const r = ngauNhien(3);

    const ban = new Bo(new THREE.BoxGeometry(1.5, 0.08, 0.8), vat.trang);
    const chanBan = new Bo(new THREE.BoxGeometry(1.4, 0.7, 0.06), vat.xam);
    const manHinh = new Bo(new THREE.BoxGeometry(0.62, 0.38, 0.04), vat.manHinh);
    const ghe = new Bo(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 8), vat.den);
    const lungGhe = new Bo(new THREE.BoxGeometry(0.46, 0.42, 0.06), vat.den);
    const chau = new Bo(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 7), vat.chau);
    const la = new Bo(new THREE.IcosahedronGeometry(0.36, 0), vat.la);
    const bonCay = new Bo(new THREE.BoxGeometry(2.2, 0.35, 0.5), vat.goTham);
    const laBon = new Bo(new THREE.IcosahedronGeometry(0.3, 0), vat.la2);
    const cotDen = new Bo(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6), vat.den, { bong: false });
    const bauDen = new Bo(new THREE.BoxGeometry(0.28, 0.12, 0.28), vat.denDuong, { bong: false });
    const cotLC = new Bo(new THREE.BoxGeometry(0.05, 0.6, 0.05), vat.den, { bong: false });
    const thanhLC = new Bo(new THREE.BoxGeometry(1, 0.035, 0.035), vat.ledAm, { bong: false });      // tay vịn = dải LED ấm
    const kinhLC = new Bo(new THREE.BoxGeometry(1, 0.5, 0.015), vat.kinhLC, { bong: false });       // tấm kính lan can
    const tu = new Bo(new THREE.BoxGeometry(0.9, 1.9, 0.7), vat.tuMay);
    const ledTu = new Bo(new THREE.BoxGeometry(0.55, 0.035, 0.02), vat.led, { bong: false });
    const ledTu2 = new Bo(new THREE.BoxGeometry(0.55, 0.035, 0.02), vat.ledLam, { bong: false });
    const lamMat = new Bo(new THREE.BoxGeometry(1.1, 0.9, 1.1), vat.trang);
    const ke = new Bo(new THREE.BoxGeometry(1.6, 2, 0.4), vat.go);
    const sach = new Bo(new THREE.BoxGeometry(1.4, 0.26, 0.3), vat.goi, { bong: false });            // gáy sách trên kệ
    const banTron = new Bo(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 10), vat.trang);
    const chanTron = new Bo(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), vat.xam);
    const ghe2 = new Bo(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 7), vat.go);
    const vanCau = new Bo(new THREE.BoxGeometry(1, 0.12, 1.3), vat.go);
    const tayCau = new Bo(new THREE.BoxGeometry(1, 0.035, 0.035), vat.ledAm, { bong: false });
    const cotKinh = new Bo(new THREE.BoxGeometry(0.07, 2.4, 0.07), vat.xam, { bong: false });   // khung nhôm phòng họp kính
    const thanhKinh = new Bo(new THREE.BoxGeometry(1, 0.07, 0.07), vat.xam, { bong: false });
    const mayCafe = new Bo(new THREE.BoxGeometry(0.5, 0.55, 0.45), vat.den);
    const gheBanh = new Bo(new THREE.BoxGeometry(0.85, 0.6, 0.8), vat.gheBanh);
    const gheQuay = new Bo(new THREE.CylinderGeometry(0.19, 0.14, 0.6, 8), vat.den);
    const dayLeo = new Bo(new THREE.IcosahedronGeometry(0.2, 0), vat.la3, { bong: false });            // dây leo rủ vách: chuỗi chùm lá
    const bongMo = new Bo(new THREE.PlaneGeometry(1, 1), vat.bong, { bong: false });                   // bóng mờ dưới đồ đạc
    const vetDen = new Bo(new THREE.PlaneGeometry(1, 1), vat.vetDen, { bong: false });                 // vệt đèn hắt trên sàn (đêm)
    const sofa = new Bo(new THREE.BoxGeometry(1.7, 0.42, 0.75), vat.sofa);
    const lungSofa = new Bo(new THREE.BoxGeometry(1.7, 0.45, 0.18), vat.sofa);
    const goiSofa = new Bo(new THREE.BoxGeometry(0.35, 0.3, 0.12), vat.goi, { bong: false });

    const bong = (x, z, w, d, ry = 0) => bongMo.them(x, 0.03, z, ry, w, d, 1, -Math.PI / 2);   // trên mặt thảm (0,022)
    const cayChau = (x, z, s = 1) => { chau.them(x, 0.16 * s, z, 0, s, s, s); la.them(x, 0.62 * s, z, r() * 3, s, s * 1.1, s); bong(x, z, 0.9 * s, 0.9 * s); };
    const dat = (geo, mat, x, y, z, ry = 0, bongDo = true) => {
        const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry;
        m.castShadow = bongDo; m.receiveShadow = true; nhom.add(m); return m;
    };
    const dong = [];   // vật chuyển động: { o, xoay: [x,y,z] rad/s }

    const cauDau = [];   // đầu cầu trên từng đảo — chừa lỗ ở lan can

    // ── Cầu: ván gỗ + tay vịn LED ấm hai bên ──
    for (const c of layout.cau) {
        const a = timDao(layout, c.tu); const b = timDao(layout, c.den);
        const pa = dauCau(a, b); const pb = dauCau(b, a);
        cauDau.push({ dao: a.id, ...pa }, { dao: b.id, ...pb });
        const dx = pb.x - pa.x; const dz = pb.z - pa.z; const dai = Math.hypot(dx, dz);
        const goc = Math.atan2(-dz, dx);
        const so = Math.max(2, Math.round(dai / 1.05));
        for (let i = 0; i <= so; i++) {
            const t = i / so;
            vanCau.them(pa.x + dx * t, -0.06, pa.z + dz * t, goc, dai / so * 1.02, 1, 1);
        }
        for (const lech of [-0.65, 0.65]) {
            const nx = (-dz / dai) * lech; const nz = (dx / dai) * lech;
            for (let i = 0; i < so; i++) {
                const t = (i + 0.5) / so;
                tayCau.them(pa.x + dx * t + nx, 0.55, pa.z + dz * t + nz, goc, dai / so, 1, 1);
                kinhLC.them(pa.x + dx * t + nx, 0.3, pa.z + dz * t + nz, goc, dai / so, 1, 1);
                cotLC.them(pa.x + dx * (i / so) + nx, 0.28, pa.z + dz * (i / so) + nz);
            }
        }
    }

    // ── Đảo ──
    const viTriDen = [];   // bóng đèn — làm quầng sáng ban đêm
    const vienAm = []; const vienXanh = []; const hao = []; const haoXanh = [];   // dải LED (gộp mọi đảo thành 4 lưới)
    for (const d of layout.dao) {
        // Thân đảo (vách) và MẶT SÀN GỖ tách 2 lưới một vật liệu ⇒ gomTinh gộp được cả 7 đảo thành 2 lệnh vẽ
        const than = new THREE.Mesh(new THREE.ExtrudeGeometry(hinhDao(d), { depth: DAY_SAN, bevelEnabled: false }), vat.vien);
        than.rotation.x = Math.PI / 2;
        than.position.set(d.x, 0, d.z);
        nhom.add(than);
        const mat = new THREE.Mesh(new THREE.ShapeGeometry(hinhDao(d)), vat.san);
        mat.rotation.x = -Math.PI / 2;
        mat.position.set(d.x, 0.002, d.z);
        mat.receiveShadow = true;
        nhom.add(mat);

        // Khối đá dưới đảo: chóp ngược low-poly, bẹt theo w/d
        const rr = Math.max(d.w, d.d) / 2;
        const cao = Math.max(3, rr * 0.75);
        const da = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.92, rr * 0.18, cao, d.tron ? 8 : 7, 2), vat.da);
        da.scale.set(d.w / (2 * rr), 1, d.d / (2 * rr));
        da.position.set(d.x, -DAY_SAN - cao / 2, d.z);
        da.rotation.y = d.tron ? Math.PI / 8 : 0.3;
        nhom.add(da);

        // Dải LED: ẤM viền mép trên, XANH viền đáy vách (+ quầng mờ cộng màu quanh mỗi dải — "toả sáng" không cần hậu kỳ)
        vienAm.push(ongVien(d, 0.03, 0.035)); hao.push(ongVien(d, 0.03, 0.13));
        vienXanh.push(ongVien(d, -DAY_SAN - 0.02, 0.045)); haoXanh.push(ongVien(d, -DAY_SAN - 0.02, 0.17));

        // Biển tên tối có icon trên vách phía camera (mặt +z); né đầu cầu cắm vào vách đó
        let bienX = null; let bienW = 0; let bienZ = 0;
        if (d.ten) {
            const vat0 = Math.min(1.6, Math.min(d.w / 2, d.d / 2) * 0.3);
            const rongVach = d.tron ? Math.min(d.w, d.d) * 0.38 : d.w - 2 * vat0 - 0.4;
            const zVach = d.tron ? (Math.min(d.w, d.d) / 2) * Math.cos(Math.PI / 8) : d.d / 2;
            const { tex, tiLe } = texBienTen(d.ten, d.icon || ICON_DAO[d.id]);
            const w = Math.min(rongVach * 0.95, d.id === 'chinh' ? 7.4 : 6.4); const h = Math.min(w / tiLe, DAY_SAN * 0.85);
            const cauTruoc = cauDau.filter(c => c.dao === d.id && c.z > d.z + zVach - 1.6);
            const lech = [0, -0.26, 0.26].map(k => k * (d.tron ? Math.min(d.w, d.d) * 0.6 : d.w))
                .map(dx => ({ dx, xa: Math.min(99, ...cauTruoc.map(c => Math.abs(d.x + dx - c.x))) }))
                .sort((a, b) => (b.xa >= w / 2 + 0.8) - (a.xa >= w / 2 + 0.8) || Math.abs(a.dx) - Math.abs(b.dx))[0].dx;
            const bien = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
            bien.position.set(d.x + lech, -DAY_SAN / 2, d.z + zVach + 0.03);
            nhom.add(bien);
            bienX = d.x + lech; bienW = w; bienZ = d.z + zVach;
        }

        // Lan can: cột tối + tấm kính + tay vịn LED; chừa lỗ đầu cầu
        const pts = chuVi(d);
        const goLo = (p) => cauDau.some(c => c.dao === d.id && Math.hypot(c.x - p.x, c.z - p.z) < 1.3);
        pts.forEach((p, i) => {
            if (goLo(p)) return;
            cotLC.them(p.x, 0.3, p.z);
            const q = pts[(i + 1) % pts.length];
            if (!goLo(q)) {
                const dai = Math.hypot(q.x - p.x, q.z - p.z); const g = Math.atan2(-(q.z - p.z), q.x - p.x);
                thanhLC.them((p.x + q.x) / 2, 0.6, (p.z + q.z) / 2, g, dai, 1, 1);
                kinhLC.them((p.x + q.x) / 2, 0.32, (p.z + q.z) / 2, g, dai, 1, 1);
            }
            // Dây leo rủ xuống vách — thưa, dài ngắn khác nhau, chỉ ở mặt quay về camera (sau lưng không ai thấy)
            const cheBien = bienX != null && Math.abs(p.x - bienX) < bienW / 2 + 0.4 && p.z > bienZ - 1;
            if (i % 3 === 1 && !cheBien && (p.x - d.x) + (p.z - d.z) > -0.3 * (d.w + d.d) / 2) {
                const dai = 0.6 + r() * 1.1; const vx = (p.x - d.x); const vz = (p.z - d.z); const L = Math.hypot(vx, vz) || 1;
                const ox = p.x + (vx / L) * 0.3; const oz = p.z + (vz / L) * 0.3;
                const so = Math.round(2 + dai * 2.5);
                for (let j = 0; j < so; j++) {
                    const t = j / so; const co = 1.05 - t * 0.6;
                    dayLeo.them(ox + (r() - 0.5) * 0.12, 0.05 - t * dai * 1.3, oz + (r() - 0.5) * 0.12, r() * 3, co, co * 1.3, co * 0.8);
                }
                laBon.them(ox, 0.1, oz, r() * 3, 0.75, 0.55, 0.75);
            }
        });
        const goc4 = d.tron ? [0, 2, 4, 6].map(i => pts[Math.floor((i / 8) * pts.length)]) : [pts[1], pts[Math.floor(pts.length / 2) + 1]];
        for (const p of goc4) {
            if (!p || goLo(p)) continue;
            const vx = (d.x - p.x) * 0.06; const vz = (d.z - p.z) * 0.06;
            cotDen.them(p.x + vx, 1.3, p.z + vz); bauDen.them(p.x + vx, 2.62, p.z + vz);
            viTriDen.push(p.x + vx, 2.62, p.z + vz);
            vetDen.them(p.x + vx * 6, 0.015, p.z + vz * 6, 0, 3.6, 3.6, 1, -Math.PI / 2);   // vệt sáng hắt xuống sàn
        }
        // Đảo chính không có bục Chief (CEO ngồi phòng riêng ở AI Lab) ⇒ giữa đảo là BỒN CÂY tròn + vòng vàng xoay
        if (d.id === 'chinh' && !layout.khu.some(k => k.dao === d.id && k.loai === 'buc')) {
            dat(new THREE.CylinderGeometry(1.15, 1.25, 0.42, 16), vat.goTham, d.x, 0.21, d.z);
            dat(new THREE.TorusGeometry(1.2, 0.035, 4, 40), vat.ledAm, d.x, 0.43, d.z).rotation.x = Math.PI / 2;
            for (let i = 0; i < 7; i++) { const g = (i / 7) * Math.PI * 2; laBon.them(d.x + Math.cos(g) * 0.75, 0.62, d.z + Math.sin(g) * 0.75, g, 1.3, 1.3, 1.3); }
            la.them(d.x, 1.15, d.z, 0.4, 1.7, 2, 1.7);
            for (const [rx, rz, tg] of [[1.2, 0, 0.35], [0, 1.2, -0.28]]) {
                const v = dat(new THREE.TorusGeometry(1.25, 0.03, 4, 48), vat.vang, d.x, 1.35, d.z, 0, false);
                v.rotation.set(rx, rz, 0); v.userData.dong = true; dong.push({ o: v, xoay: [0, tg, 0] });
            }
            bong(d.x, d.z, 3.4, 3.4);
        }
        // Cây ở 2 góc
        for (const p of [pts[Math.floor(pts.length * 0.2)], pts[Math.floor(pts.length * 0.7)]]) {
            if (!p || goLo(p)) continue;
            const vx = (d.x - p.x) * 0.12; const vz = (d.z - p.z) * 0.12;
            cayChau(p.x + vx, p.z + vz);
        }
    }
    for (const [ds, mat] of [[vienAm, vat.ledAm], [hao, vat.quangAm], [vienXanh, vat.ledXanh], [haoXanh, vat.quangXanh]]) {
        const m = new THREE.Mesh(mergeGeometries(ds, false), mat);
        ds.forEach(g => g.dispose());
        if (mat.transparent) m.renderOrder = 3;
        nhom.add(m);
    }

    // ── Nội thất từng khu ──
    for (const k of layout.khu) {
        if (k.loai === 'ban') {
            const cho = choNgoi(k, (k.cot || 2) * (k.hang || 2));
            for (const c of cho) {
                const bz = c.z - 0.78;
                ban.them(c.x, 0.74, bz); chanBan.them(c.x, 0.37, bz - 0.3);
                manHinh.them(c.x, 1.0, bz - 0.22);
                ghe.them(c.x, 0.45, c.z); lungGhe.them(c.x, 0.75, c.z + 0.25);
                bong(c.x, bz, 1.9, 1.2); bong(c.x, c.z, 0.8, 0.8);
            }
            if (k.ten) {
                const t = chuNen(k.ten);
                const hang = Math.max(k.hang || 2, 1);
                t.position.set(k.x, 0.02, k.z + hang * 1.1 + 0.9);
                nhom.add(t);
            }
            if (k.dao === 'chinh') {
                const bz = k.z + (k.z < 0 ? -2.6 : 2.9);
                bonCay.them(k.x, 0.18, bz); bong(k.x, bz, 2.8, 1);
                for (let i = -1; i <= 1; i++) laBon.them(k.x + i * 0.7, 0.5, bz, i);
            }
            if (k.id === 'bd') {
                // Bảng trắng biểu đồ tăng trưởng ở mép sau phòng BD
                const bz = k.z - (k.hang || 2) * 1.1 - 0.75;
                const bang = dat(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map: texBieuDo('duong'), color: '#c4cad6' })   /* tối bớt: bảng trắng tinh bị loé ở chế độ toả sáng */, k.x, 1.45, bz, 0, false);
                bang.userData.dong = true;
                dat(new THREE.BoxGeometry(2.35, 1.42, 0.06), vat.xam, k.x, 1.45, bz - 0.05);
                for (const s of [-1, 1]) dat(new THREE.BoxGeometry(0.06, 0.8, 0.06), vat.xam, k.x + s * 0.9, 0.4, bz - 0.05);
            }
        } else if (k.loai === 'cafe') {
            // Café = phòng sinh hoạt chung (kiểu khu "community"): thảm tròn, bàn tròn, quầy ghế cao, màn chiếu biểu đồ, sofa
            for (const [bx, bz] of BAN_CAFE) {
                banTron.them(k.x + bx, 0.72, k.z + bz); chanTron.them(k.x + bx, 0.36, k.z + bz);
                bong(k.x + bx, k.z + bz, 2, 2);
            }
            for (const c of choNgoi(k, BAN_CAFE.length * 4)) ghe2.them(c.x, 0.21, c.z);
            for (const g of gheQuayCafe()) gheQuay.them(k.x + g.x, 0.3, k.z + g.z);
            const q = QUAY_CAFE; const tx = Math.cos(q.ry); const tz = -Math.sin(q.ry);
            const rx = tz; const rz = -tx;                                                 // pháp tuyến hướng RA mép đảo
            const qx = k.x + q.x; const qz = k.z + q.z;
            // QUẦY THẬT: thân gỗ tối cao 0,95 + mặt gỗ sáng chìa ra 2 phía (bản trước là khối kệ cao 1,1 trông như bức tường,
            // che mất nhân viên pha chế đứng sau). Mặt quầy ở y = 1,0 — quanCafe đặt cốc trên đó.
            dat(new THREE.BoxGeometry(3.4, 0.95, 0.5), vat.goTham, qx, 0.475, qz, q.ry);
            dat(new THREE.BoxGeometry(3.6, 0.06, 0.78), vat.goSang, qx, 0.98, qz, q.ry);
            bong(qx, qz, 3.8, 1.2, q.ry);
            mayCafe.them(qx - tx * 0.9 + rx * 0.12, 1.285, qz - tz * 0.9 + rz * 0.12, q.ry); mayCafe.them(qx + tx * 0.2 + rx * 0.12, 1.285, qz + tz * 0.2 + rz * 0.12, q.ry, 0.7, 0.8, 1);
            const menu = dat(new THREE.PlaneGeometry(1.9, 0.75), vat.menu, qx + rx * 0.22, 2.15, qz + rz * 0.22, q.ry, false);
            menu.userData.dong = true;
            // Màn chiếu bên trái (quay vào giữa quán)
            const mx = k.x - 5.5; const mz = k.z - 1.4; const mry = Math.atan2(k.x - mx, k.z - mz);
            const man = dat(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map: texBieuDo('cot') }), mx, 1.55, mz, mry, false);
            man.userData.dong = true;
            dat(new THREE.BoxGeometry(2.36, 1.44, 0.06), vat.den, mx - Math.sin(mry) * 0.04, 1.55, mz - Math.cos(mry) * 0.04, mry);
            for (const s of [-1, 1]) dat(new THREE.BoxGeometry(0.06, 0.85, 0.06), vat.den, mx + Math.cos(mry) * s * 0.9, 0.42, mz - Math.sin(mry) * s * 0.9, mry);
        } else if (k.loai === 'may') {
            // Tủ server: LED xanh lá / xanh dương xen kẽ
            for (let i = 0; i < 4; i++) {
                tu.them(k.x - 2.4 + i * 1.05, 0.95, k.z - 1.8); bong(k.x - 2.4 + i * 1.05, k.z - 1.8, 1.3, 1.1);
                for (let j = 0; j < 7; j++) (i % 2 ? ledTu2 : ledTu).them(k.x - 2.4 + i * 1.05, 0.45 + j * 0.2, k.z - 1.8 + 0.36);
            }
            lamMat.them(k.x - 3, 0.45, k.z + 0.6); lamMat.them(k.x - 3, 0.45, k.z + 1.9);
            bong(k.x - 3, k.z + 1.25, 1.6, 2.9);
        } else if (k.loai === 'hop') {
            const hop = dat(new THREE.BoxGeometry(5.2, 2.4, 4.2), vat.kinh, k.x, 1.2, k.z, 0, false);
            hop.renderOrder = 2; hop.userData.dong = true;
            dat(new THREE.CylinderGeometry(2.4, 2.4, 0.02, 28), vat.thamXanh, k.x, 0.012, k.z, 0, false).scale.set(1, 1, 0.8);
            banTron.them(k.x, 0.72, k.z, 0, 1.8, 1, 1.4); chanTron.them(k.x, 0.36, k.z); bong(k.x, k.z, 3.4, 2.8);
            for (const c of choNgoi(k, 6)) ghe2.them(c.x, 0.21, c.z);
            for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cotKinh.them(k.x + sx * 2.6, 1.2, k.z + sz * 2.1);
            thanhKinh.them(k.x, 2.4, k.z - 2.1, 0, 5.2, 1, 1); thanhKinh.them(k.x, 2.4, k.z + 2.1, 0, 5.2, 1, 1);
            thanhKinh.them(k.x - 2.6, 2.4, k.z, Math.PI / 2, 4.2, 1, 1); thanhKinh.them(k.x + 2.6, 2.4, k.z, Math.PI / 2, 4.2, 1, 1);
        } else if (k.loai === 'ceo') {
            const x0 = k.x; const z0 = k.z;
            dat(new THREE.BoxGeometry(3.8, 0.02, 3), vat.tham, x0, 0.011, z0 - 0.3, 0, false);       // thảm
            dat(new THREE.BoxGeometry(2.4, 0.1, 1), vat.goCeo, x0, 0.78, z0);                           // mặt bàn
            dat(new THREE.BoxGeometry(2.4, 0.66, 0.08), vat.goCeo, x0, 0.4, z0 + 0.46);
            for (const s of [-1, 1]) dat(new THREE.BoxGeometry(0.1, 0.74, 0.96), vat.goCeo, x0 + s * 1.15, 0.37, z0);
            dat(new THREE.BoxGeometry(2.42, 0.03, 0.06), vat.dong, x0, 0.84, z0 + 0.5);
            // Màn hình ở MÉP TRÁI bàn, xoay chéo — đặt giữa bàn thì camera isometric thấy màn hình che kín mặt CEO
            dat(new THREE.BoxGeometry(0.8, 0.46, 0.05), vat.manHinh, x0 - 0.82, 1.1, z0 - 0.05, 0.6);
            dat(new THREE.BoxGeometry(0.06, 0.28, 0.06), vat.den, x0 - 0.82, 0.92, z0 - 0.05);
            dat(new THREE.CylinderGeometry(0.03, 0.05, 0.42, 6), vat.dong, x0 + 0.85, 1.04, z0 - 0.25);
            dat(new THREE.ConeGeometry(0.16, 0.14, 8, 1, true), vat.denDuong, x0 + 0.85, 1.28, z0 - 0.25);
            dat(new THREE.BoxGeometry(0.42, 0.1, 0.06), vat.dong, x0 + 0.55, 0.88, z0 + 0.32, 0.25);
            // Ghế giám đốc: da đen, LƯNG CAO, tay vịn
            dat(new THREE.BoxGeometry(0.68, 0.14, 0.64), vat.da2, x0, 0.45, z0 - 0.75);
            dat(new THREE.BoxGeometry(0.7, 1.05, 0.14), vat.da2, x0, 1.0, z0 - 1.1);
            for (const s of [-1, 1]) dat(new THREE.BoxGeometry(0.08, 0.2, 0.5), vat.da2, x0 + s * 0.36, 0.6, z0 - 0.78);
            dat(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 6), vat.xam, x0, 0.2, z0 - 0.75);
            bong(x0, z0, 3, 1.6);
            // Tường gỗ sau lưng + tranh + đèn cây
            const tz0 = z0 - 2.55;
            dat(new THREE.BoxGeometry(4.4, 2.3, 0.14), vat.goCeo, x0, 1.15, tz0);
            for (let i = -4; i <= 4; i++) dat(new THREE.BoxGeometry(0.06, 2.3, 0.05), vat.goSang, x0 + i * 0.48, 1.15, tz0 + 0.09, 0, false);
            const tranh = dat(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: texTranh() }), x0 + 1.3, 1.35, tz0 + 0.13, 0, false);
            tranh.userData.dong = true;
            dat(new THREE.BoxGeometry(1.0, 1.2, 0.04), vat.dong, x0 + 1.3, 1.35, tz0 + 0.1, 0, false);
            dat(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 6), vat.den, x0 - 1.85, 0.85, tz0 + 0.5);
            dat(new THREE.CylinderGeometry(0.18, 0.24, 0.3, 10, 1, true), vat.denDuong, x0 - 1.85, 1.75, tz0 + 0.5);
            // Ghế khách + sofa + bàn trà + cây
            for (const s of [-1, 1]) { ghe.them(x0 + s * 0.7, 0.45, z0 + 1.25); lungGhe.them(x0 + s * 0.7, 0.75, z0 + 1.5); }
            sofa.them(x0 + 1.95, 0.25, z0 + 1.9, -Math.PI / 2); lungSofa.them(x0 + 2.3, 0.6, z0 + 1.9, -Math.PI / 2);
            goiSofa.them(x0 + 2.15, 0.6, z0 + 1.45, -Math.PI / 2); goiSofa.them(x0 + 2.15, 0.6, z0 + 2.35, -Math.PI / 2);
            banTron.them(x0 + 1.0, 0.42, z0 + 2.0, 0, 0.8, 1, 0.8); chanTron.them(x0 + 1.0, 0.2, z0 + 2.0, 0, 1, 0.55, 1);
            bong(x0 + 1.9, z0 + 1.9, 1.3, 2.2);
            cayChau(x0 + 1.75, z0 - 1.25); cayChau(x0 - 2.05, z0 - 1.9, 1.2);
            if (k.ten) { const t = chuNen(k.ten, { nen: 'rgba(255,224,170,0.95)', vien: 'rgba(90,30,40,0.6)' }); t.position.set(x0 - 0.6, 0.03, z0 + 2.4); nhom.add(t); }
        } else if (k.loai === 'buc') {
            dat(new THREE.CylinderGeometry(1.4, 1.5, 0.22, 24), vat.buc, k.x, 0.11, k.z);
            dat(new THREE.TorusGeometry(1.45, 0.05, 4, 40), vat.ledAm, k.x, 0.23, k.z, 0, false).rotation.x = Math.PI / 2;
        }
        if (k.id === 'thu-vien') {
            // Kệ sách dọc tường sau (3 kệ — 4 kệ tràn qua góc vát của đảo) + gáy sách màu
            for (let i = 0; i < 3; i++) {
                ke.them(k.x - 1.8 + i * 1.8, 1, k.z - 2.6); bong(k.x - 1.8 + i * 1.8, k.z - 2.6, 1.9, 0.8);
                for (let j = 0; j < 3; j++) sach.them(k.x - 1.8 + i * 1.8, 0.45 + j * 0.55, k.z - 2.38);
            }
            // HOLOGRAM AI LAB: bệ tròn + vòng LED + khối lưới phát sáng xoay + 2 vòng nghiêng xoay
            const gx = k.x + 4.8; const gz = k.z - 2.4;
            dat(new THREE.CylinderGeometry(0.62, 0.7, 0.22, 20), vat.tuMay, gx, 0.11, gz);
            dat(new THREE.TorusGeometry(0.62, 0.03, 4, 32), vat.ledLam, gx, 0.23, gz, 0, false).rotation.x = Math.PI / 2;
            const loi = dat(new THREE.IcosahedronGeometry(0.2, 1), vat.nao, gx, 1.05, gz, 0, false);
            loi.userData.dong = true;
            const luoi = dat(new THREE.IcosahedronGeometry(0.46, 1), vat.holoDay, gx, 1.05, gz, 0, false);
            luoi.scale.set(1.15, 0.85, 0.95); luoi.userData.dong = true; dong.push({ o: luoi, xoay: [0, 0.35, 0] });
            for (const [nghieng, tg] of [[0.5, 0.6], [-0.7, -0.45]]) {
                const v = dat(new THREE.TorusGeometry(0.66, 0.018, 4, 40), vat.holo, gx, 1.05, gz, 0, false);
                v.rotation.set(Math.PI / 2 + nghieng, 0, 0); v.userData.dong = true; dong.push({ o: v, xoay: [0, 0, tg] });
            }
            bong(gx, gz, 1.8, 1.8);
            gheBanh.them(gx - 1.25, 0.3, gz, Math.PI / 2); gheBanh.them(gx + 1.25, 0.3, gz, -Math.PI / 2);
        }
        if (k.id === 'qa') {
            const holo = dat(new THREE.PlaneGeometry(1.8, 1.1), vat.holo, k.x + 1.8, 1.5, k.z - 1.8, -0.4, false);
            holo.userData.dong = true;
        }
    }

    for (const b of [ban, chanBan, manHinh, ghe, lungGhe, chau, la, bonCay, laBon, cotDen, bauDen, cotLC, thanhLC, kinhLC, tu, lamMat, ke, sach,
        banTron, chanTron, ghe2, vanCau, tayCau, cotKinh, thanhKinh, mayCafe, gheBanh, gheQuay, ledTu, ledTu2, dayLeo, bongMo, vetDen, sofa, lungSofa, goiSofa]) {
        const im = b.xong(nhom);
        if (im && im.material.transparent) im.renderOrder = 2;
    }

    // GỘP vật tĩnh theo vật liệu (bước D) — trước khi thêm vật chuyển động
    gomTinh(nhom);

    // ── Quầng sáng đèn ban đêm: MỘT Points cho mọi bóng đèn, cộng màu (additive), chỉ hiện khi bật đèn ──
    const geoQuang = new THREE.BufferGeometry();
    geoQuang.setAttribute('position', new THREE.Float32BufferAttribute(viTriDen, 3));
    const quang = new THREE.Points(geoQuang, new THREE.PointsMaterial({
        size: 2.4, map: tQuang, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    quang.visible = false; quang.renderOrder = 4;
    nhom.add(quang);

    // ── Mây bông: tấm phẳng có hoạ tiết mây, quay thẳng về camera (camera isometric không xoay ⇒ quay một lần), MỘT lệnh vẽ ──
    const soMay = 26;
    const geoMay = new THREE.PlaneGeometry(1, 0.5);
    const imMay = new THREE.InstancedMesh(geoMay, vat.may, soMay);
    imMay.userData.dong = true; imMay.renderOrder = 1;
    const qMay = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0.95, 1).normalize());
    const dsMay = [];
    const rm = ngauNhien(17);
    for (let i = 0; i < soMay; i++) {
        const s = 9 + rm() * 14;
        const p = new THREE.Vector3((rm() - 0.5) * 100, -9 - rm() * 9, (rm() - 0.5) * 90);
        dsMay.push({ p, s, v: 0.2 + rm() * 0.3 });
    }
    const _mm = new THREE.Matrix4(); const _sc = new THREE.Vector3();
    const datMay = () => {
        dsMay.forEach((m, i) => { imMay.setMatrixAt(i, _mm.compose(m.p, qMay, _sc.set(m.s, m.s, 1))); });
        imMay.instanceMatrix.needsUpdate = true;
    };
    datMay();
    nhom.add(imMay);

    return {
        nhom,
        capNhatDen(bat) {
            quang.visible = bat;
            vat.denDuong.emissiveIntensity = bat ? 1.6 : 0.2;
            vat.manHinh.emissiveIntensity = bat ? 0.9 : 0.25;
            vat.nao.emissiveIntensity = bat ? 1.6 : 0.9;
            vat.led.color.set(bat ? '#6ee7b7' : '#34d399');
            // Ban ngày dải LED như viền đồng mờ; tối thì sáng rực + quầng + vệt đèn hắt xuống sàn
            vat.ledAm.color.set(bat ? '#ffc46b' : '#d9b48a');
            vat.quangAm.opacity = bat ? 0.3 : 0.06; vat.quangXanh.opacity = bat ? 0.38 : 0.12;
            vat.vetDen.opacity = bat ? 0.42 : 0;
            vat.san.emissiveIntensity = bat ? 0.32 : 0;
        },
        mauMay(mau) { vat.may.color.set(mau); },
        /**
         * Cỡ quầng đèn theo mức phóng: camera TRỰC GIAO không thu phóng Points theo khoảng cách ⇒ `size` là PIXEL.
         * Bản trước để 2,4 (tưởng đơn vị cảnh) ⇒ quầng đèn đêm chỉ 2,4 px, gần như không thấy.
         */
        datCoDiem(pxMoiDonVi) { quang.material.size = 2.4 * pxMoiDonVi; },
        troi(dt) {
            for (const m of dsMay) { m.p.x += m.v * dt; if (m.p.x > 52) m.p.x -= 104; }
            datMay();
            for (const d of dong) { d.o.rotation.x += d.xoay[0] * dt; d.o.rotation.y += d.xoay[1] * dt; d.o.rotation.z += d.xoay[2] * dt; }
        },
        huy() {
            nhom.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
                for (const m of mats) { m.map?.dispose(); m.dispose(); }
            });
        },
    };
}
