// Demo with FAKE data: 24 agents + a chief changing status all the time, plus 10 extra staff walking around.
// Uses the English API; the Vietnamese field names (ten, trangThai, phong, viec…) work the same way.
import { createAgentHive } from '../src/index.js';

// URL flags: ?lang=vi (Vietnamese UI, default English) · ?bloom (night bloom) · ?hour=17.7 (fixed clock, 17:42)
// (?cao and ?gio=17.7 are accepted as aliases of ?bloom and ?hour)
const q = new URLSearchParams(location.search);
const VI = q.get('lang') === 'vi';
const hourParam = q.get('hour') ?? q.get('gio');

const ROOMS = ['customers', 'marketing', 'finance', 'code', 'infra', 'qa', 'lab'];
const NAMES = {
    customers: ['Support Bot', 'Ticket Triage', 'Refund Helper', 'Chat Care'],
    marketing: ['Ads Optimizer', 'SEO Writer', 'Social Poster', 'Video Hunter', 'Newsletter'],
    finance: ['Invoice Matcher', 'Cash Flow', 'Tax Helper'],
    code: ['Deploy Bot', 'Code Review', 'Bug Fixer', 'Test Runner'],
    infra: ['Infra Watch', 'Router Ops', 'Backup Bot'],
    qa: ['API Quality', 'Eval Runner'],
    lab: ['Memory Keeper', 'Doc Indexer', 'Researcher'],
};
const TASKS_EN = {
    customers: ['Answer 12 tickets', 'Triage complaints', 'Refund order #4821'],
    marketing: ['Tune ad campaign', 'Write SEO article', 'Post 3 social updates', 'Find trending videos'],
    finance: ['Match October invoices', 'Bank reconciliation', 'Cash-flow report'],
    code: ['Deploy backend v2.3', 'Review PR #118', 'Fix login bug', 'Run 412 tests'],
    infra: ['Check server RAM', 'Rotate API keys', 'Back up database'],
    qa: ['Measure latency of 40 models', 'Run eval suite'],
    lab: ['Index documents', 'Summarize 20 papers', 'Learn from feedback'],
};
const TASKS_VI = {
    customers: ['Trả lời 12 ticket', 'Phân loại khiếu nại', 'Hoàn tiền đơn #4821'],
    marketing: ['Tối ưu chiến dịch Ads', 'Viết bài SEO', 'Đăng 3 bài mạng xã hội', 'Săn video xu hướng'],
    finance: ['Ghép hoá đơn tháng 10', 'Đối soát ngân hàng', 'Báo cáo dòng tiền'],
    code: ['Deploy backend v2.3', 'Review PR #118', 'Sửa lỗi đăng nhập', 'Chạy 412 test'],
    infra: ['Kiểm RAM máy chủ', 'Xoay khoá API', 'Sao lưu database'],
    qa: ['Đo độ trễ 40 model', 'Chạy bộ eval'],
    lab: ['Lập chỉ mục tài liệu', 'Tóm tắt 20 bài báo', 'Học từ phản hồi'],
};
const TASKS = VI ? TASKS_VI : TASKS_EN;

// Fake model ids — a real app passes the model each agent uses (and a `logo` URL if it has one)
const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5', 'gpt-6.1-luna', 'gpt-6.1-sol', 'gpt-6.1-terra'];
const agents = [{ id: 'chief', name: 'Chief AI', role: 'chief', status: 'running', model: 'claude-opus-5-5' }];
let m = 0;
for (const room of ROOMS) for (const name of NAMES[room]) {
    agents.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, room, status: 'idle', model: MODELS[m++ % MODELS.length] });
}

let fixedHour = hourParam != null && Number.isFinite(Number(hourParam)) ? Number(hourParam) : null;
const hive = createAgentHive(document.getElementById('hive'), {
    language: VI ? 'vi' : 'en',
    shadows: true,
    legend: true,
    quality: q.has('bloom') || q.has('cao') ? 'high' : 'normal',
    extraStaff: 10,
    clock: () => {
        if (fixedHour == null) return new Date();
        const d = new Date(); d.setHours(Math.floor(fixedHour), Math.round((fixedHour % 1) * 60), 0, 0); return d;
    },
    onSelect: (id) => {
        const el = document.getElementById('chon');
        const a = agents.find(x => x.id === id);
        if (!a) { el.style.display = 'none'; return; }   // clicked empty space ⇒ close
        hive.focus(id);
        el.style.display = 'block';
        // textContent, not innerHTML: names and tasks are app data — never inject them as HTML
        const rows = VI
            ? [a.name, `Phòng: ${a.room}`, `Model: ${a.model || '—'}`, `Trạng thái: ${a.status}`, a.task && `Việc: ${a.task}`]
            : [a.name, `Room: ${a.room}`, `Model: ${a.model || '—'}`, `Status: ${a.status}`, a.task && `Task: ${a.task}`];
        el.replaceChildren(...rows.filter(Boolean).map((t, i) => { const d = document.createElement('div'); d.textContent = t; if (!i) d.style.fontWeight = '700'; return d; }));
    },
});

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Start with about half of the team running
for (const a of agents.slice(1)) if (Math.random() < 0.5) { a.status = 'running'; a.task = pick(TASKS[a.room]); }
hive.setAgents(agents);

// Simulation: every tick one random agent changes status
setInterval(() => {
    const a = pick(agents.slice(1));
    const r = Math.random();
    if (a.status === 'running') {
        if (r < 0.6) { hive.pushEvent({ agentId: a.id, type: 'done' }); a.status = 'idle'; a.task = ''; return; }
        a.status = r < 0.8 ? 'awaiting_approval' : 'error';
    } else if (a.status === 'awaiting_approval' || a.status === 'error') {
        a.status = 'running';
    } else {
        a.status = 'running'; a.task = pick(TASKS[a.room]);
    }
    hive.setAgents(agents);
}, 1500);

// Time-of-day buttons + stats line
document.documentElement.lang = VI ? 'vi' : 'en';
const BUTTONS = VI ? { '': 'TỰ ĐỘNG', 9: 'SÁNG', 17.7: 'CHIỀU', 22: 'ĐÊM' } : { '': 'AUTO', 9: 'DAY', 17.7: 'DUSK', 22: 'NIGHT' };
for (const b of document.querySelectorAll('[data-hour]')) {
    b.textContent = BUTTONS[b.dataset.hour];
    b.classList.toggle('on', fixedHour == null ? b.dataset.hour === '' : Number(b.dataset.hour) === fixedHour && b.dataset.hour !== '');
    b.addEventListener('click', () => {
        document.querySelectorAll('[data-hour]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        fixedHour = b.dataset.hour === '' ? null : Number(b.dataset.hour);
        hive.refreshSky();
    });
}
setInterval(() => {
    const i = hive.info();
    document.getElementById('info').textContent = VI
        ? `draw calls ${i.drawCalls} · tam giác ${i.triangles.toLocaleString('vi-VN')} · agent ${i.agents} · phụ ${i.nhanVienPhu} · ≤${i.fps} fps`
        : `draw calls ${i.drawCalls} · triangles ${i.triangles.toLocaleString('en-US')} · agents ${i.agents} · staff ${i.nhanVienPhu} · ≤${i.fps} fps`;
}, 1000);

window.__hive = hive;
