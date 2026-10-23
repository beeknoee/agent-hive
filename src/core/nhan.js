/**
 * Nhãn chữ dạng VIÊN THUỐC (đen, chữ trắng HOA) và BÓNG CHỮ (trắng, chữ đen) — vẽ bằng canvas 2D → Sprite.
 *
 * Camera trực giao ⇒ cỡ sprite tính theo đơn vị thế giới; muốn nhãn luôn CỠ PIXEL cố định khi phóng to/thu nhỏ thì gọi
 * `capNhatCo(sprite, pxMoiDonVi)` mỗi lần zoom/resize (index.js lo việc này).
 */
import * as THREE from 'three';

/** Lớp riêng của nhãn + bóng chữ: chế độ toả sáng vẽ lớp này SAU hậu kỳ (nhãn trắng không bị loé nhoè). */
export const LOP_NHAN = 1;

const DPR = () => Math.min(globalThis.devicePixelRatio || 1, 2);

function veVien(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Logo model: nạp MỘT lần mỗi URL, dùng chung cho mọi nhãn. Nạp xong gọi lại các nhãn đang chờ để vẽ lại.
const KHO_LOGO = new Map();   // url → { img, xong, loi, cho: Set<fn> }
function layLogo(url, khiXong) {
    let l = KHO_LOGO.get(url);
    if (!l) {
        l = { img: new Image(), xong: false, loi: false, cho: new Set() };
        l.img.decoding = 'async';
        // Ảnh KHÁC origin không có CORS làm "bẩn" canvas ⇒ texImage2D ném SecurityError, nhãn thành trống.
        // crossOrigin=anonymous: máy chủ có CORS thì vẽ được; không có thì onerror ⇒ ô chữ cái.
        l.img.crossOrigin = 'anonymous';
        l.img.onload = () => {
            l.xong = true;
            const ds = [...l.cho]; l.cho.clear();
            for (const f of ds) { try { f(); } catch { /* một nhãn hỏng không được chặn các nhãn khác */ } }
        };
        l.img.onerror = () => { l.loi = true; l.cho.clear(); };   // logo hỏng ⇒ giữ ô chữ cái thay thế
        l.img.src = url;
        KHO_LOGO.set(url, l);
    }
    if (!l.xong && !l.loi && khiXong) l.cho.add(khiXong);
    return l;
}

/**
 * @param {string} chu
 * @param {{ nen?:string, mau?:string, coChu?:number, hoa?:boolean, dam?:boolean, cham?:string, khiVeLai?:()=>void,
 *           model?: { ngan:string, hang:string, logo?:string|null, mauHang?:{mau:string, chu:string} } | null }} o
 *   cham = màu chấm tròn bên trái (trạng thái) · model = huy hiệu [logo] viết-tắt NHỎ HƠN tên chính, đặt sau tên
 */
export function taoNhan(chu, o = {}) {
    const dpr = DPR();
    const coChu = (o.coChu || 11) * dpr;
    const text = o.hoa === false ? String(chu) : String(chu).toUpperCase();
    const font = `${o.dam === false ? 500 : 700} ${coChu}px ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`;
    const coModel = Math.round(coChu * 0.8);
    const fontModel = `600 ${coModel}px ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const padX = 9 * dpr; const padY = 5 * dpr; const cham = o.cham ? 12 * dpr : 0;
    const gianCach = text === text.toUpperCase() ? 0.06 * coChu : 0;
    ctx.font = font;
    ctx.letterSpacing = `${gianCach}px`;
    const rongTen = ctx.measureText(text).width;
    const m = o.model;
    const oLogo = Math.round(coChu * 1.3);        // ô logo vuông — cao gần bằng chữ tên (bản đầu 0,8×1,25 ⇒ logo ~8 px, khó nhìn)
    const khe = 6 * dpr; const kheLogo = 4 * dpr;
    let rongModel = 0;
    if (m) {
        ctx.font = fontModel; ctx.letterSpacing = '0px';
        rongModel = khe + oLogo + kheLogo + ctx.measureText(m.ngan).width;
    }
    const w = Math.ceil(rongTen + rongModel + padX * 2 + cham);
    const h = Math.ceil(Math.max(coChu, oLogo) + padY * 2);
    c.width = w; c.height = h;

    let daHuy = false;
    // MỘT hàm gọi lại cố định cho nhãn này (Set không cộng dồn); nhãn đã huỷ thì bỏ qua — không vẽ lên texture đã dispose
    const khiCoLogo = () => { if (daHuy) return; ve(); tex.needsUpdate = true; o.khiVeLai?.(); };
    const ve = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = o.nen || 'rgba(17,17,20,0.92)';
        veVien(ctx, 0, 0, w, h, h / 2);
        ctx.fill();
        if (o.cham) {
            ctx.fillStyle = o.cham;
            ctx.beginPath(); ctx.arc(padX + 3 * dpr, h / 2, 3.5 * dpr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.font = font; ctx.letterSpacing = `${gianCach}px`;
        ctx.fillStyle = o.mau || '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, padX + cham, h / 2 + dpr * 0.5);
        if (m) {
            const x0 = padX + cham + rongTen + khe;
            const y0 = (h - oLogo) / 2;
            const logo = m.logo ? layLogo(m.logo, khiCoLogo) : null;
            let daVe = false;
            if (logo?.xong) {
                // Nền trắng bo tròn dưới logo — logo màu tối (GPT) vẫn đọc được trên nhãn đen
                ctx.fillStyle = 'rgba(255,255,255,0.96)';
                veVien(ctx, x0, y0, oLogo, oLogo, oLogo * 0.28); ctx.fill();
                const pad = oLogo * 0.12;
                // drawImage có thể ném (SVG không khai cỡ trên Firefox…) ⇒ rơi về ô chữ cái, không làm vỡ setAgents
                try { ctx.drawImage(logo.img, x0 + pad, y0 + pad, oLogo - pad * 2, oLogo - pad * 2); daVe = true; } catch { daVe = false; }
            }
            if (!daVe) {
                // Thay thế khi chưa có / không có logo: ô màu hãng + chữ cái đầu (không vẽ logo thương hiệu)
                const mh = m.mauHang || { mau: '#64748b', chu: '•' };
                ctx.fillStyle = mh.mau;
                veVien(ctx, x0, y0, oLogo, oLogo, oLogo * 0.28); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(oLogo * 0.62)}px ui-sans-serif, system-ui, sans-serif`;
                ctx.letterSpacing = '0px'; ctx.textAlign = 'center';
                ctx.fillText(mh.chu, x0 + oLogo / 2, h / 2 + dpr * 0.5);
                ctx.textAlign = 'left';
            }
            ctx.font = fontModel; ctx.letterSpacing = '0px';
            ctx.fillStyle = 'rgba(203,213,225,0.95)';   // nhạt hơn tên chính
            ctx.fillText(m.ngan, x0 + oLogo + kheLogo, h / 2 + dpr * 0.5);
        }
    };
    const tex = new THREE.CanvasTexture(c);
    ve();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true });
    const s = new THREE.Sprite(mat);
    s.renderOrder = 10;
    s.layers.set(LOP_NHAN);
    s.userData.px = { w: w / dpr, h: h / dpr };   // cỡ CSS pixel mong muốn
    s.center.set(0.5, 0);                           // neo ở đáy giữa ⇒ đặt nhãn ngay trên đầu
    // huyNhan gọi: gỡ callback logo khỏi kho chung — không thì nhãn (và cả hive qua khiVeLai) bị giữ mãi khi logo nạp chậm / treo
    s.userData.huy = () => { daHuy = true; if (m?.logo) KHO_LOGO.get(m.logo)?.cho.delete(khiCoLogo); };
    return s;
}

export const MAU_BONG = { chay: '#06b6d4', duyet: '#f59e0b', loi: '#ef4444', can: '#f43f5e' };

/**
 * Bóng chữ: nền trắng bo tròn + VẠCH MÀU bên trái theo kiểu (chạy / chờ duyệt / lỗi) + ĐUÔI nhọn chỉ xuống người nói.
 * Tối đa ~40 ký tự. Neo ở đáy giữa = mũi đuôi.
 * @param {string} chu  @param {'chay'|'duyet'|'loi'} kieu
 */
export function taoBong(chu, kieu = 'chay') {
    const dpr = DPR();
    let t = String(chu || '').trim();
    if (t.length > 40) t = `${t.slice(0, 39)}…`;
    const coChu = 11 * dpr;
    const font = `500 ${coChu}px ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = font;
    const padX = 9 * dpr; const padY = 6 * dpr; const vach = 4 * dpr; const duoi = 6 * dpr;
    const w = Math.ceil(ctx.measureText(t).width + padX * 2 + vach + 4 * dpr);
    const hThan = Math.ceil(coChu + padY * 2);
    const h = hThan + duoi;
    c.width = w; c.height = h;
    // bóng đổ nhẹ cho nổi trên nền trời sáng
    ctx.shadowColor = 'rgba(15,23,42,0.18)'; ctx.shadowBlur = 4 * dpr; ctx.shadowOffsetY = 1 * dpr;
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    veVien(ctx, 1 * dpr, 1 * dpr, w - 2 * dpr, hThan - 2 * dpr, 7 * dpr);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - duoi, hThan - 2 * dpr); ctx.lineTo(w / 2, h - 1); ctx.lineTo(w / 2 + duoi, hThan - 2 * dpr); ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = MAU_BONG[kieu] || MAU_BONG.chay;
    veVien(ctx, 5 * dpr, 6 * dpr, vach, hThan - 14 * dpr, vach / 2);
    ctx.fill();
    ctx.font = font; ctx.fillStyle = '#16181d'; ctx.textBaseline = 'middle';
    ctx.fillText(t, padX + vach + 2 * dpr, hThan / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true }));
    s.renderOrder = 11;
    s.layers.set(LOP_NHAN);
    s.userData.px = { w: w / dpr, h: h / dpr };
    s.center.set(0.5, 0);
    return s;
}

/** Đặt cỡ sprite theo pixel: pxMoiDonVi = số pixel CSS ứng với 1 đơn vị thế giới ở mức zoom hiện tại. */
export function capNhatCo(sprite, pxMoiDonVi) {
    const { w, h } = sprite.userData.px || { w: 40, h: 16 };
    sprite.scale.set(w / pxMoiDonVi, h / pxMoiDonVi, 1);
}

export function huyNhan(sprite) {
    sprite.userData.huy?.();
    sprite.material.map?.dispose();
    sprite.material.dispose();
}
