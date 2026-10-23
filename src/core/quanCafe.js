/**
 * QUÁN CAFÉ sống: nhân viên pha chế pha cà phê và mang ra bàn, cốc trên bàn bốc khói.
 *
 * - Nhân viên PHA CHẾ đứng sau quầy. Ai vừa NGỒI vào ghế bàn ⇒ vào hàng chờ; pha chế pha (đứng ở quầy 2 s), cầm cốc đi tới cạnh bàn,
 *   đặt cốc trước mặt khách, quay về quầy, phục vụ người kế. Ghế QUẦY thì đặt cốc thẳng lên quầy, không phải đi.
 * - Cốc: MỘT InstancedMesh (đĩa + cốc + mặt cà phê gộp màu theo đỉnh), cốc ẩn = thu về cỡ 0. Khói: MỘT Points, mỗi cốc 3 hạt
 *   bay lên rồi mờ dần (cộng màu: màu đen = trong suốt ⇒ không cần alpha từng hạt). Tổng 2 lệnh vẽ.
 * - Khách đứng dậy đi ⇒ dọn cốc. Giảm chuyển động ⇒ pha chế không đi lại, cốc hiện ngay, không có khói.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BAN_CAFE, QUAY_CAFE, gheQuayCafe, timKhu } from './layout.js';

const SO_HAT = 3;
const _m = new THREE.Matrix4(); const _q = new THREE.Quaternion(); const _s = new THREE.Vector3(); const _p = new THREE.Vector3();

function hinhCoc() {
    const to = (g, mau) => {
        const h = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(mau); const n = h.attributes.position.count;
        const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
        h.setAttribute('color', new THREE.BufferAttribute(a, 3));
        for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'color'].includes(k)) h.deleteAttribute(k);
        return h;
    };
    const dia = to(new THREE.CylinderGeometry(0.12, 0.12, 0.015, 12).translate(0, 0.008, 0), '#f1ede6');
    const coc = to(new THREE.CylinderGeometry(0.065, 0.052, 0.1, 12).translate(0, 0.066, 0), '#d9733f');   // cốc màu cam đất — cốc trắng chìm hẳn trên bàn trắng
    const ca = to(new THREE.CylinderGeometry(0.058, 0.058, 0.006, 12).translate(0, 0.112, 0), '#5a3417');
    const quai = to(new THREE.TorusGeometry(0.03, 0.009, 4, 10, Math.PI).rotateZ(-Math.PI / 2).translate(0.07, 0.07, 0), '#d9733f');
    const g = mergeGeometries([dia, coc, ca, quai], false);
    [dia, coc, ca, quai].forEach(x => x.dispose());
    return g;
}

function texKhoi() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/**
 * @param {{ scene: THREE.Scene, layout: any, quanLyCho: any, nguoi: (id:string)=>any, phaChe: any, giamChuyenDong: boolean }} o
 *   phaChe = NhanVat của nhân viên pha chế (index.js tạo, có trong danh sách nhân viên phụ để rê chuột thấy tên)
 */
export function taoQuanCafe(o) {
    const k = timKhu(o.layout, 'cafe');
    if (!k || k.loai !== 'cafe') return null;
    // Vị trí ghế (tương đối → thế giới) và chỗ đặt cốc ứng với từng ghế: ghế bàn ⇒ trên mặt bàn, lệch về phía khách 0,28;
    // ghế quầy ⇒ trên mặt quầy (cao 1,1) trước mặt khách
    const tx = Math.cos(QUAY_CAFE.ry); const tz = -Math.sin(QUAY_CAFE.ry);   // trục dài quầy
    const rx = tz; const rz = -tx;                                           // pháp tuyến hướng RA mép đảo
    const cho = [];
    BAN_CAFE.forEach(([bx, bz]) => {
        for (let i = 0; i < 4; i++) {
            const g = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const cx = k.x + bx; const cz = k.z + bz;
            const gp = g + Math.PI / 4;   // pha chế đứng GIỮA hai ghế, quay mặt vào bàn
            cho.push({
                coc: { x: cx + Math.cos(g) * 0.28, y: 0.755, z: cz + Math.sin(g) * 0.28 },
                dung: { x: cx + Math.cos(gp) * 1.0, z: cz + Math.sin(gp) * 1.0, huong: Math.atan2(-Math.cos(gp), -Math.sin(gp)) },
            });
        }
    });
    for (const g of gheQuayCafe()) {
        cho.push({ coc: { x: k.x + g.x + rx * 0.45, y: 1.01, z: k.z + g.z + rz * 0.45 }, quay: true });
    }
    // Chỗ đứng của pha chế: sau quầy (phía lan can), quay mặt vào quán
    const choQuay = { x: k.x + QUAY_CAFE.x + rx * 0.72, z: k.z + QUAY_CAFE.z + rz * 0.72, huong: Math.atan2(-rx, -rz) };
    const giua = { x: k.x, z: k.z, dao: k.dao };   // đi qua giữa quán cho khỏi xuyên quầy / bàn sát quầy

    const n = cho.length;
    const imCoc = new THREE.InstancedMesh(hinhCoc(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), n);
    imCoc.castShadow = false; imCoc.receiveShadow = true;
    const daCoc = new Array(n).fill(false);
    const datCoc = (i, co) => {
        daCoc[i] = co;
        const c = cho[i].coc;
        imCoc.setMatrixAt(i, _m.compose(_p.set(c.x, c.y, c.z), _q.identity(), _s.setScalar(co ? 1.35 : 0)));
        imCoc.instanceMatrix.needsUpdate = true;
    };
    for (let i = 0; i < n; i++) datCoc(i, false);
    o.scene.add(imCoc);

    const vt = new Float32Array(n * SO_HAT * 3); const mau = new Float32Array(n * SO_HAT * 3);
    const geoKhoi = new THREE.BufferGeometry();
    geoKhoi.setAttribute('position', new THREE.BufferAttribute(vt, 3));
    geoKhoi.setAttribute('color', new THREE.BufferAttribute(mau, 3));
    const khoi = new THREE.Points(geoKhoi, new THREE.PointsMaterial({
        size: 0.34, map: texKhoi(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    khoi.renderOrder = 6; khoi.frustumCulled = false;
    o.scene.add(khoi);

    // ── Pha chế: máy trạng thái ──
    const pc = o.phaChe;
    pc.datNgay({ ...choQuay }, k.dao);
    let trangThai = 'cho'; let hen = 0; let dangPhucVu = -1;
    const hangCho = [];
    const diToi = (diem) => pc.diToi([giua, { ...diem, dao: k.dao }], { ...diem }, k.dao);

    let t = 0;
    return {
        /** Gọi mỗi khung (dt giây). */
        capNhat(dt) {
            t += dt;
            const ds = o.quanLyCho.dsKhu('cafe');
            // 1) Ghế nào có khách ĐÃ NGỒI (tới nơi, không còn đi) mà chưa có cốc ⇒ vào hàng; khách đi rồi ⇒ dọn cốc
            for (let i = 0; i < n; i++) {
                const id = ds[i]; const nv = id != null ? o.nguoi(id) : null;
                const ngoi = !!nv && !nv.dangDi;
                if (!ngoi) {
                    if (daCoc[i]) datCoc(i, false);
                    const j = hangCho.indexOf(i); if (j >= 0) hangCho.splice(j, 1);
                    continue;
                }
                if (!daCoc[i] && i !== dangPhucVu && !hangCho.includes(i)) {
                    // Không hoạt cảnh, hoặc khách ĐÃ NGỒI SẴN lúc mở văn phòng ⇒ có cốc luôn; chỉ khách MỚI tới mới chờ pha chế mang ra
                    if (o.giamChuyenDong || t < 4) datCoc(i, true);   // 4 s đầu: dữ liệu app (fetch) tới chậm vài trăm ms
                    else hangCho.push(i);
                }
            }
            if (o.giamChuyenDong) return;
            // 2) Pha chế: cho → pha (2 s ở quầy) → mang (đi tới bàn) → dat (0,7 s) → ve (về quầy) → cho
            const bay = t;
            if (trangThai === 'cho' && hangCho.length) { dangPhucVu = hangCho.shift(); trangThai = 'pha'; hen = bay + 1.2; }
            else if (trangThai === 'pha' && bay >= hen) {
                if (cho[dangPhucVu].quay) { datCoc(dangPhucVu, true); dangPhucVu = -1; trangThai = 'cho'; }
                else { pc.camCoc(true); diToi(cho[dangPhucVu].dung); trangThai = 'mang'; }
            } else if (trangThai === 'mang' && !pc.dangDi) { trangThai = 'dat'; hen = bay + 0.7; }
            else if (trangThai === 'dat' && bay >= hen) {
                pc.camCoc(false);
                const id = ds[dangPhucVu];
                if (id != null && o.nguoi(id) && !o.nguoi(id).dangDi) datCoc(dangPhucVu, true);   // khách còn ngồi mới đặt
                dangPhucVu = -1; diToi(choQuay); trangThai = 've';
            } else if (trangThai === 've' && !pc.dangDi) trangThai = 'cho';
            // 3) Khói: mỗi cốc 3 hạt lệch pha, bay lên 0,45 rồi tan (độ sáng = sin pha ⇒ hiện dần rồi mờ)
            for (let i = 0; i < n; i++) {
                const c = cho[i].coc;
                for (let j = 0; j < SO_HAT; j++) {
                    const k3 = (i * SO_HAT + j) * 3;
                    if (!daCoc[i]) { mau[k3] = mau[k3 + 1] = mau[k3 + 2] = 0; vt[k3 + 1] = -50; continue; }
                    const pha = (t * 0.45 + j / SO_HAT + i * 0.137) % 1;
                    vt[k3] = c.x + Math.sin(pha * 5 + i) * 0.035; vt[k3 + 1] = c.y + 0.18 + pha * 0.5; vt[k3 + 2] = c.z + Math.cos(pha * 4 + i) * 0.03;
                    const sang = Math.sin(pha * Math.PI) * 0.38;
                    mau[k3] = mau[k3 + 1] = mau[k3 + 2] = sang;
                }
            }
            geoKhoi.attributes.position.needsUpdate = true; geoKhoi.attributes.color.needsUpdate = true;
        },
        /** Cỡ hạt khói theo mức phóng (Points trực giao tính bằng PIXEL — xem canh.datCoDiem). */
        datCoDiem(pxMoiDonVi) { khoi.material.size = 0.3 * pxMoiDonVi; },
        huy() {
            o.scene.remove(imCoc); o.scene.remove(khoi);
            imCoc.geometry.dispose(); imCoc.material.dispose();
            geoKhoi.dispose(); khoi.material.map?.dispose(); khoi.material.dispose();
        },
    };
}
