/**
 * Bầu trời theo GIỜ THẬT (hàm thuần): sáng 6–16h · hoàng hôn 16–19h · đêm 19–5h · bình minh 5–6h.
 * Trả màu nền (gradient CSS cho khung chứa — canvas trong suốt, rẻ hơn vẽ bầu trời bằng WebGL), ánh sáng, và cờ bật đèn bàn.
 */
const pha = (a, b, t) => {
    const ha = parseInt(a.slice(1), 16); const hb = parseInt(b.slice(1), 16);
    const kenh = (h, s) => (h >> s) & 255;
    const c = [16, 8, 0].map(s => Math.round(kenh(ha, s) + (kenh(hb, s) - kenh(ha, s)) * t));
    return `#${c.map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

// Mốc theo giờ (0–24): màu trên / dưới của trời, màu nắng, cường độ nắng, đèn bàn
const MOC = [
    { h: 0, tren: '#0f0c34', duoi: '#43306e', nang: '#a59cff', manh: 0.35, den: true },   // đêm tím (không xanh than)
    { h: 5, tren: '#1d2350', duoi: '#c98a8a', nang: '#ffb38a', manh: 0.55, den: true },
    { h: 6.5, tren: '#9cc3f0', duoi: '#f6d6c2', nang: '#fff1dc', manh: 1.0, den: false },
    { h: 12, tren: '#8fc1f2', duoi: '#e8f1fb', nang: '#ffffff', manh: 1.15, den: false },
    { h: 16, tren: '#9db5e6', duoi: '#f5d3b8', nang: '#ffe4c4', manh: 1.0, den: false },
    { h: 18, tren: '#7a7fb8', duoi: '#f2a97f', nang: '#ffb070', manh: 0.8, den: true },
    { h: 19.5, tren: '#1c1650', duoi: '#6e4a86', nang: '#a69cff', manh: 0.45, den: true },
    { h: 24, tren: '#0f0c34', duoi: '#43306e', nang: '#a59cff', manh: 0.35, den: true },
];

/** @param {Date|number} luc  @returns {{ tren:string, duoi:string, nang:string, manh:number, den:boolean, dem:boolean, gio:number }} */
export function bauTroi(luc = new Date()) {
    const d = luc instanceof Date ? luc : new Date(luc);
    const gio = d.getHours() + d.getMinutes() / 60;
    let i = 0;
    while (i < MOC.length - 2 && MOC[i + 1].h <= gio) i++;
    const a = MOC[i]; const b = MOC[i + 1];
    const t = Math.min(1, Math.max(0, (gio - a.h) / (b.h - a.h)));
    return {
        tren: pha(a.tren, b.tren, t),
        duoi: pha(a.duoi, b.duoi, t),
        nang: pha(a.nang, b.nang, t),
        manh: a.manh + (b.manh - a.manh) * t,
        den: t < 0.5 ? a.den : b.den,
        dem: gio < 5.5 || gio >= 19.5,
        buoi: buoiTheoGio(gio),
        gio,
    };
}

/** Buổi theo giờ, khớp màu trời ở MOC: bình minh 5–6h30 · ngày 6h30–16h · chiều / hoàng hôn 16–19h30 · đêm. */
export function buoiTheoGio(gio) {
    if (gio >= 5 && gio < 6.5) return 'dawn';
    if (gio >= 6.5 && gio < 16) return 'day';
    if (gio >= 16 && gio < 19.5) return 'dusk';
    return 'night';
}

/** Nhãn HUD kiểu "DAY · 09:42" / "DUSK · 17:42" / "NIGHT · 21:05" / "DAWN · 05:40". */
export function nhanGio(luc = new Date()) {
    const d = luc instanceof Date ? luc : new Date(luc);
    const { buoi } = bauTroi(d);
    return `${buoi.toUpperCase()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
