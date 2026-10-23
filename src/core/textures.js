/**
 * Hoạ tiết vẽ bằng canvas 2D (không tải ảnh ngoài — license sạch, nhẹ): vân gỗ sàn, quầng sáng, bóng mờ chân đồ, mây,
 * biển tên có icon, bảng biểu đồ.
 */
import * as THREE from 'three';

const taoCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const thanhTex = (c, o = {}) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = o.tuyenTinh ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (o.lap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = 4;
    return t;
};

// Số ngẫu nhiên CỐ ĐỊNH theo hạt giống — hoạ tiết giống nhau mỗi lần tải
export function ngauNhien(hat = 1) {
    let s = hat >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

/** Sàn gỗ: 8 hàng ván so le, mỗi ván lệch sắc nhẹ + khe tối + vân mảnh. Lặp được (RepeatWrapping). */
export function texGo() {
    const N = 256; const c = taoCanvas(N, N); const ctx = c.getContext('2d'); const r = ngauNhien(7);
    const hang = 8; const cao = N / hang;
    for (let h = 0; h < hang; h++) {
        let x = -Math.floor(r() * 120);
        while (x < N) {
            const dai = 90 + Math.floor(r() * 110);
            const l = 74 + r() * 8;                      // độ sáng ván (HSL)
            ctx.fillStyle = `hsl(${30 + r() * 6}, ${38 + r() * 10}%, ${l}%)`;
            ctx.fillRect(x, h * cao, dai, cao);
            ctx.strokeStyle = 'rgba(120,80,45,0.10)'; ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) {                // vân gỗ
                const y = h * cao + 4 + r() * (cao - 8);
                ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + dai * 0.3, y + r() * 4 - 2, x + dai * 0.7, y + r() * 4 - 2, x + dai, y); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(90,60,35,0.35)'; ctx.fillRect(x + dai - 1, h * cao, 1.5, cao);   // khe đầu ván
            x += dai;
        }
        ctx.fillStyle = 'rgba(90,60,35,0.4)'; ctx.fillRect(0, h * cao, N, 1.5);                    // khe giữa hàng
    }
    // ván cuối hàng tràn qua mép phải ⇒ vẽ lặp mép trái cho liền khi lặp hoạ tiết
    ctx.drawImage(c, N, 0, 1, N, 0, 0, 1, N);
    return thanhTex(c, { lap: true });
}

/** Chấm tròn mờ dần (quầng đèn, vệt sáng trên sàn). */
export function texQuang(mau = [255, 214, 150]) {
    const c = taoCanvas(64, 64); const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const [r, gg, b] = mau;
    g.addColorStop(0, `rgba(${r},${gg},${b},0.95)`); g.addColorStop(0.35, `rgba(${r},${gg},${b},0.35)`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return thanhTex(c);
}

/** Bóng mờ dưới chân đồ đạc (thay bóng đổ thật ở bản thẻ — gần như miễn phí). */
export function texBong() {
    const c = taoCanvas(64, 64); const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, 'rgba(20,14,10,0.55)'); g.addColorStop(0.6, 'rgba(20,14,10,0.22)'); g.addColorStop(1, 'rgba(20,14,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return thanhTex(c);
}

/** Đám mây bông: nhiều chấm tròn mờ chồng nhau, đáy phẳng hơn. */
export function texMay() {
    const c = taoCanvas(256, 128); const ctx = c.getContext('2d'); const r = ngauNhien(11);
    for (let i = 0; i < 26; i++) {
        const x = 40 + r() * 176; const y = 50 + r() * 40 - (Math.abs(x - 128) < 60 ? 14 : 0); const R = 22 + r() * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, R);
        g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    }
    return thanhTex(c);
}

// ── Icon nét trắng cho biển tên (vẽ tay, không dùng emoji — mỗi máy một kiểu emoji) ──
function veIcon(ctx, loai, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    ctx.strokeStyle = '#f5f7fb'; ctx.fillStyle = '#f5f7fb'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const tron = (cx, cy, R, to = false) => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); to ? ctx.fill() : ctx.stroke(); };
    const vuong = (x0, y0, w, h, rr = 8) => { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, rr); ctx.stroke(); };
    switch (loai) {
        case 'server':
            for (let i = 0; i < 3; i++) { vuong(-38, -40 + i * 28, 76, 22, 6); tron(-22, -29 + i * 28, 4, true); }
            break;
        case 'nao':
            ctx.beginPath(); ctx.arc(-14, -4, 26, Math.PI * 0.5, Math.PI * 1.6); ctx.arc(14, -4, 26, Math.PI * 1.4, Math.PI * 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 24); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-26, 4); ctx.quadraticCurveTo(-12, 10, -10, -10); ctx.moveTo(26, 4); ctx.quadraticCurveTo(12, 10, 10, -10); ctx.stroke();
            break;
        case 'nguoi':
            tron(-18, -16, 12); tron(20, -12, 10);
            ctx.beginPath(); ctx.arc(-18, 30, 26, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(22, 28, 20, Math.PI * 1.1, 0); ctx.stroke();
            break;
        case 'kiem':
            tron(0, 0, 36); ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 14); ctx.lineTo(18, -12); ctx.stroke();
            break;
        case 'coc':
            ctx.beginPath(); ctx.moveTo(-30, -16); ctx.lineTo(-24, 30); ctx.lineTo(18, 30); ctx.lineTo(24, -16); ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.arc(30, 4, 12, -Math.PI / 2, Math.PI / 2); ctx.stroke();
            for (const dx of [-12, 2]) { ctx.beginPath(); ctx.moveTo(dx, -26); ctx.quadraticCurveTo(dx + 8, -34, dx, -44); ctx.stroke(); }
            break;
        case 'bieuDo':
            ctx.beginPath(); ctx.moveTo(-38, 36); ctx.lineTo(38, 36); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-34, 22); ctx.lineTo(-10, 0); ctx.lineTo(6, 12); ctx.lineTo(34, -24); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(18, -26); ctx.lineTo(36, -26); ctx.lineTo(36, -8); ctx.stroke();
            break;
        case 'toaNha':
            vuong(-34, -36, 40, 72, 4); vuong(10, -12, 26, 48, 4);
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-24, -22 + i * 20); ctx.lineTo(-6, -22 + i * 20); ctx.stroke(); }
            break;
        default:
            tron(0, 0, 10, true);
    }
    ctx.restore();
}

/**
 * Biển tên đảo: tấm TỐI bo góc, viền sáng mảnh, icon trắng bên trái, chữ trắng đậm (tự thu cỡ cho vừa).
 * @returns {{ tex: THREE.Texture, tiLe: number }}  tiLe = rộng / cao của tấm
 */
export function texBienTen(chu, icon) {
    const W = 1024; const H = 168; const c = taoCanvas(W, H); const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(18,20,34,0.94)';
    ctx.beginPath(); ctx.roundRect(6, 6, W - 12, H - 12, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(190,200,255,0.28)'; ctx.lineWidth = 4; ctx.stroke();
    const coIcon = icon ? 96 : 0;
    if (icon) veIcon(ctx, icon, 86, H / 2, coIcon);
    let co = 76; ctx.letterSpacing = '6px';
    const font = () => `800 ${co}px ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
    ctx.font = font();
    const rong = W - (icon ? 170 : 60) - 50;
    while (co > 28 && ctx.measureText(chu).width > rong) { co -= 4; ctx.font = font(); }
    ctx.fillStyle = '#f5f7fb'; ctx.textBaseline = 'middle'; ctx.textAlign = icon ? 'left' : 'center';
    ctx.fillText(chu, icon ? 160 : W / 2, H / 2 + 3);
    return { tex: thanhTex(c), tiLe: W / H };
}

/** Màn chiếu / bảng trắng có biểu đồ cột (café sinh hoạt chung) hoặc đường đi lên (BD). */
export function texBieuDo(kieu = 'cot') {
    const c = taoCanvas(320, 190); const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 190);
    g.addColorStop(0, kieu === 'cot' ? '#16325c' : '#f4f6fa'); g.addColorStop(1, kieu === 'cot' ? '#0d1f3d' : '#e6eaf2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 190);
    const mau = kieu === 'cot' ? ['#38bdf8', '#60a5fa', '#a78bfa', '#f472b6', '#34d399'] : ['#f97316'];
    if (kieu === 'cot') {
        const h = [60, 95, 75, 120, 140, 105];
        h.forEach((v, i) => { ctx.fillStyle = mau[i % mau.length]; ctx.fillRect(34 + i * 44, 160 - v, 28, v); });
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(24, 160, 272, 2);
    } else {
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(24, 164); ctx.lineTo(300, 164); ctx.moveTo(24, 20); ctx.lineTo(24, 164); ctx.stroke();
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.beginPath(); [[30, 150], [80, 130], [120, 138], [170, 98], [220, 84], [290, 34]].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.fillStyle = '#334155'; ctx.font = '700 22px ui-sans-serif, system-ui, sans-serif'; ctx.fillText('BD · Q4', 40, 44);
    }
    return thanhTex(c);
}

/** Tranh trừu tượng phòng CEO. */
export function texTranh() {
    const c = taoCanvas(160, 200); const ctx = c.getContext('2d');
    ctx.fillStyle = '#f3ede2'; ctx.fillRect(0, 0, 160, 200);
    const r = ngauNhien(5);
    for (const m of ['#c2410c', '#1e3a8a', '#ca8a04', '#0f766e']) {
        ctx.fillStyle = m; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(30 + r() * 100, 40 + r() * 120, 18 + r() * 28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, 170); ctx.bezierCurveTo(60, 120, 100, 190, 140, 110); ctx.stroke();
    return thanhTex(c);
}

/**
 * Nền XA (ảnh 2D cho CSS background — card đồ hoạ không vẽ gì): vài đảo nổi mờ ở chân trời, ban đêm có đèn thành phố.
 * Tạo một lần mỗi chế độ (ngày / đêm), cache lại.
 */
const KHO_NEN = new Map();
export function nenXa(dem) {
    const khoa = dem ? 'dem' : 'ngay';
    if (KHO_NEN.has(khoa)) return KHO_NEN.get(khoa);
    const W = 1600; const H = 1000; const c = taoCanvas(W, H); const ctx = c.getContext('2d'); const r = ngauNhien(dem ? 21 : 22);
    const DAO = [[0.08, 0.2, 0.9], [0.92, 0.17, 0.8], [0.04, 0.55, 0.7], [0.96, 0.62, 0.75], [0.3, 0.93, 0.6], [0.72, 0.95, 0.55], [0.55, 0.06, 0.45]];
    for (const [fx, fy, k] of DAO) {
        const x = fx * W; const y = fy * H; const w = 150 * k; const s = k;
        // thân đảo: mặt trên dẹt + chóp ngược lởm chởm
        ctx.fillStyle = dem ? 'rgba(34,26,66,0.92)' : 'rgba(150,160,200,0.45)';
        ctx.beginPath(); ctx.moveTo(x - w / 2, y);
        for (let i = 0; i <= 6; i++) ctx.lineTo(x - w / 2 + (w * i) / 6, y + (i % 2 ? 8 : 0) * s);
        ctx.lineTo(x + w * 0.15, y + 110 * s); ctx.lineTo(x - w * 0.1, y + 70 * s); ctx.closePath(); ctx.fill();
        // nhà cao tầng trên đảo
        for (let i = 0; i < 6; i++) {
            const bw = (10 + r() * 14) * s; const bh = (20 + r() * 60) * s; const bx = x - w * 0.4 + r() * w * 0.75;
            ctx.fillStyle = dem ? 'rgba(28,22,56,0.95)' : 'rgba(140,150,190,0.5)';
            ctx.fillRect(bx, y - bh, bw, bh);
            if (dem) {
                ctx.fillStyle = 'rgba(255,196,120,0.85)';
                for (let j = 0; j < bh / 7; j++) if (r() < 0.45) ctx.fillRect(bx + 2 + r() * (bw - 5), y - bh + 3 + j * 7, 2, 2);
            }
        }
    }
    const url = c.toDataURL('image/png');
    KHO_NEN.set(khoa, url);
    return url;
}
