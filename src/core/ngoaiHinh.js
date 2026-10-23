/**
 * Ngoại hình nhân viên (hàm THUẦN, kiểm thử được): giới tính, màu da, kiểu + màu tóc, trang phục, phụ kiện.
 *
 * Sinh CỐ ĐỊNH từ id (băm) ⇒ cùng một agent luôn là cùng một người giữa các lần tải. App ngoài ghi đè được từng phần qua
 * `agent.ngoaiHinh = { gioi, da, toc, trangPhuc, … }`. Trang phục ưu tiên theo PHÒNG (kỹ thuật ở Machine Deck, blouse ở QA…)
 * nhưng vẫn trộn ngẫu nhiên để không ai giống hệt ai.
 */

export const MAU_DA = {
    sang: '#f3d6bd',     // da trắng
    vang: '#e8c39b',     // da vàng (Đông Á)
    ngam: '#c8946a',     // da ngăm
    nau: '#8d5a3b',      // da nâu
    den: '#5b3a28',      // da đen
};
export const MAU_TOC = { den: '#1d1d22', nauDam: '#3b2618', nau: '#6b4226', vang: '#d6b25e', bac: '#b9bcc4', do: '#8e3b22' };

/** Trang phục: màu áo, màu quần, có váy không, phụ kiện. */
export const TRANG_PHUC = {
    'so-mi': { ten: 'Sơ mi', ao: ['#f4f7fb', '#cfe3f7', '#e7f0e3', '#f6e7ec'], quan: ['#2f3542', '#3d4a5c', '#5b4b3a'], phuKien: [] },
    'van-phong': { ten: 'Vest văn phòng', ao: ['#26324a', '#3a3f47', '#1f2329', '#4a3b33'], quan: ['#22262e', '#2c3038'], phuKien: ['cavat'] },
    'ky-thuat': { ten: 'Áo kỹ thuật', ao: ['#f08a24', '#2f6fd6', '#3a7d44'], quan: ['#2c3e66', '#3b3b3b'], phuKien: ['phanQuang'] },
    'bao-ve': { ten: 'Bảo vệ', ao: ['#5f8ccc'], quan: ['#34507e'],   // xanh vừa: xanh navy đậm ban đêm thành bóng đen
    phuKien: ['muBaoVe', 'phuHieu'] },
    'blouse': { ten: 'Áo blouse', ao: ['#fbfbfb'], quan: ['#3d4a5c', '#2f3542'], phuKien: ['blouse'] },
    'thuong': { ten: 'Áo phông', ao: ['#e05d5d', '#f2c14e', '#5aa9e6', '#7fc8a9', '#9b7bd4', '#ff8fab'], quan: ['#33538a', '#2f3542', '#6d5a4a'], phuKien: [] },
    // Pha chế quầy café: sơ mi trắng + tạp dề nâu — chỉ dùng khi ghi đè, không bốc ngẫu nhiên
    'phuc-vu': { ten: 'Pha chế', ao: ['#f4f2ee'], quan: ['#23262c'], phuKien: ['tapDe'] },
    'hoodie': { ten: 'Hoodie', ao: ['#3c3f58', '#5f6b7a', '#7a4fb5', '#2e7d6b'], quan: ['#25344f', '#1f2329'], phuKien: ['mu-trum'] },
};

// Phòng → các trang phục hay gặp (trộn theo trọng số đơn giản: lặp lại = hay gặp hơn)
const THEO_PHONG = {
    'khach-hang': ['so-mi', 'so-mi', 'van-phong', 'thuong'],
    'marketing': ['thuong', 'so-mi', 'hoodie', 'thuong'],
    'tai-chinh': ['van-phong', 'van-phong', 'so-mi'],
    'code': ['hoodie', 'thuong', 'hoodie', 'so-mi'],
    'ha-tang': ['ky-thuat', 'ky-thuat', 'hoodie'],
    'qa': ['blouse', 'blouse', 'so-mi'],
    'thu-vien': ['so-mi', 'thuong', 'van-phong'],
};

/** Băm chuỗi → số 32-bit (FNV-1a) — ổn định giữa các lần chạy. */
export function bam(s) {
    let h = 0x811c9dc5;
    for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
}

/** Bộ sinh số giả ngẫu nhiên từ hạt (mulberry32). */
function rng(hat) {
    let a = hat >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const chon = (r, ds) => ds[Math.floor(r() * ds.length) % ds.length];

/**
 * @param {{ id:string, phong?:string, vaiTro?:string, ngoaiHinh?:object }} agent
 * @returns {{ gioi:'nam'|'nu', da:string, toc:{kieu:string, mau:string}, trangPhuc:string, ao:string, quan:string, vay:boolean, phuKien:string[], kinh:boolean, cao:number }}
 */
export function ngoaiHinh(agent) {
    const r = rng(bam(agent.id));
    const gh = agent.ngoaiHinh || {};
    if (agent.vaiTro === 'chief') {
        return { gioi: 'nam', da: MAU_DA.vang, toc: { kieu: 'ngan', mau: MAU_TOC.den }, trangPhuc: 'van-phong', ao: '#14161b', quan: '#14161b', vay: false, phuKien: ['cavat', 'cavat-do'], kinh: true, cao: 1.22, ...gh };
    }
    const gioi = gh.gioi || (r() < 0.5 ? 'nu' : 'nam');
    const da = gh.da ? (MAU_DA[gh.da] || gh.da) : chon(r, [MAU_DA.sang, MAU_DA.vang, MAU_DA.vang, MAU_DA.ngam, MAU_DA.nau, MAU_DA.den]);
    const kieuToc = gioi === 'nu' ? chon(r, ['dai', 'bui', 'duoi-ngua', 'bob', 'dai']) : chon(r, ['ngan', 'ngan', 'xoan', 'cua', 'troc']);
    const mauToc = chon(r, [MAU_TOC.den, MAU_TOC.den, MAU_TOC.nauDam, MAU_TOC.nau, MAU_TOC.vang, MAU_TOC.do, MAU_TOC.bac]);
    const loai = gh.trangPhuc && TRANG_PHUC[gh.trangPhuc] ? gh.trangPhuc
        : agent.vaiTro === 'bao-ve' ? 'bao-ve'
            : chon(r, THEO_PHONG[agent.phong] || Object.keys(TRANG_PHUC).filter(k => k !== 'bao-ve' && k !== 'phuc-vu'));
    const tp = TRANG_PHUC[loai];
    let phuKien = [...tp.phuKien];
    if (loai === 'ky-thuat' && r() < 0.6) phuKien.push('muBaoHo');
    if ((loai === 'so-mi' || loai === 'thuong') && r() < 0.35) phuKien.push('daiThe');   // dây đeo thẻ nhân viên
    if (loai === 'hoodie' && r() < 0.5) phuKien = phuKien.filter(p => p !== 'mu-trum');   // không phải ai cũng trùm mũ… mà mũ trùm để sau lưng
    const vay = gioi === 'nu' && (loai === 'so-mi' || loai === 'van-phong') && r() < 0.5;
    const kq = {
        gioi, da, toc: { kieu: kieuToc, mau: mauToc }, trangPhuc: loai,
        ao: chon(r, tp.ao), quan: chon(r, tp.quan), vay, phuKien,
        kinh: r() < 0.25,
        cao: gioi === 'nu' ? 0.94 + r() * 0.06 : 0.98 + r() * 0.08,
        ...gh,
    };
    // Ghi đè dùng TÊN màu da ('den') hoặc chỉ một phần tóc ({ kieu }) ⇒ chuẩn hoá SAU khi trải `gh`.
    kq.da = MAU_DA[kq.da] || kq.da;
    kq.toc = { kieu: kieuToc, mau: mauToc, ...(gh.toc || {}) };
    if (MAU_TOC[kq.toc.mau]) kq.toc.mau = MAU_TOC[kq.toc.mau];
    return kq;
}
