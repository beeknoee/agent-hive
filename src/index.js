/**
 * agent-hive — a low-poly 3D office for AI agent teams. Made by Beeknoee (https://beeknoee.com), MIT.
 *
 *   const hive = createAgentHive(div, { language: 'en', onSelect: id => … });
 *   hive.setAgents([{ id, name, room, status, task }]);   // snapshot — call again whenever your data changes
 *   hive.pushEvent({ agentId, type: 'done' });            // optional one-off event (jump of joy)
 *   hive.dispose();
 *
 * Performance budget: ≤ 30 fps · stop drawing when the tab is hidden / the canvas is off-screen · prefers-reduced-motion ⇒ still frames.
 * Internals use Vietnamese names (ten = name, trangThai = status, phong = room, viec = task…); English input is translated
 * in core/aliases.js. Code comments are in Vietnamese.
 */
import * as THREE from 'three';
import { LAYOUT_MAC_DINH, LAYOUT_EN, LAYOUT_ZH, layoutTheoNgonNgu, khuTheoLoai, dungDoThi, loTrinh, loTrinhDayDu, loTrinhDoiDich, khuDich, timKhu, timDao } from './core/layout.js';
import { taoQuanLyCho, TIEN_TO_PHU } from './core/seats.js';
import { taoQuanCafe } from './core/cafe.js';
import { dungCanh } from './core/scene.js';
import { NhanVat } from './core/character.js';
import { capNhatCo, LOP_NHAN } from './core/labels.js';
import { giaiChong, UU_TIEN } from './core/declutter.js';
import { bauTroi, nhanGio, buoiTheoGio } from './core/sky.js';
import { nenXa } from './core/textures.js';
import { taoToaSang } from './core/bloom.js';
import { chuanHoaAgent, chuanHoaSuKien, chuanHoaTuyChon, viTriEn } from './core/aliases.js';
import { moTaModel, MAU_HANG } from './core/model.js';
import { LOI_THOAI, NGU_CANH, timCap, taoBoChon, dienViec, thoiGianCau } from './core/chat.js';

export { LAYOUT_MAC_DINH, LAYOUT_EN, LAYOUT_ZH, bauTroi, nhanGio, buoiTheoGio };

const CO_KHUNG = 32;       // chiều cao khung nhìn (đơn vị thế giới) ở zoom = 1 — 40 thì nhân viên quá nhỏ
const SO_BONG_TOI_DA = 3;  // tối đa bao nhiêu bóng chữ hiện cùng lúc — nhiều hơn là rối

/**
 * Chữ giao diện theo `ngonNgu` (HUD · chú thích · tiền tố bóng chữ · vai nhân viên phụ); ghi đè từng khoá bằng tuỳ chọn `chu`.
 * Tên đảo / khu đổi qua `layout`.
 */
const CHU = {
    vi: {
        nhanVien: 'nhân viên', dangLam: 'đang làm', canXuLy: 'cần xử lý', chuThich: ['Đang làm', 'Chờ duyệt', 'Lỗi', 'Cần xử lý', 'Rảnh'],
        loi: 'Lỗi', duyet: 'Chờ duyệt', can: 'Cần xử lý', phu: 'phụ',
        vai: { 'bao-ve': 'Bảo vệ', 'ky-thuat': 'Kỹ thuật viên', blouse: 'Kiểm thử viên', 'phuc-vu': 'Pha chế', khac: 'Nhân viên' },
        buoi: { dawn: 'DAWN', day: 'DAY', dusk: 'DUSK', night: 'NIGHT' },
    },
    en: {
        nhanVien: 'agents', dangLam: 'working', canXuLy: 'need attention', chuThich: ['Working', 'Awaiting approval', 'Error', 'Needs attention', 'Idle'],
        loi: 'Error', duyet: 'Awaiting approval', can: 'Needs attention', phu: 'staff',
        vai: { 'bao-ve': 'Security', 'ky-thuat': 'Technician', blouse: 'Tester', 'phuc-vu': 'Barista', khac: 'Staff' },
        buoi: { dawn: 'DAWN', day: 'DAY', dusk: 'DUSK', night: 'NIGHT' },
    },
    zh: {
        nhanVien: '名员工', dangLam: '人工作中', canXuLy: '人需处理', chuThich: ['工作中', '待审批', '出错', '需处理', '空闲'],
        loi: '出错', duyet: '待审批', can: '需处理', phu: '后勤',
        vai: { 'bao-ve': '保安', 'ky-thuat': '技术员', blouse: '测试员', 'phuc-vu': '咖啡师', khac: '员工' },
        buoi: { dawn: '黎明', day: '白天', dusk: '黄昏', night: '夜晚' },
    },
};

/**
 * @param {HTMLElement} khung
 * @param {{ layout?: any, fps?: number, bong?: boolean, hud?: boolean, chuThich?: boolean, dieuKhien?: boolean, zoom?: number, nhanVienPhu?: number,
 *           gio?: () => Date, ngonNgu?: 'vi'|'en'|'zh', onSelect?: (id:string|null) => void }} o
 */
export function createAgentHive(khung, tuyChon = {}) {
    const o = chuanHoaTuyChon(tuyChon);   // tuỳ chọn tiếng Anh (shadows, language, …) ⇒ tên nội bộ — core/aliases.js
    const layout = o.layout || layoutTheoNgonNgu(o.ngonNgu);
    const fps = Math.min(60, Math.max(10, o.fps || 30));
    const layGio = o.gio || (() => new Date());
    const goc = CHU[o.ngonNgu] || CHU.vi;
    const chu = { ...goc, ...(o.chu || {}), vai: { ...goc.vai, ...(o.chu?.vai || {}) }, buoi: { ...goc.buoi, ...(o.chu?.buoi || {}) } };
    const giamChuyenDong = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (getComputedStyle(khung).position === 'static') khung.style.position = 'relative';
    khung.style.overflow = 'hidden';

    // ── Renderer + camera ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !!o.bong;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    khung.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const tam = new THREE.Vector3(0, -1, 0);
    const huongNhin = new THREE.Vector3(1, 0.95, 1).normalize();
    camera.zoom = o.zoom || 1;
    camera.layers.enable(LOP_NHAN);
    const datCamera = () => { camera.position.copy(tam).addScaledVector(huongNhin, 120); camera.lookAt(tam); };
    datCamera();

    const hemi = new THREE.HemisphereLight('#ffffff', '#5a5f78', 0.9);
    const nang = new THREE.DirectionalLight('#ffffff', 1.1);
    nang.position.set(-30, 50, 20);
    nang.castShadow = !!o.bong;
    if (o.bong) {
        nang.shadow.mapSize.set(1024, 1024);
        Object.assign(nang.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 140 });
        nang.shadow.bias = -0.0005;
    }
    scene.add(hemi, nang);

    const canh = dungCanh(layout, { bong: o.bong });
    // Chất lượng CAO (toàn màn hình): toả sáng ban đêm, nạp động; máy không giữ nổi ~22 fps thì TỰ TẮT toả sáng (haCap)
    const chatCao = o.chatLuong === 'cao' && !giamChuyenDong;
    let toaSang = null; let bloomBat = false; let haCap = false; let emaKhung = 33; let soKhungCham = 0;
    scene.add(canh.nhom);
    const doThi = dungDoThi(layout);
    const KHU_CAFE = khuTheoLoai(layout, 'cafe', 'cafe');   // café tìm theo loại khu (layout tự tạo đặt id khác vẫn chạy)

    // ── HUD giờ ──
    let hud = null;
    if (o.hud !== false) {
        // Không nền, chữ đổi màu theo trời (ngày tối · đêm sáng — apTroi đặt) + số nhân viên ngay sau giờ
        hud = document.createElement('div');
        Object.assign(hud.style, {
            position: 'absolute', left: '14px', top: '12px', font: '700 11.5px ui-sans-serif, system-ui, sans-serif',
            letterSpacing: '0.12em', pointerEvents: 'none', userSelect: 'none', display: 'flex', alignItems: 'baseline', gap: '12px',
        });
        khung.appendChild(hud);
    }

    // ── Chú thích trạng thái (tuỳ chọn `chuThich`) — cùng màu chấm trên nhãn tên ──
    let chuThich = null;
    if (o.chuThich) {
        chuThich = document.createElement('div');
        Object.assign(chuThich.style, {
            position: 'absolute', left: '12px', bottom: '12px', display: 'flex', gap: '10px', padding: '6px 12px', borderRadius: '999px',
            // nền nhạt bớt (0,82 → 0,45 + mờ kính) — đỡ nặng mắt, chữ vẫn đọc được
            background: 'rgba(17,17,20,0.45)', backdropFilter: 'blur(4px)', color: '#eef0f4', font: '600 11px ui-sans-serif, system-ui, sans-serif',
            pointerEvents: 'none', userSelect: 'none',
        });
        for (const [mau, ten] of ['#22d3ee', '#f59e0b', '#ef4444', '#f43f5e', '#94a3b8'].map((m, i) => [m, chu.chuThich[i]])) {
            const s = document.createElement('span');
            s.innerHTML = `<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${mau};margin-right:5px;vertical-align:0"></i>${ten}`;
            chuThich.appendChild(s);
        }
        khung.appendChild(chuThich);
    }

    // Sao: vài chấm cố định lặp lại (rẻ — chỉ là nền CSS, không phải WebGL)
    const SAO = [[23, 41], [71, 13], [119, 57], [167, 29], [41, 97], [143, 109], [191, 83], [11, 151], [97, 173], [181, 161]]
        .map(([x, y], i) => `radial-gradient(${i % 3 ? 1 : 1.6}px ${i % 3 ? 1 : 1.6}px at ${x}px ${y}px, rgba(255,255,255,${i % 2 ? 0.75 : 0.95}), transparent)`)
        .join(', ');
    // HUD: "DUSK · 17:40   20 nhân viên · 3 đang làm · 2 cần xử lý" (chỉ agent thật, không tính nhân viên phụ)
    const veHud = () => {
        if (!hud) return;
        let lam = 0; let can = 0;
        for (const n of nv.values()) { if (n.trangThai === 'dang_chay') lam++; else if (n.trangThai === 'loi' || n.trangThai === 'can_xu_ly') can++; }
        const bay = layGio();
        const gioChu = `${chu.buoi[buoiTheoGio(bay.getHours() + bay.getMinutes() / 60)]} · ${String(bay.getHours()).padStart(2, '0')}:${String(bay.getMinutes()).padStart(2, '0')}`;
        hud.innerHTML = `<span>${gioChu}</span><span style="letter-spacing:0.04em;font-weight:600;opacity:0.85">${nv.size} ${chu.nhanVien}${lam ? ` · ${lam} ${chu.dangLam}` : ''}${can ? ` · <b style="color:#f43f5e">${can} ${chu.canXuLy}</b>` : ''}</span>`;
    };
    const apTroi = () => {
        const t = bauTroi(layGio());
        // Mặt trời đi vòng cung 6h → 19h (trái → phải); đêm: trăng + sao. Thêm lớp NỀN, canvas vẫn trong suốt.
        const lop = [];
        if (t.gio >= 6 && t.gio <= 19) {
            const k = (t.gio - 6) / 13;
            const x = 12 + k * 76; const y = 34 - Math.sin(Math.PI * k) * 22;
            lop.push(`radial-gradient(circle at ${x}% ${y}%, ${t.nang} 0, ${t.nang} 2.2%, rgba(255,214,150,0.35) 2.6%, transparent 9%)`);
        } else {
            lop.push('radial-gradient(circle at 80% 16%, #f4f1e4 0, #f4f1e4 1.6%, rgba(220,226,255,0.25) 2%, transparent 6%)');
            lop.push(SAO);
        }
        // Đảo nổi xa + nhà cao tầng (đêm có đèn) — ẢNH 2D vẽ sẵn một lần (hoaTiet.nenXa), card đồ hoạ không phải vẽ
        lop.push(`url(${nenXa(t.dem)})`);
        lop.push(`linear-gradient(180deg, ${t.tren} 0%, ${t.duoi} 100%)`);
        khung.style.background = lop.join(', ');
        const ngay = t.gio >= 6 && t.gio <= 19;
        khung.style.backgroundSize = ngay ? 'auto, cover, auto' : `auto, ${Array(10).fill('200px 200px').join(', ')}, cover, auto`;
        khung.style.backgroundPosition = ngay ? '0 0, center, 0 0' : `0 0, ${Array(10).fill('0 0').join(', ')}, center, 0 0`;
        khung.style.backgroundRepeat = ngay ? 'no-repeat, no-repeat, no-repeat' : `no-repeat, ${Array(10).fill('repeat').join(', ')}, no-repeat, no-repeat`;
        // Ban đêm: nắng yếu nhưng ánh sáng nền KHÔNG được tụt quá thấp: đêm tối tới mức không thấy người.
        // Ánh sáng nền chỉ PHA 35% màu nắng (hoàng hôn lấy nguyên màu cam ⇒ sàn trắng thành nâu);
        // màu nắng đầy đủ để cho tia nắng chính (DirectionalLight) — đủ ấm mà không nhuộm cả cảnh.
        hemi.color.set('#ffffff').lerp(new THREE.Color(t.dem ? '#c7cdf5' : t.nang), t.dem ? 1 : 0.35);
        hemi.intensity = Math.max(0.95, 0.6 + t.manh * 0.45);
        nang.color.set(t.nang); nang.intensity = Math.max(0.55, t.manh);
        canh.capNhatDen(t.den);
        bloomBat = t.den;   // ban ngày không cần toả sáng (sàn sáng dễ loé) — tiết kiệm luôn
        // Mây: đêm tím hồng, ngày trắng ngả theo màu chân trời (hoàng hôn ⇒ hồng cam)
        canh.mauMay(t.dem ? '#8f7cc0' : `#${new THREE.Color('#ffffff').lerp(new THREE.Color(t.duoi), 0.35).getHexString()}`);
        // Chữ HUD tương phản với trời; khung mang data-troi để app tô nút của mình (vd nút toàn màn hình) cùng kiểu
        const sangTroi = t.gio >= 6 && t.gio <= 19;
        khung.dataset.troi = sangTroi ? 'ngay' : 'dem';
        if (hud) {
            hud.style.color = sangTroi ? '#1c2030' : '#f5f7fb';
            hud.style.textShadow = sangTroi ? '0 1px 2px rgba(255,255,255,0.55)' : '0 1px 3px rgba(0,0,0,0.55)';
        }
        veHud();
        canDraw = true;
    };

    // ── Nhân vật ──
    /** @type {Map<string, NhanVat>} */
    const nv = new Map();
    /** @type {Map<string, any>} */
    const duLieu = new Map();
    const choNgoiQL = taoQuanLyCho(layout);   // chỗ cố định + nhân viên phụ nhường agent (core/seats.js)
    const lucDoi = new Map();     // agentId -> lúc đổi trạng thái gần nhất (để chọn ai được hiện bóng chữ)

    /** Cho người `n` đi (hoặc đặt ngay) tới chỗ `cho`. Đang đi dở ⇒ đi nốt điểm kế rồi rẽ (không đi lùi / xuyên trời). */
    const diToiCho = (n, cho, ngay) => {
        if (ngay || giamChuyenDong) { n.datNgay(cho, cho.dao); if (giamChuyenDong) n.buoc(0); return; }
        const lt = n.dangDi
            ? loTrinhDoiDich(doThi, n.daoHienTai || cho.dao, n.duong[0], cho)
            : loTrinhDayDu(doThi, n.daoHienTai || cho.dao, n.goc.position, n.dich, cho);
        n.diToi(lt, cho, cho.dao);
    };
    // Nhân viên phụ bị agent đuổi khỏi chỗ ⇒ ra café (hết chỗ chuẩn ở café thì đứng nguyên chờ lượt lang thang sau)
    const choPhuDi = (id) => {
        const m = phu.find(x => x.a.id === id);
        if (!m) return;
        m.hen = performance.now() + 7000 + Math.random() * 9000;
        const kq = KHU_CAFE ? choNgoiQL.lay(KHU_CAFE, id) : null;
        if (kq) diToiCho(m.n, kq.cho, false);
    };
    const apAgent = (a, { dauTien = false } = {}) => {
        let n = nv.get(a.id);
        if (!n) {
            n = new NhanVat(a, { khiVeLai: () => { if (!daHuy) { canDraw = true; batVong(); } } });
            nv.set(a.id, n);
            scene.add(n.goc);
            dauTien = true;
        } else {
            n.capNhatAgent(a);   // tên / vai trò / ngoại hình đổi (bản trước bỏ qua)
        }
        n.datModel(a.model);
        const ttCu = n.trangThai;
        n.datTrangThai(a.trangThai || 'ranh');
        if (ttCu !== n.trangThai) lucDoi.set(a.id, performance.now());
        const khu = khuDich(a, layout) ?? (dauTien ? (timKhu(layout, a.phong) ? a.phong : KHU_CAFE) : null);
        const vong = vongCeo.get(a.id);
        if (vong?.buoc) {
            if (khu === KHU_CEO && coTheDiVong(a, n)) return;   // CEO đang đi vòng kiểm tra / uống cà phê — để vòng tự về bàn
            vong.buoc = null; vong.ngoiTu = 0; vong.nghiBan = 30000;   // trạng thái đổi (lỗi, chờ duyệt…) ⇒ bỏ vòng, đi theo trạng thái
        }
        if (khu && choNgoiQL.khuCua(a.id) !== khu) {
            const kq = choNgoiQL.lay(khu, a.id);   // lấy chỗ mới trước, được mới nhả chỗ cũ
            if (kq) {
                diToiCho(n, kq.cho, dauTien);
                if (kq.duoi) choPhuDi(kq.duoi);
            }
        }
    };

    // ── Nhân viên PHỤ (không gắn agent, không nhãn) — cho văn phòng sống động: bảo vệ gác đầu cầu, kỹ thuật ở Machine Deck,
    //    blouse ở QA, còn lại đi lại giữa bàn và café. Dùng CHUNG bể chỗ ngồi với agent nên không ngồi đè lên nhau.
    const phu = [];
    const phuTheoId = new Map();   // id → NhanVat của nhân viên phụ
    // Nhân viên phụ không gắn agent nhưng RÊ CHUỘT vẫn hiện VAI TRÒ (nhãn xám) — khỏi nhầm là agent mất tên
    const TEN_VAI_PHU = chu.vai;
    const VAI_PHU = ['bao-ve', 'ky-thuat', 'so-mi', 'van-phong', 'thuong', 'bao-ve', 'hoodie', 'blouse', 'so-mi', 'thuong', 'ky-thuat', 'van-phong'];
    const KHU_BAN = layout.khu.filter(k => k.loai === 'ban').map(k => k.id);
    const nutCauChinh = [...doThi.nut.entries()].filter(([id, n]) => id.startsWith('cau') && n.dao === 'chinh').map(([, n]) => n);
    const soPhu = Math.max(0, Math.min(40, o.nhanVienPhu ?? 10));
    let soGac = 0;
    for (let i = 0; i < soPhu; i++) {
        const loai = VAI_PHU[i % VAI_PHU.length];
        const a = { id: `${TIEN_TO_PHU}${i}`, ten: `${TEN_VAI_PHU[loai] || TEN_VAI_PHU.khac} · ${chu.phu}`, vaiTro: loai === 'bao-ve' ? 'bao-ve' : 'npc', ngoaiHinh: { trangPhuc: loai },
            phong: loai === 'ky-thuat' ? 'ha-tang' : loai === 'blouse' ? 'qa' : null };
        if (a.phong && !timKhu(layout, a.phong)) a.phong = null;   // layout tuỳ biến không có khu đó
        const n = new NhanVat(a, { phu: true });
        n.datTrangThai('ranh');
        phuTheoId.set(a.id, n);
        scene.add(n.goc);
        const m = { a, n, gac: loai === 'bao-ve' && soGac < nutCauChinh.length, hen: performance.now() + Math.random() * 6000 };
        if (m.gac) {
            const c = nutCauChinh[soGac++ * 2 % nutCauChinh.length];
            n.datNgay({ x: c.x * 0.9, z: c.z * 0.9 + 0.6, huong: Math.atan2(c.x, c.z) }, 'chinh');
        } else {
            // Phụ chỉ ngồi chỗ chuẩn còn trống; hết thì thử café, rồi tới khu bàn khác
            const thu = [a.phong || (Math.random() < 0.5 ? KHU_CAFE : KHU_BAN[i % KHU_BAN.length]), KHU_CAFE, ...KHU_BAN].filter(Boolean);
            for (const khu of thu) {
                const kq = choNgoiQL.lay(khu, a.id);
                if (kq) { n.datNgay(kq.cho, kq.cho.dao); break; }
            }
        }
        if (giamChuyenDong) n.buoc(0);   // không có vòng hoạt cảnh ⇒ đặt tư thế (ngồi/đứng) ngay
        phu.push(m);
    }
    // ── Quán café sống: NHÂN VIÊN PHA CHẾ sau quầy, mang cà phê ra bàn; cốc bốc khói (core/cafe.js) ──
    let quanCafe = null;
    if (KHU_CAFE) {
        const a = { id: `${TIEN_TO_PHU}pha-che`, ten: `${TEN_VAI_PHU['phuc-vu']} · ${chu.phu}`, vaiTro: 'npc', ngoaiHinh: { trangPhuc: 'phuc-vu', gioi: 'nu', toc: { kieu: 'duoi-ngua', mau: 'den' }, da: 'vang' } };
        const n = new NhanVat(a, { phu: true });
        n.datTrangThai('ranh');
        scene.add(n.goc); phuTheoId.set(a.id, n);
        phu.push({ a, n, phaChe: true });
        quanCafe = taoQuanCafe({ scene, layout, quanLyCho: choNgoiQL, nguoi: (id) => nguoiTheoId(id), phaChe: n, giamChuyenDong });
        if (giamChuyenDong) n.buoc(0);
    }
    // Bảo vệ ĐI TUẦN: lần lượt tới đầu cầu của mọi đảo (qua cầu sang
    // Machine Deck, café, BD…), đứng nhìn ra ngoài 4–8 s rồi đi điểm khác. Bản trước đứng im một chỗ cả ngày.
    const DIEM_TUAN = [...doThi.nut.entries()].filter(([id]) => id.startsWith('cau')).map(([, n]) => {
        const d = timDao(layout, n.dao);
        const dx = d.x - n.x; const dz = d.z - n.z; const L = Math.hypot(dx, dz) || 1;
        // lùi vào trong đảo 0,5 cho khỏi đứng trên ván cầu; quay mặt RA ngoài (canh lối vào)
        return { x: n.x + (dx / L) * 0.5, z: n.z + (dz / L) * 0.5, dao: n.dao, huong: Math.atan2(-dx, -dz) };
    });
    const diTuan = (m, now) => {
        if (m.n.dangDi) { m.den = 0; return; }
        if (!m.den) { m.den = now; m.nghi = 4000 + Math.random() * 4000; return; }
        if (now - m.den < m.nghi || DIEM_TUAN.length < 2) return;
        let j = Math.floor(Math.random() * DIEM_TUAN.length);
        if (j === m.diem) j = (j + 1) % DIEM_TUAN.length;
        m.diem = j; m.den = 0;
        const t = DIEM_TUAN[j];
        m.n.diToi(loTrinh(doThi, m.n.daoHienTai || 'chinh', m.n.goc.position, t.dao, t), t, t.dao);
    };
    const langThang = (now) => {
        for (const m of phu) {
            if (m.gac) { diTuan(m, now); continue; }
            if (m.phaChe) continue;   // pha chế do quanCafe điều khiển
            if (m.n.dangDi || now < m.hen) continue;
            m.hen = now + 7000 + Math.random() * 9000;
            const r = Math.random();
            const khu = m.a.phong && r < 0.45 ? m.a.phong : r < 0.7 ? KHU_CAFE : KHU_BAN[Math.floor(Math.random() * KHU_BAN.length)];
            if (choNgoiQL.khuCua(m.a.id) === khu) continue;
            const kq = choNgoiQL.lay(khu, m.a.id);   // hết chỗ chuẩn ⇒ null, ngồi yên chỗ cũ
            if (kq) diToiCho(m.n, kq.cho, false);
        }
    };

    // ── TRÒ CHUYỆN: cứ 6–14 s ghép 2 người đứng / ngồi gần nhau (core/chat.js) cho văn phòng bớt cảnh ai cũng làm một mình —
    //    nói 2–4 câu luân phiên bằng bóng chữ tím; người đang ĐỨNG quay mặt vào nhau. Tối đa 2 cuộc cùng lúc. CEO ghé bàn ⇒ hỏi han.
    //    Tắt bằng `troChuyen: false` (en: `chatter: false`); đổi lời bằng `loiThoai` (en: `chatLines`).
    const TRO_CHUYEN = o.troChuyen !== false && !giamChuyenDong;
    // Lời thoại theo ngữ cảnh (core/chat.js). App truyền `loiThoai.thuong` ⇒ CHỈ dùng lời của app cho chuyện thường (ngữ cảnh khác
    // của thư viện bỏ, trừ khi app truyền tiếp); không truyền ⇒ bộ mặc định của ngôn ngữ, ghi đè từng ngữ cảnh nếu có.
    const LOI_GOC = LOI_THOAI[o.ngonNgu] || LOI_THOAI.vi;
    const LOI_APP = o.loiThoai || {};
    const LOI = Object.fromEntries(NGU_CANH.map(k => [k,
        LOI_APP[k] ?? (LOI_APP.thuong && k !== 'ceo' ? [] : LOI_GOC[k] || [])]));
    const chonDoan = taoBoChon();   // không lặp đoạn vừa nói gần đây
    const KHU_CAFE_DAO = timKhu(layout, KHU_CAFE)?.dao;
    const dangNoi = new Map();   // id → câu đang nói (agent: chonBong vẽ; nhân viên phụ: vẽ thẳng)
    const cuocNoi = [];          // { ng: [{ id, n, phu }], cau: [...], i, het }
    let henNoi = performance.now() + 4000 + Math.random() * 4000;
    const trongCuoc = (id) => cuocNoi.some(c => c.ng.some(p => p.id === id));
    const noi = (p, chu) => {
        if (chu) dangNoi.set(p.id, chu); else dangNoi.delete(p.id);
        if (p.phu) { p.n.datBong(chu || '', 'chat'); capNhatCoNhan(); } else chonBong();   // bóng mới phải đặt cỡ theo pixel
        canDraw = true;
    };
    const ngoiCho = (n) => !!(n.dich?.ngoi || n.dich?.ban);
    const batDauNoi = (a, b, cau) => {
        if (!cau?.length || trongCuoc(a.id) || trongCuoc(b.id)) return;
        for (const [x, y] of [[a, b], [b, a]]) {
            if (!ngoiCho(x.n)) x.n.huongTam = Math.atan2(y.n.goc.position.x - x.n.goc.position.x, y.n.goc.position.z - x.n.goc.position.z);
        }
        cuocNoi.push({ ng: [a, b], cau, i: -1, het: 0 });
    };
    const ketThucNoi = (c) => {
        for (const p of c.ng) { if (dangNoi.has(p.id)) noi(p, null); p.n.huongTam = null; }
        cuocNoi.splice(cuocNoi.indexOf(c), 1);
    };
    const coTheNoi = (n) => !n.dangDi && n.trangThai !== 'loi' && n.trangThai !== 'can_xu_ly' && n.trangThai !== 'cho_duyet';
    const troChuyen = (now) => {
        if (!TRO_CHUYEN) return;
        for (const c of [...cuocNoi]) {
            if (c.ng.some(p => !coTheNoi(p.n) || (!p.phu && !nv.has(p.id)))) { ketThucNoi(c); continue; }
            if (now < c.het) continue;
            c.i++;
            if (c.i >= c.cau.length) { ketThucNoi(c); continue; }
            const ai = c.ng[c.i % 2]; const kia = c.ng[(c.i + 1) % 2];
            if (dangNoi.has(kia.id)) noi(kia, null);
            noi(ai, c.cau[c.i]);
            c.het = now + thoiGianCau(c.cau[c.i]) + 300;
        }
        if (now < henNoi || cuocNoi.length >= 2 || !(LOI.thuong.length || LOI.lamViec.length || LOI.cafe.length)) return;
        henNoi = now + 6000 + Math.random() * 8000;
        const ung = [
            ...[...nv.entries()].map(([id, n]) => ({ id, n, phu: false })),
            ...phu.filter(m => !m.phaChe && !m.gac).map(m => ({ id: m.a.id, n: m.n, phu: true })),
        ].filter(p => coTheNoi(p.n) && !trongCuoc(p.id) && !vongCeo.get(p.id)?.buoc)
            .map(p => ({ ...p, x: p.n.goc.position.x, z: p.n.goc.position.z, dao: p.n.daoHienTai }));
        const cap = timCap(ung);
        if (!cap) return;
        // Ngữ cảnh: ở café ⇒ thêm chuyện café · có người đang làm ⇒ chuyện công việc · 17 h–5 h ⇒ chuyện buổi tối
        const gio = layGio().getHours();
        const ds = [
            ...LOI.thuong,
            ...(KHU_CAFE_DAO && cap.every(p => p.dao === KHU_CAFE_DAO) ? LOI.cafe : []),
            ...(cap.some(p => p.n.trangThai === 'dang_chay') ? LOI.lamViec : []),
            ...(gio >= 17 || gio < 5 ? LOI.toi : []),
        ];
        const doan = chonDoan(ds);
        if (doan) batDauNoi(cap[0], cap[1], doan);
    };

    // ── CEO ĐI VÒNG (CEO không ngồi im một chỗ cả ngày): cứ 40–70 s, khi đang rảnh / đang chạy, CEO rời bàn,
    //    ghé 1–2 nhân viên ĐANG LÀM (đứng ở lối đi sau ghế, nhìn vào màn hình 4–6 s), rồi ra café NGỒI một ghế trống (pha chế tự
    //    mang cà phê ra) 11–16 s, xong về bàn. Giữ chỗ bàn CEO suốt lúc đi xem; chỉ nhả khi ngồi café (khu CEO chỉ mình CEO dùng).
    //    Tắt bằng `ceoDiDao: false` (en: `chiefWalks: false`); giảm chuyển động ⇒ không đi.
    const KHU_CEO = khuTheoLoai(layout, 'ceo', 'chief');
    const CEO_DI = o.ceoDiDao !== false && !giamChuyenDong && !!KHU_CEO;
    /** id CEO → { nghiBan: ngồi bàn bao lâu rồi mới đi, ngoiTu: lúc ngồi xuống, buoc: [{ loai:'xem', cho } | { loai:'cafe' }] | null, i, den, nghi } */
    const vongCeo = new Map();
    const coTheDiVong = (a, n) => CEO_DI && a?.vaiTro === 'chief' && (n.trangThai === 'ranh' || n.trangThai === 'dang_chay') && khuDich(a, layout) === KHU_CEO;
    const lenVong = (id) => {
        const lam = [...nv.entries()]
            .filter(([k, x]) => k !== id && x.trangThai === 'dang_chay' && !x.dangDi && x.dich?.ban && x.dich.loi?.length === 2)
            .sort(() => Math.random() - 0.5)
            .slice(0, 1 + Math.floor(Math.random() * 2));
        const buoc = lam.map(([k, x]) => {
            const [dau, sau] = x.dich.loi;   // lối đi sau lưng ghế: đầu lối → ngay sau ghế
            // đứng lệch nửa bước bên cạnh, cùng hàng lối đi, quay mặt về phía bàn (−z)
            return { loai: 'xem', ai: k, cho: { x: sau.x + 0.5, z: sau.z, dao: x.daoDich, huong: Math.PI, loi: [dau] } };
        });
        if (KHU_CAFE) buoc.push({ loai: 'cafe' });
        return buoc;
    };
    const ceoDiVong = (now) => {
        if (!CEO_DI) return;
        for (const [id, n] of nv) {
            const a = duLieu.get(id);
            if (a?.vaiTro !== 'chief') continue;
            let v = vongCeo.get(id);
            if (!v) { vongCeo.set(id, v = { nghiBan: 12000 + Math.random() * 12000, ngoiTu: 0, buoc: null }); }
            if (!coTheDiVong(a, n) || n.dangDi) { if (!v.buoc) v.ngoiTu = 0; continue; }
            if (!v.buoc) {
                // Thời gian nghỉ tính từ lúc NGỒI XUỐNG bàn (bản đầu tính từ lúc rời café ⇒ đi chậm thì vừa về tới bàn đã đi tiếp)
                if (choNgoiQL.khuCua(id) !== KHU_CEO) continue;
                if (!v.ngoiTu) { v.ngoiTu = now; continue; }
                if (now - v.ngoiTu < v.nghiBan) continue;
                v.buoc = lenVong(id); v.i = -1; v.den = 0; v.nghi = 0; v.ngoiTu = 0;
            }
            if (v.i >= 0) {                                   // đã tới bước hiện tại ⇒ đứng / ngồi đủ lâu rồi mới đi tiếp
                if (!v.den) {
                    v.den = now;
                    // Tới sau lưng nhân viên ⇒ hỏi han (đứng đủ lâu cho hết câu chuyện)
                    const b0 = v.buoc[v.i]; const nb = b0?.loai === 'xem' && nv.get(b0.ai);
                    if (TRO_CHUYEN && nb && nb.trangThai === 'dang_chay' && (LOI.ceo.length || LOI.ceoViec.length)) {
                        // Một nửa số lần CEO hỏi ĐÚNG việc nhân viên đang làm ("Tối ưu quảng cáo" sao rồi?)
                        const viec = duLieu.get(b0.ai)?.viec;
                        const theoViec = viec && LOI.ceoViec.length && (Math.random() < 0.5 || !LOI.ceo.length);
                        const cau = theoViec ? dienViec(chonDoan(LOI.ceoViec), viec) : chonDoan(LOI.ceo);
                        batDauNoi({ id, n, phu: false }, { id: b0.ai, n: nb, phu: false }, cau);
                        v.nghi = Math.max(v.nghi, cau.reduce((t, c) => t + thoiGianCau(c) + 300, 0) + 500);
                    }
                    continue;
                }
                if (now - v.den < v.nghi) continue;
            }
            v.i++; v.den = 0;
            const b = v.buoc[v.i];
            if (!b) {                                          // hết vòng ⇒ về bàn CEO
                const kq = choNgoiQL.lay(KHU_CEO, id);
                if (kq) diToiCho(n, kq.cho, false);
                v.buoc = null; v.ngoiTu = 0; v.nghiBan = 40000 + Math.random() * 30000;
                continue;
            }
            if (b.loai === 'xem') { v.nghi = 4000 + Math.random() * 2500; diToiCho(n, b.cho, false); continue; }
            const kq = choNgoiQL.lay(KHU_CAFE, id);            // café hết ghế ⇒ bỏ qua, về bàn ở lượt sau
            if (!kq) { v.nghi = 0; v.den = now; continue; }
            v.nghi = 11000 + Math.random() * 5000;
            diToiCho(n, kq.cho, false);
            if (kq.duoi) choPhuDi(kq.duoi);
        }
    };

    // Chỉ SO_BONG_TOI_DA agent đổi trạng thái gần nhất (đang chạy / chờ duyệt, có `viec`) được hiện bóng chữ.
    // lỗi cũng có bóng ("Lỗi · …"), và thứ tự là MỨC NGHIÊM TRỌNG trước (lỗi > chờ duyệt > đang chạy) rồi mới tới mới nhất —
    // bản 1 chỉ theo mới nhất nên một lỗi cũ bị ba việc vặt mới đẩy mất bóng.
    const noiDungBong = (n) => {
        const viec = duLieu.get(n.id)?.viec || '';
        if (n.trangThai === 'loi') return { chu: viec ? `${chu.loi} · ${viec}` : chu.loi, kieu: 'loi' };
        if (n.trangThai === 'can_xu_ly') return { chu: viec ? `${chu.can} · ${viec}` : chu.can, kieu: 'can' };
        if (n.trangThai === 'cho_duyet') return { chu: viec ? `${chu.duyet} · ${viec}` : chu.duyet, kieu: 'duyet' };
        if (n.trangThai === 'dang_chay' && viec) return { chu: viec, kieu: 'chay' };
        return null;
    };
    const chonBong = () => {
        const ung = [...nv.values()]
            .filter(n => noiDungBong(n))
            .sort((x, y) => (UU_TIEN[y.trangThai] - UU_TIEN[x.trangThai]) || ((lucDoi.get(y.id) || 0) - (lucDoi.get(x.id) || 0)))
            .slice(0, SO_BONG_TOI_DA).map(n => n.id);
        for (const n of nv.values()) {
            const b = ung.includes(n.id) ? noiDungBong(n) : null;
            // Đang nói ⇒ câu nói thay bóng VIỆC thường (đang chạy) trong lúc nói; bóng lỗi / cần xử lý / chờ duyệt vẫn ưu tiên
            const c = dangNoi.get(n.id);
            const hien = c && (!b || b.kieu === 'chay') ? { chu: c, kieu: 'chat' } : b;
            n.datBong(hien?.chu || '', hien?.kieu);
        }
        capNhatCoNhan();
    };

    // ── Cỡ nhãn theo pixel ──
    let rong = 1; let cao = 1;
    const pxMoiDonVi = () => (cao / CO_KHUNG) * camera.zoom;
    // Tỉ lệ nhãn: khung NHỎ (thẻ trong trang) ⇒ nhãn co lại tới 75% — nhãn cỡ cố định 11 px che kín cảnh cao 360 px.
    // `tiLeNhan` cho số ⇒ dùng cố định.
    const tiLeNhan = () => (o.tiLeNhan > 0 ? o.tiLeNhan : Math.max(0.78, Math.min(1, cao / 600)));
    const moiNguoi = () => [...nv.values(), ...phu.map(m => m.n)];
    const nguoiTheoId = (id) => (id == null ? null : nv.get(id) || phuTheoId.get(id) || null);
    const capNhatCoNhan = () => {
        const t = tiLeNhan();
        const p = pxMoiDonVi() / t;
        for (const n of moiNguoi()) {
            n.tiLeNhan = t;
            if (n.nhan) capNhatCo(n.nhan, p);
            if (n.bong) capNhatCo(n.bong, p);
        }
        // Points (quầng đèn, khói cà phê) tính cỡ bằng PIXEL với camera trực giao ⇒ cập nhật cùng lúc với nhãn khi zoom / đổi cỡ
        canh.datCoDiem(pxMoiDonVi());
        quanCafe?.datCoDiem(pxMoiDonVi());
    };
    // ── Giải chồng nhãn: chiếu điểm neo trên đầu từng người ra màn hình, đẩy khối đè lên trên, đổi px → đơn vị thế giới ──
    const _a = new THREE.Vector3(); const _b = new THREE.Vector3();
    const giaiChongNhan = () => {
        // Bao nhiêu px màn hình ứng với 1 đơn vị trục Y thế giới (camera nghiêng ⇒ < pxMoiDonVi)
        _a.set(tam.x, 0, tam.z).project(camera); _b.set(tam.x, 1, tam.z).project(camera);
        const pxY = Math.abs(_b.y - _a.y) * cao / 2 || 1;
        const khoi = []; const t = tiLeNhan();
        for (const n of moiNguoi()) {
            const coNhan = n.nhan?.visible; const coBong = !!n.bong;
            if (!coNhan && !coBong) { if (n.dayNhan) n.xepNhan(0); continue; }
            _a.set(n.goc.position.x, n.goc.position.y + n.dinh + 0.05, n.goc.position.z).project(camera);
            if (_a.x < -1.2 || _a.x > 1.2 || _a.y < -1.2 || _a.y > 1.4) continue;   // ngoài khung — khỏi tính
            const pn = coNhan ? n.nhan.userData.px : { w: 0, h: 0 };
            const pb = coBong ? n.bong.userData.px : { w: 0, h: 0 };
            khoi.push({
                id: n.id, x: (_a.x + 1) / 2 * rong, y: (1 - _a.y) / 2 * cao,
                w: Math.max(pn.w, pb.w) * t, h: (pn.h + (coBong ? pb.h + 3 : 0)) * t,
                uuTien: (UU_TIEN[n.trangThai] || 0) + (n.laChief ? 5 : 0),
            });
        }
        const day = giaiChong(khoi, { khe: 3 * t, toiDa: 90 * t });   // khung nhỏ ⇒ nhãn nhỏ ⇒ đẩy ít hơn
        for (const [id, px] of day) nguoiTheoId(id)?.xepNhan(px / pxY, pxY);
    };

    const doiCo = () => {
        rong = Math.max(1, khung.clientWidth); cao = Math.max(1, khung.clientHeight);
        renderer.setSize(rong, cao, false);
        toaSang?.datCo(rong, cao, renderer.getPixelRatio());
        const asp = rong / cao;
        camera.left = (-CO_KHUNG * asp) / 2; camera.right = (CO_KHUNG * asp) / 2;
        camera.top = CO_KHUNG / 2; camera.bottom = -CO_KHUNG / 2;
        camera.updateProjectionMatrix();
        capNhatCoNhan();
        canDraw = true;
    };

    // ── Tương tác: bấm chọn · cuộn phóng to · kéo dời ──
    let keo = null;
    const PHAI = new THREE.Vector3(1, 0, -1).normalize();
    const TRUOC = new THREE.Vector3(-1, 0, -1).normalize();
    const onDown = (e) => {
        if (e.button !== 0) return;   // chuột phải / giữa không kéo (macOS: menu ngữ cảnh nuốt pointerup ⇒ kẹt kéo)
        keo = { x: e.clientX, y: e.clientY, tam: tam.clone(), moved: false };
        tamDich = null;               // người dùng tự kéo ⇒ thôi lướt focus (hai bên giành camera)
    };
    const huyKeo = () => { keo = null; };
    const onMove = (e) => {
        if (!keo || o.dieuKhien === false) return;
        if (!(e.buttons & 1)) { keo = null; return; }   // đã nhả chuột ở ngoài cửa sổ
        const dx = e.clientX - keo.x; const dy = e.clientY - keo.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) keo.moved = true;
        if (!keo.moved) return;
        const p = pxMoiDonVi();
        tam.copy(keo.tam).addScaledVector(PHAI, -dx / p).addScaledVector(TRUOC, (dy / p) * 1.35);
        tam.x = Math.max(-25, Math.min(25, tam.x)); tam.z = Math.max(-25, Math.min(25, tam.z));
        datCamera(); canDraw = true; batVong();
    };
    // Người dưới con trỏ — đo TRÊN MÀN HÌNH: khoảng cách từ con trỏ tới đoạn chân→đầu của từng người. Bản trước raycast phải
    // trúng đúng lưới thân: người ngồi café ở thẻ nhỏ chỉ ~12 px nên rê mãi không trúng, phải bấm mới thấy tên.
    // coPhu = tính cả nhân viên phụ (rê thì có, bấm chọn thì không).
    const _c = new THREE.Vector3(); const _d = new THREE.Vector3();
    const nguoiTai = (clientX, clientY, coPhu = false) => {
        const r = renderer.domElement.getBoundingClientRect();
        const mx = clientX - r.left; const my = clientY - r.top;
        // Ưu tiên 1: con trỏ nằm trong NHÃN TÊN / BÓNG CHỮ đang hiện (khung chữ nhật trên màn hình, neo đáy giữa)
        const t = tiLeNhan();
        const trongNhan = (n, sp) => {
            if (!sp || !sp.visible || !sp.userData.px) return false;
            _c.set(n.goc.position.x, n.goc.position.y + sp.position.y, n.goc.position.z).project(camera);
            const sx = (_c.x + 1) / 2 * r.width; const sy = (1 - _c.y) / 2 * r.height;
            const w = sp.userData.px.w * t; const h = sp.userData.px.h * t;
            return mx >= sx - w / 2 && mx <= sx + w / 2 && my >= sy - h && my <= sy;
        };
        for (const n of nv.values()) if (trongNhan(n, n.nhan) || trongNhan(n, n.bong)) return n.id;
        if (coPhu) for (const m of phu) if (trongNhan(m.n, m.n.nhan)) return m.a.id;
        // Ưu tiên 2: gần đoạn chân → đầu của người
        let tot = null; let min = Math.max(9, 0.42 * pxMoiDonVi());   // bán kính bắt (px)
        const xet = (n, id) => {
            const p = n.goc.position;
            _c.set(p.x, p.y + 0.1, p.z).project(camera); _d.set(p.x, p.y + n.dinh, p.z).project(camera);
            const ax = (_c.x + 1) / 2 * r.width; const ay = (1 - _c.y) / 2 * r.height;
            const bx = (_d.x + 1) / 2 * r.width; const by = (1 - _d.y) / 2 * r.height;
            const dx = bx - ax; const dy = by - ay;
            const k = Math.max(0, Math.min(1, ((mx - ax) * dx + (my - ay) * dy) / (dx * dx + dy * dy || 1)));
            const kc = Math.hypot(mx - (ax + k * dx), my - (ay + k * dy));
            if (kc < min) { min = kc; tot = id; }
        };
        for (const n of nv.values()) xet(n, n.id);
        if (coPhu) for (const m of phu) xet(m.n, m.a.id);
        return tot;
    };
    const onUp = (e) => {
        const daKeo = keo?.moved; keo = null;
        if (daKeo) return;
        if (e.target !== renderer.domElement) return;
        const id = nguoiTai(e.clientX, e.clientY);
        const cu = chon;
        chon = id; capNhatTam();
        canDraw = true; batVong();
        // Bấm chỗ trống khi đang chọn ⇒ onSelect(null) để app đóng bảng thông tin
        if (id != null || cu != null) o.onSelect?.(id);
    };
    // Người đang rê / đang chọn LUÔN hiện nhãn (kể cả rảnh ở café) — xem được tên + model mà café không rối
    const capNhatTam = () => { for (const n of moiNguoi()) n.datHienTam(n.id === reVao || n.id === chon); };
    // Rê chuột: vòng sáng dưới chân + hiện nhãn + con trỏ bàn tay (agent). Dò tối đa ~12 lần/giây, có lượt CUỐI khi chuột dừng
    // (bản trước bỏ qua sự kiện trong 80 ms ⇒ dừng chuột đúng lúc đó là không hiện gì).
    let lanRe = 0; let henRe = 0; let viTriRe = null;
    const doRe = () => {
        henRe = 0;
        if (!viTriRe || keo?.moved || daHuy) return;
        lanRe = performance.now();
        const id = nguoiTai(viTriRe.x, viTriRe.y, true);
        if (id !== reVao) {
            reVao = id; capNhatTam();
            renderer.domElement.style.cursor = id != null && nv.has(id) ? 'pointer' : '';
            canDraw = true; batVong();
        }
    };
    const onHover = (e) => {
        viTriRe = { x: e.clientX, y: e.clientY };
        if (keo?.moved) return;
        const cho = 80 - (performance.now() - lanRe);
        if (cho <= 0) doRe();
        else if (!henRe) henRe = setTimeout(doRe, cho);
    };
    const onLeave = () => { viTriRe = null; clearTimeout(henRe); henRe = 0; if (reVao) { reVao = null; capNhatTam(); renderer.domElement.style.cursor = ''; canDraw = true; batVong(); } };

    // Hai vòng dưới chân: rê (trắng mờ) · chọn (xanh) — 2 lệnh vẽ cố định
    const geoVong = new THREE.RingGeometry(0.36, 0.5, 28);
    geoVong.rotateX(-Math.PI / 2);
    const vongRe = new THREE.Mesh(geoVong, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }));
    const vongChon = new THREE.Mesh(geoVong, new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.95, depthWrite: false }));
    vongRe.renderOrder = vongChon.renderOrder = 3;
    vongRe.visible = vongChon.visible = false;
    scene.add(vongRe, vongChon);
    let reVao = null; let chon = null;
    const datVong = (vong, id) => {
        const n = nguoiTheoId(id);
        vong.visible = !!n;
        if (n) vong.position.set(n.goc.position.x, n.goc.position.y + 0.03, n.goc.position.z);
    };

    // Camera lướt mượt tới đích (focus) thay vì nhảy
    let tamDich = null;
    // zoomCuon: 'luon' (mặc định) — cuộn là phóng; 'ctrl' — chỉ phóng khi giữ Ctrl/⌘, cuộn thường để trang cuộn qua
    // (văn phòng nhúng làm THẺ trong trang dài: bản trước nuốt cuộn ⇒ không cuộn trang được khi chuột nằm trên thẻ).
    const onWheel = (e) => {
        if (o.dieuKhien === false) return;
        if (o.zoomCuon === 'ctrl' && !e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        camera.zoom = Math.max(0.6, Math.min(2.6, camera.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        camera.updateProjectionMatrix(); capNhatCoNhan(); canDraw = true; batVong();
    };
    const el = renderer.domElement;
    // Cảm ứng: kéo ngang = dời camera, kéo dọc vẫn cuộn trang
    if (o.dieuKhien !== false) el.style.touchAction = 'pan-y';
    el.addEventListener('pointerdown', onDown);
    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
    globalThis.addEventListener('pointercancel', huyKeo);
    globalThis.addEventListener('blur', huyKeo);
    el.addEventListener('pointermove', onHover);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });

    // ── Vòng vẽ: ≤ fps, dừng khi tab ẩn / khung khuất ──
    let raf = 0; let lanTruoc = 0; let thayDuoc = true; let canDraw = true; let daHuy = false;
    const khoang = 1000 / fps;
    const vong = (now) => {
        raf = 0;
        if (daHuy) return;
        if (document.hidden || !thayDuoc) return;   // khi hiện lại sẽ gọi batVong()
        raf = requestAnimationFrame(vong);
        if (now - lanTruoc < khoang - 1) return;
        const khoangThat = now - lanTruoc;
        const dt = Math.min(0.1, khoangThat / 1000 || 0);
        lanTruoc = now;
        // Đo nhịp khung khi đang toả sáng: trung bình > 45 ms (< 22 fps) suốt ~3 s ⇒ tắt toả sáng cho đỡ nặng
        if (toaSang && bloomBat && !haCap && khoangThat < 250) {
            emaKhung = emaKhung * 0.9 + khoangThat * 0.1;
            soKhungCham = emaKhung > 45 ? soKhungCham + 1 : 0;
            if (soKhungCham > 90) { haCap = true; canDraw = true; }
        }
        if (!giamChuyenDong) {
            canh.troi(dt);
            langThang(now);
            ceoDiVong(now);
            troChuyen(now);
            for (const n of nv.values()) n.buoc(dt);
            for (const m of phu) m.n.buoc(dt);
            quanCafe?.capNhat(dt);
            canDraw = true;
        }
        if (tamDich) {
            const k = giamChuyenDong ? 1 : Math.min(1, dt * 5);
            tam.lerp(tamDich, k); datCamera(); canDraw = true;
            if (tam.distanceToSquared(tamDich) < 0.0004) { tam.copy(tamDich); tamDich = null; }
        }
        if (canDraw) ve();
        // Giảm chuyển động: vẽ xong thì DỪNG vòng (bản trước vẫn rAF 60 lần/giây không vẽ gì); việc gì cần vẽ lại đều gọi batVong()
        if (giamChuyenDong && !tamDich && !canDraw && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const ve = () => {
        datVong(vongRe, reVao && reVao !== chon ? reVao : null);
        datVong(vongChon, chon);
        giaiChongNhan();
        if (toaSang && bloomBat && !haCap) {
            // Cảnh (không nhãn) qua toả sáng, rồi vẽ CHỒNG nhãn + bóng chữ lên trên — không loé
            camera.layers.disable(LOP_NHAN);
            toaSang.ve();
            camera.layers.set(LOP_NHAN);
            const tuXoa = renderer.autoClear; renderer.autoClear = false;
            renderer.render(scene, camera);
            renderer.autoClear = tuXoa;
            camera.layers.enableAll();
        } else renderer.render(scene, camera);
        canDraw = false;
    };
    const batVong = () => { if (!raf && !daHuy) { lanTruoc = performance.now(); raf = requestAnimationFrame(vong); } };
    const onVisible = () => { if (!document.hidden) batVong(); };
    document.addEventListener('visibilitychange', onVisible);
    const io = new IntersectionObserver((ds) => { thayDuoc = ds.some(x => x.isIntersecting); if (thayDuoc) batVong(); }, { rootMargin: '120px' });
    io.observe(khung);
    // Đổi cỡ CHỜ khung thôi đổi 120 ms rồi mới setSize — setSize mỗi khung lúc đóng/mở sidebar rất nặng
    let henCo = 0;
    const ro = new ResizeObserver(() => {
        const w = khung.clientWidth; const h = khung.clientHeight;
        if (w === rong && h === cao) return;                                  // lần báo đầu tiên khi gắn — cỡ đã đúng
        clearTimeout(henCo);
        if (rong <= 1 || cao <= 1) { doiCo(); batVong(); return; }            // trước đó chưa có cỡ (gắn lúc ẩn) ⇒ làm ngay
        henCo = setTimeout(() => { if (!daHuy) { doiCo(); batVong(); } }, 120);
    });
    ro.observe(khung);
    // Trời + HUD giờ: canh ĐẦU PHÚT (bản trước setInterval 60 s từ lúc tạo ⇒ HUD trễ tới 1 phút)
    let henTroi = 0;
    const henPhut = () => { henTroi = setTimeout(() => { apTroi(); batVong(); henPhut(); }, 60_000 - (Date.now() % 60_000) + 50); };
    henPhut();

    doiCo();
    apTroi();
    batVong();
    if (chatCao) {
        taoToaSang(renderer, scene, camera).then((ts) => {
            if (daHuy) { ts.huy(); return; }
            toaSang = ts; ts.datCo(rong, cao, renderer.getPixelRatio());
            canDraw = true; batVong();
        }).catch(() => { /* không nạp được ⇒ vẫn vẽ thường */ });
    }

    return {
        /** Ảnh chụp danh sách agent. Agent không còn trong danh sách sẽ bị gỡ. */
        setAgents(ds) {
            if (daHuy) return;
            const con = new Set();
            for (const goc of ds || []) {
                const a = chuanHoaAgent(goc, (k) => !!timKhu(layout, k));   // trường tiếng Anh (name, status, room…) ⇒ nội bộ
                if (a?.id == null || a.id === '') continue;
                con.add(a.id);
                duLieu.set(a.id, a);
                apAgent(a);
            }
            for (const [id, n] of nv) {
                if (con.has(id)) continue;
                choNgoiQL.tra(id); scene.remove(n.goc); n.huy(); nv.delete(id); duLieu.delete(id); lucDoi.delete(id);
                if (chon === id) chon = null;
                if (reVao === id) reVao = null;
            }
            chonBong();   // MỘT lần cho cả danh sách (bản trước gọi trong từng apAgent ⇒ O(N²))
            veHud();
            if (giamChuyenDong) quanCafe?.capNhat(0);   // không có vòng hoạt cảnh ⇒ đặt cốc ngay cho khách vừa ngồi
            canDraw = true; batVong();
        },
        /** Sự kiện rời rạc: bat_dau · xong · loi · cho_duyet · duyet. */
        pushEvent(suKien) {
            if (daHuy) return;
            const ev = chuanHoaSuKien(suKien);
            const a = duLieu.get(ev?.agentId);
            if (!a) return;
            const ma = { bat_dau: 'dang_chay', xong: 'ranh', loi: 'loi', cho_duyet: 'cho_duyet', duyet: 'dang_chay', can_xu_ly: 'can_xu_ly' }[ev.loai];
            if (!ma) return;
            const moi = { ...a, trangThai: ma, viec: ev.viec ?? (ma === 'ranh' ? '' : a.viec) };
            duLieu.set(a.id, moi);
            apAgent(moi);
            if (ev.loai === 'xong') nv.get(a.id)?.vui();
            chonBong(); veHud();
            canDraw = true; batVong();
        },
        /** Đưa camera LƯỚT về một agent (giảm chuyển động ⇒ nhảy thẳng). */
        focus(id) {
            if (daHuy) return;
            const n = nv.get(id);
            if (!n) return;
            tamDich = new THREE.Vector3(n.goc.position.x, -1, n.goc.position.z); canDraw = true; batVong();
        },
        /** Chọn một agent (vòng xanh dưới chân, hiện nhãn) — null để bỏ chọn. Không gọi onSelect. */
        select(id) { if (daHuy) return; chon = id != null && nv.has(id) ? id : null; capNhatTam(); canDraw = true; batVong(); },
        /** Đặt mức phóng (0.6–2.6); `tamX/tamZ` = điểm nhìn (tuỳ chọn). */
        setZoom(z, tamX, tamZ) {
            if (daHuy) return;
            camera.zoom = Math.max(0.6, Math.min(2.6, z));
            if (tamX != null && tamZ != null) { tamDich = null; tam.set(tamX, -1, tamZ); datCamera(); }
            camera.updateProjectionMatrix(); capNhatCoNhan(); canDraw = true; batVong();
        },
        /** Tính lại bầu trời ngay (vd app vừa đổi giờ hiển thị) — bình thường tự cập nhật mỗi đầu phút. */
        refreshSky() { if (daHuy) return; apTroi(); batVong(); },
        /** Vị trí hiện tại của một agent (đảo, khu đang giữ chỗ, đang đi hay không) — để app gắn chú thích HTML / kiểm thử. */
        /** Như viTri nhưng khoá tiếng Anh: { x, y, z, island, zone, walking, labelOffset } */
        position(id) { return viTriEn(this.viTri(id)); },
        viTri(id) {
            const n = nv.get(id);
            if (!n) return null;
            const p = n.goc.position;
            return { x: p.x, y: p.y, z: p.z, dao: n.daoHienTai, khu: choNgoiQL.khuCua(id) ?? null, dangDi: n.dangDi, dayNhan: n.dayNhan || 0 };
        },
        /** Thống kê để đo ngân sách hiệu năng. */
        info() { return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, frames: renderer.info.render.frame, agents: nv.size, nhanVienPhu: phu.length, fps, toaSang: !!(toaSang && bloomBat && !haCap), haCap, troChuyen: cuocNoi.map(c => ({ ai: c.ng.map(p => p.id), cau: c.cau[Math.max(0, c.i)] })) }; },
        dispose() {
            if (daHuy) return;
            daHuy = true;
            if (raf) cancelAnimationFrame(raf);
            clearTimeout(henTroi); clearTimeout(henCo); clearTimeout(henRe);
            io.disconnect(); ro.disconnect();
            document.removeEventListener('visibilitychange', onVisible);
            el.removeEventListener('pointerdown', onDown);
            globalThis.removeEventListener('pointermove', onMove);
            globalThis.removeEventListener('pointerup', onUp);
            globalThis.removeEventListener('pointercancel', huyKeo);
            globalThis.removeEventListener('blur', huyKeo);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('pointermove', onHover);
            el.removeEventListener('pointerleave', onLeave);
            geoVong.dispose(); vongRe.material.dispose(); vongChon.material.dispose();
            for (const n of nv.values()) { scene.remove(n.goc); n.huy(); }
            for (const m of phu) { scene.remove(m.n.goc); m.n.huy(); }
            canh.huy();
            quanCafe?.huy();
            toaSang?.huy();
            renderer.dispose();
            // dispose() KHÔNG trả ngữ cảnh WebGL; trình duyệt chỉ cho ~16 cái ⇒ React StrictMode / đổi trang vài lần là cạn. Trả hẳn.
            renderer.forceContextLoss();
            el.remove(); hud?.remove(); chuThich?.remove();
        },
    };
}

export { timDao, timKhu, moTaModel, MAU_HANG };

// ── English names for the helper exports (same functions; results translated to English keys) ──
export const DEFAULT_LAYOUT = LAYOUT_MAC_DINH;
export const findIsland = timDao;
export const findZone = timKhu;
export const dayPhase = buoiTheoGio;
export const clockLabel = nhanGio;
/** Sky colours for a moment: { top, bottom, sun, intensity, lightsOn, night, phase, hour } */
export function skyAt(luc) {
    const t = bauTroi(luc);
    return { top: t.tren, bottom: t.duoi, sun: t.nang, intensity: t.manh, lightsOn: t.den, night: t.dem, phase: t.buoi, hour: t.gio };
}
/** Model badge info: { short, provider, logo, name } */
export function describeModel(m) {
    const k = moTaModel(m && typeof m === 'object' ? { ...m, ngan: m.ngan ?? m.short, hang: m.hang ?? m.provider, ten: m.ten ?? m.name } : m);
    return k ? { short: k.ngan, provider: k.hang, logo: k.logo, name: k.ten } : null;
}
/** Provider badge colours: { anthropic: { color, letter }, … } */
export const PROVIDER_COLORS = Object.fromEntries(Object.entries(MAU_HANG).map(([k, v]) => [k, { color: v.mau, letter: v.chu }]));
