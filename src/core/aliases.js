/**
 * English API (pure functions). The engine works with its original Vietnamese field names internally; everything public can
 * also be written in English and is translated here at the entry points (createAgentHive options, setAgents, pushEvent,
 * custom layouts). Both spellings are accepted; when both are given the Vietnamese one wins (it is the internal value).
 *
 * API tiếng Anh: lõi vẫn dùng tên tiếng Việt; mọi chỗ công khai nhận thêm tên tiếng Anh và được dịch ở đây.
 */

/** status (English) → trangThai */
export const STATUS = {
    idle: 'ranh', running: 'dang_chay', awaiting_approval: 'cho_duyet', error: 'loi', needs_attention: 'can_xu_ly', off: 'tat',
};
/** event type (English) → loai */
export const EVENT = {
    start: 'bat_dau', done: 'xong', error: 'loi', awaiting_approval: 'cho_duyet', approved: 'duyet', needs_attention: 'can_xu_ly',
};
/** English room ids of the default layout → zone ids */
export const ROOM = {
    customers: 'khach-hang', finance: 'tai-chinh', infra: 'ha-tang', lab: 'thu-vien', 'ai-lab': 'thu-vien', meeting: 'hop',
    cafe: 'cafe', marketing: 'marketing', code: 'code', qa: 'qa', bd: 'bd', chief: 'chief',
};
const OUTFIT = { shirt: 'so-mi', office: 'van-phong', suit: 'van-phong', technician: 'ky-thuat', security: 'bao-ve', 'lab-coat': 'blouse', casual: 'thuong', 't-shirt': 'thuong', hoodie: 'hoodie', barista: 'phuc-vu' };
const HAIR = { short: 'ngan', curly: 'xoan', crew: 'cua', bald: 'troc', long: 'dai', bun: 'bui', ponytail: 'duoi-ngua', bob: 'bob' };
const HAIR_COLOR = { black: 'den', 'dark-brown': 'nauDam', brown: 'nau', blonde: 'vang', silver: 'bac', red: 'do' };
const SKIN = { light: 'sang', medium: 'vang', tan: 'ngam', brown: 'nau', dark: 'den' };
const ZONE_TYPE = { desks: 'ban', cafe: 'cafe', meeting: 'hop', podium: 'buc', ceo: 'ceo', servers: 'may', alert: 'bao' };
const QUALITY = { high: 'cao', normal: 'thuong' };
const WHEEL = { always: 'luon', ctrl: 'ctrl' };

const co = (o, k) => o != null && o[k] !== undefined;
/** Copy `en` → `vi` when the Vietnamese key is absent; optional value translation table. */
function chep(dich, nguon, en, vi, bang) {
    if (co(nguon, vi) || !co(nguon, en)) return;
    const v = nguon[en];
    dich[vi] = bang && typeof v === 'string' ? (bang[v] ?? v) : v;
}

function appearance(a) {
    if (!a || typeof a !== 'object') return a;
    const o = { ...a };
    if (!co(a, 'gioi') && co(a, 'gender')) o.gioi = a.gender === 'female' ? 'nu' : a.gender === 'male' ? 'nam' : a.gender;
    chep(o, a, 'skin', 'da', SKIN);
    chep(o, a, 'outfit', 'trangPhuc', OUTFIT);
    chep(o, a, 'shirt', 'ao'); chep(o, a, 'pants', 'quan'); chep(o, a, 'skirt', 'vay');
    chep(o, a, 'glasses', 'kinh'); chep(o, a, 'height', 'cao'); chep(o, a, 'accessories', 'phuKien');
    if (!co(a, 'toc') && a.hair && typeof a.hair === 'object') {
        o.toc = {};
        chep(o.toc, a.hair, 'style', 'kieu', HAIR);
        chep(o.toc, a.hair, 'color', 'mau', HAIR_COLOR);
    }
    return o;
}

function model(m) {
    if (!m || typeof m !== 'object') return m;
    const o = { ...m };
    chep(o, m, 'short', 'ngan'); chep(o, m, 'provider', 'hang'); chep(o, m, 'name', 'ten');
    return o;
}

/**
 * Agent with English fields → internal agent. `coKhu(id)` (optional) tells whether the layout has that zone: an English room id
 * (`finance`) is only mapped to the default zone (`tai-chinh`) when the layout has no zone called `finance` itself.
 */
export function chuanHoaAgent(a, coKhu) {
    if (!a || typeof a !== 'object') return a;
    const o = { ...a };
    chep(o, a, 'name', 'ten');
    chep(o, a, 'status', 'trangThai', STATUS);
    chep(o, a, 'task', 'viec');
    chep(o, a, 'role', 'vaiTro');
    chep(o, a, 'room', 'phong');
    if (o.trangThai && STATUS[o.trangThai]) o.trangThai = STATUS[o.trangThai];
    if (typeof o.phong === 'string' && ROOM[o.phong] && !(coKhu?.(o.phong))) o.phong = ROOM[o.phong];
    if (!co(a, 'ngoaiHinh') && co(a, 'appearance')) o.ngoaiHinh = appearance(a.appearance);
    if (o.model) o.model = model(o.model);
    return o;
}

/** Event with English fields → internal event ({ agentId, loai, viec }). */
export function chuanHoaSuKien(ev) {
    if (!ev || typeof ev !== 'object') return ev;
    const o = { ...ev };
    chep(o, ev, 'type', 'loai', EVENT);
    chep(o, ev, 'task', 'viec');
    if (o.loai && EVENT[o.loai]) o.loai = EVENT[o.loai];
    return o;
}

/** English layout ({ islands, zones, bridges }) → internal layout ({ dao, khu, cau }). Internal layouts pass through. */
export function chuanHoaLayout(l) {
    if (!l || typeof l !== 'object' || l.dao) return l;
    return {
        dao: (l.islands || []).map(d => {
            const o = { ...d }; chep(o, d, 'name', 'ten'); chep(o, d, 'round', 'tron'); chep(o, d, 'glass', 'kinh'); chep(o, d, 'color', 'mau');
            return o;
        }),
        khu: (l.zones || []).map(k => {
            const o = { ...k }; chep(o, k, 'island', 'dao'); chep(o, k, 'name', 'ten'); chep(o, k, 'type', 'loai', ZONE_TYPE);
            chep(o, k, 'cols', 'cot'); chep(o, k, 'rows', 'hang'); chep(o, k, 'color', 'mau');
            return o;
        }),
        cau: (l.bridges || []).map(c => ({ tu: c.tu ?? c.from, den: c.den ?? c.to })),
    };
}

/** English UI-string overrides (`labels`) → internal `chu`. */
export function chuanHoaChu(l) {
    if (!l || typeof l !== 'object') return l;
    const o = {};
    const K = { agents: 'nhanVien', working: 'dangLam', needAttention: 'canXuLy', legend: 'chuThich', error: 'loi', awaitingApproval: 'duyet', needsAttention: 'can', staff: 'phu' };
    for (const [k, v] of Object.entries(l)) {
        if (k === 'roles' && v && typeof v === 'object') {
            const R = { security: 'bao-ve', technician: 'ky-thuat', tester: 'blouse', barista: 'phuc-vu', other: 'khac' };
            o.vai = Object.fromEntries(Object.entries(v).map(([r, t]) => [R[r] || r, t]));
        } else if (k === 'phases') o.buoi = v;
        else o[K[k] || k] = v;
    }
    return o;
}

/** English options → internal options for createAgentHive. */
export function chuanHoaTuyChon(t = {}) {
    const o = { ...t };
    chep(o, t, 'language', 'ngonNgu');
    chep(o, t, 'shadows', 'bong');
    chep(o, t, 'quality', 'chatLuong', QUALITY);
    chep(o, t, 'extraStaff', 'nhanVienPhu');
    chep(o, t, 'legend', 'chuThich');
    chep(o, t, 'controls', 'dieuKhien');
    chep(o, t, 'wheelZoom', 'zoomCuon', WHEEL);
    chep(o, t, 'labelScale', 'tiLeNhan');
    chep(o, t, 'clock', 'gio');
    chep(o, t, 'chiefWalks', 'ceoDiDao');
    chep(o, t, 'chatter', 'troChuyen');
    if (!co(t, 'loiThoai') && t.chatLines && typeof t.chatLines === 'object') o.loiThoai = { thuong: t.chatLines.casual, ceo: t.chatLines.chief };
    if (!co(t, 'chu') && co(t, 'labels')) o.chu = chuanHoaChu(t.labels);
    if (o.layout) o.layout = chuanHoaLayout(o.layout);
    return o;
}

/** Internal position (viTri) → English keys. */
export const viTriEn = (p) => (p ? { x: p.x, y: p.y, z: p.z, island: p.dao, zone: p.khu, walking: p.dangDi, labelOffset: p.dayNhan } : null);
