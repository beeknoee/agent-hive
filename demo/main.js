// Demo dữ liệu GIẢ: 24 agent + Chief đổi trạng thái liên tục, cộng 10 nhân viên phụ đi lại.
import { createAgentHive } from '../src/index.js';

// ?en ⇒ chữ tiếng Anh · ?cao ⇒ toả sáng ban đêm · ?gio=17.7 ⇒ cố định giờ
const thamSo = new URLSearchParams(location.search);
const EN = thamSo.has('en');

const PHONG = ['khach-hang', 'marketing', 'tai-chinh', 'code', 'ha-tang', 'qa', 'thu-vien'];
const TEN = {
    'khach-hang': ['Support Bot', 'Ticket Triage', 'Refund Helper', 'Chat Care'],
    'marketing': ['Ads Optimizer', 'SEO Writer', 'Social Poster', 'Video Hunter', 'Newsletter'],
    'tai-chinh': ['Invoice Matcher', 'Cash Flow', 'Tax Helper'],
    'code': ['Deploy Bot', 'Code Review', 'Bug Fixer', 'Test Runner'],
    'ha-tang': ['Infra Watch', 'Router Ops', 'Backup Bot'],
    'qa': ['API Quality', 'Eval Runner'],
    'thu-vien': ['Memory Keeper', 'Doc Indexer', 'Researcher'],
};
const VIEC_VI = {
    'khach-hang': ['Trả lời 12 ticket', 'Phân loại khiếu nại', 'Hoàn tiền đơn #4821'],
    'marketing': ['Tối ưu chiến dịch Ads', 'Viết bài SEO', 'Đăng 3 bài mạng xã hội', 'Săn video xu hướng'],
    'tai-chinh': ['Ghép hoá đơn tháng 10', 'Đối soát ngân hàng', 'Báo cáo dòng tiền'],
    'code': ['Deploy backend v2.3', 'Review PR #118', 'Sửa lỗi đăng nhập', 'Chạy 412 test'],
    'ha-tang': ['Kiểm RAM máy chủ', 'Xoay khoá API', 'Sao lưu database'],
    'qa': ['Đo độ trễ 40 model', 'Chạy bộ eval'],
    'thu-vien': ['Lập chỉ mục tài liệu', 'Tóm tắt 20 bài báo', 'Học từ phản hồi'],
};
const VIEC_EN = {
    'khach-hang': ['Answer 12 tickets', 'Triage complaints', 'Refund order #4821'],
    'marketing': ['Tune ad campaign', 'Write SEO article', 'Post 3 social updates', 'Find trending videos'],
    'tai-chinh': ['Match October invoices', 'Bank reconciliation', 'Cash-flow report'],
    'code': ['Deploy backend v2.3', 'Review PR #118', 'Fix login bug', 'Run 412 tests'],
    'ha-tang': ['Check server RAM', 'Rotate API keys', 'Back up database'],
    'qa': ['Measure latency of 40 models', 'Run eval suite'],
    'thu-vien': ['Index documents', 'Summarize 20 papers', 'Learn from feedback'],
};

const VIEC = EN ? VIEC_EN : VIEC_VI;

// Model giả cho demo — app thật truyền id model đang dùng (và `logo` nếu có)
const MODEL = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5', 'gpt-6.1-luna', 'gpt-6.1-sol', 'gpt-6.1-terra'];
const agents = [{ id: 'chief', ten: 'Chief AI', vaiTro: 'chief', phong: 'chief', trangThai: 'dang_chay', model: 'claude-opus-5-5' }];
let iModel = 0;
for (const p of PHONG) for (const t of TEN[p]) agents.push({ id: t.toLowerCase().replace(/\s+/g, '-'), ten: t, phong: p, trangThai: 'ranh', model: MODEL[iModel++ % MODEL.length] });

// ?gio=17.7 ⇒ cố định giờ (chụp ảnh README / xem thử từng buổi); không có ⇒ giờ máy
let gioCo = thamSo.has('gio') && Number.isFinite(Number(thamSo.get('gio'))) ? Number(thamSo.get('gio')) : null;
const hive = createAgentHive(document.getElementById('hive'), {
    bong: true,
    chuThich: true,
    chatLuong: thamSo.has('cao') ? 'cao' : 'thuong',   // demo: thêm ?cao để bật toả sáng
    ngonNgu: EN ? 'en' : 'vi',
    nhanVienPhu: 10,
    gio: () => {
        if (gioCo == null) return new Date();
        const d = new Date(); d.setHours(Math.floor(gioCo), Math.round((gioCo % 1) * 60), 0, 0); return d;
    },
    onSelect: (id) => {
        const el = document.getElementById('chon');
        const a = agents.find(x => x.id === id);
        if (!a) { el.style.display = 'none'; return; }   // bấm chỗ trống ⇒ đóng
        hive.focus(id);
        el.style.display = 'block';
        // textContent, không innerHTML: tên / việc là dữ liệu của app — đừng chèn thẳng thành HTML
        el.replaceChildren(...(EN ? [`${a.ten}`, `Room: ${a.phong}`, `Model: ${a.model || '—'}`, `Status: ${a.trangThai}`, a.viec && `Task: ${a.viec}`]
            : [`${a.ten}`, `Phòng: ${a.phong}`, `Model: ${a.model || '—'}`, `Trạng thái: ${a.trangThai}`, a.viec && `Việc: ${a.viec}`])
            .filter(Boolean).map((t, i) => { const d = document.createElement('div'); d.textContent = t; if (!i) d.style.fontWeight = '700'; return d; }));
    },
});

// Ban đầu: một nửa đang chạy
for (const a of agents.slice(1)) if (Math.random() < 0.5) { a.trangThai = 'dang_chay'; a.viec = pick(VIEC[a.phong]); }
hive.setAgents(agents);

function pick(ds) { return ds[Math.floor(Math.random() * ds.length)]; }

// Mô phỏng: mỗi nhịp đổi trạng thái một agent ngẫu nhiên
setInterval(() => {
    const a = pick(agents.slice(1));
    const r = Math.random();
    if (a.trangThai === 'dang_chay') {
        if (r < 0.6) { hive.pushEvent({ agentId: a.id, loai: 'xong' }); a.trangThai = 'ranh'; a.viec = ''; return; }
        if (r < 0.8) { a.trangThai = 'cho_duyet'; }
        else { a.trangThai = 'loi'; }
    } else if (a.trangThai === 'cho_duyet' || a.trangThai === 'loi') {
        a.trangThai = 'dang_chay';
    } else {
        a.trangThai = 'dang_chay'; a.viec = pick(VIEC[a.phong]);
    }
    hive.setAgents(agents);
}, 1500);

// Nút giờ + bảng đo
if (EN) { document.documentElement.lang = 'en'; const nhan = { '': 'AUTO', 9: 'DAY', 17.7: 'DUSK', 22: 'NIGHT' }; document.querySelectorAll('[data-gio]').forEach(b => { b.textContent = nhan[b.dataset.gio]; }); }
if (gioCo != null) document.querySelectorAll('[data-gio]').forEach(x => x.classList.toggle('on', Number(x.dataset.gio) === gioCo && x.dataset.gio !== ''));
document.querySelectorAll('[data-gio]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-gio]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    gioCo = b.dataset.gio === '' ? null : Number(b.dataset.gio);
    hive.refreshSky();
}));
setInterval(() => {
    const i = hive.info();
    document.getElementById('info').textContent = EN
        ? `draw calls ${i.drawCalls} · triangles ${i.triangles.toLocaleString('en-US')} · agents ${i.agents} · staff ${i.nhanVienPhu} · ≤${i.fps} fps`
        : `draw calls ${i.drawCalls} · tam giác ${i.triangles.toLocaleString('vi-VN')} · agent ${i.agents} · phụ ${i.nhanVienPhu} · ≤${i.fps} fps`;
}, 1000);

window.__hive = hive;
