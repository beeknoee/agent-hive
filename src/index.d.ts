// agent-hive — type definitions.
// Every public field / option has an English name and its original Vietnamese name; both are accepted.

// ───────────────────────────── Status & events ─────────────────────────────

/** English status names */
export type Status = 'idle' | 'running' | 'awaiting_approval' | 'error' | 'needs_attention' | 'off';
/** Vietnamese status names: ranh = idle · dang_chay = running · cho_duyet = awaiting approval · loi = error · can_xu_ly = needs attention · tat = off */
export type TrangThai = 'ranh' | 'dang_chay' | 'cho_duyet' | 'loi' | 'can_xu_ly' | 'tat';

export type EventType = 'start' | 'done' | 'error' | 'awaiting_approval' | 'approved' | 'needs_attention';
export type LoaiSuKien = 'bat_dau' | 'xong' | 'loi' | 'cho_duyet' | 'duyet' | 'can_xu_ly';

export interface HiveEvent {
    agentId: string;
    /** English event type (or `loai`) */
    type?: EventType | LoaiSuKien;
    /** Vietnamese event type (or `type`) */
    loai?: LoaiSuKien | EventType;
    /** New task text for the bubble (alias `viec`) */
    task?: string;
    viec?: string;
}
/** @deprecated name kept for compatibility — use HiveEvent */
export type SuKien = HiveEvent;

// ───────────────────────────── Agents ─────────────────────────────

export interface Appearance {
    /** 'male' | 'female' (alias `gioi`: 'nam' | 'nu') */
    gender?: 'male' | 'female';
    /** 'light' | 'medium' | 'tan' | 'brown' | 'dark' or a CSS colour (alias `da`) */
    skin?: string;
    /** Partial override is fine (style only or colour only) (alias `toc`) */
    hair?: { style?: 'short' | 'curly' | 'crew' | 'bald' | 'long' | 'bun' | 'ponytail' | 'bob'; color?: 'black' | 'dark-brown' | 'brown' | 'blonde' | 'silver' | 'red' | string };
    /** (alias `trangPhuc`) */
    outfit?: 'shirt' | 'office' | 'technician' | 'security' | 'lab-coat' | 'casual' | 'hoodie' | 'barista';
    /** Top / trousers colour (aliases `ao` / `quan`) */
    shirt?: string;
    pants?: string;
    skirt?: boolean;
    glasses?: boolean;
    /** Body height multiplier, ~1 (alias `cao`) */
    height?: number;
    accessories?: string[];

    // Vietnamese names
    gioi?: 'nam' | 'nu';
    da?: string;
    toc?: { kieu?: 'ngan' | 'xoan' | 'cua' | 'troc' | 'dai' | 'bui' | 'duoi-ngua' | 'bob'; mau?: string };
    trangPhuc?: 'so-mi' | 'van-phong' | 'ky-thuat' | 'bao-ve' | 'blouse' | 'thuong' | 'hoodie' | 'phuc-vu';
    ao?: string;
    quan?: string;
    vay?: boolean;
    phuKien?: string[];
    kinh?: boolean;
    cao?: number;
}
/** @deprecated name kept for compatibility — use Appearance */
export type NgoaiHinh = Appearance;

export interface ModelInfo {
    id?: string;
    /** Display name (alias `ten`) */
    name?: string;
    /** Short badge text — inferred when omitted: Haiku→HK, Sonnet→SN, Opus→OP, … (alias `ngan`) */
    short?: string;
    /** anthropic · openai · google · xai · deepseek · alibaba · khac (alias `hang`) */
    provider?: string;
    /** Logo image URL. No brand logos are bundled; without it a coloured letter tile is drawn */
    logo?: string;
    ten?: string;
    ngan?: string;
    hang?: string;
}
/** @deprecated name kept for compatibility — use ModelInfo */
export type ModelAgent = ModelInfo;

export interface Agent {
    /** Stable id — appearance is generated deterministically from it */
    id: string;
    /** Label text (alias `ten`) */
    name?: string;
    /** (alias `trangThai`) */
    status?: Status | TrangThai;
    /**
     * Room / zone id (alias `phong`). Default layout: customers · marketing · finance · code · infra · qa · lab · bd
     * (Vietnamese ids also work: khach-hang · tai-chinh · ha-tang · thu-vien).
     */
    room?: string;
    /** 'chief' sits at the CEO desk (alias `vaiTro`) */
    role?: 'chief' | 'staff' | 'bot';
    /** Current task shown in a speech bubble, ≤ 40 chars is best (alias `viec`) */
    task?: string;
    /** Model badge: id string (e.g. 'claude-sonnet-5-5') or ModelInfo */
    model?: string | ModelInfo;
    /** Appearance override (alias `ngoaiHinh`) */
    appearance?: Appearance;

    // Vietnamese names
    ten?: string;
    trangThai?: TrangThai | Status;
    phong?: string;
    vaiTro?: 'chief' | 'staff' | 'bot';
    viec?: string;
    ngoaiHinh?: Appearance;
}

// ───────────────────────────── Layout ─────────────────────────────

export interface Island {
    id: string; name: string; x: number; z: number; w: number; d: number;
    /** Octagonal island */
    round?: boolean;
    /** Glass walls (meeting room) */
    glass?: boolean;
    color?: string;
}
export interface Zone {
    id: string;
    /** Island id */
    island: string;
    name?: string;
    type: 'desks' | 'cafe' | 'meeting' | 'podium' | 'ceo' | 'servers' | 'alert';
    x: number; z: number;
    cols?: number; rows?: number;
    color?: string;
}
/** English layout format */
export interface HiveLayout { islands: Island[]; zones: Zone[]; bridges: { from: string; to: string }[] }

/** Internal (Vietnamese) layout format: dao = islands · khu = zones · cau = bridges */
export interface Dao { id: string; ten: string; x: number; z: number; w: number; d: number; tron?: boolean; kinh?: boolean; mau?: string }
export interface Khu { id: string; dao: string; ten?: string; loai: 'ban' | 'cafe' | 'hop' | 'buc' | 'ceo' | 'bao' | 'may'; x: number; z: number; cot?: number; hang?: number; mau?: string }
export interface Layout { dao: Dao[]; khu: Khu[]; cau: { tu: string; den: string }[] }

// ───────────────────────────── UI strings ─────────────────────────────

/** English keys for `labels` */
export interface Labels {
    agents: string; working: string; needAttention: string;
    /** 5 legend entries: working · awaiting approval · error · needs attention · idle */
    legend: string[];
    /** Speech-bubble prefixes */
    error: string; awaitingApproval: string; needsAttention: string;
    /** Suffix of extra-staff labels + role names */
    staff: string;
    roles: Partial<Record<'security' | 'technician' | 'tester' | 'barista' | 'other', string>>;
    /** HUD time-of-day words */
    phases: Partial<Record<'dawn' | 'day' | 'dusk' | 'night', string>>;
}
/** Vietnamese keys for `chu` (same meaning as Labels) */
export interface ChuGiaoDien {
    nhanVien: string; dangLam: string; canXuLy: string; chuThich: string[];
    loi: string; duyet: string; can: string;
    phu: string; vai: Partial<Record<'bao-ve' | 'ky-thuat' | 'blouse' | 'phuc-vu' | 'khac', string>>;
    buoi: Partial<Record<'dawn' | 'day' | 'dusk' | 'night', string>>;
}

// ───────────────────────────── Options ─────────────────────────────

export interface HiveOptions {
    /** UI language: 'vi' (default) | 'en' | 'zh' (Chinese) (alias `ngonNgu`) */
    language?: 'vi' | 'en' | 'zh';
    /** Override individual UI strings (alias `chu`) */
    labels?: Partial<Labels>;
    /** Custom layout — English or internal format. Default: DEFAULT_LAYOUT (vi) / LAYOUT_EN (en) */
    layout?: HiveLayout | Layout;
    /** Real-time shadows — prettier, heavier (alias `bong`) */
    shadows?: boolean;
    /** 'high' = night bloom, lazy-loaded, auto-off on slow machines (alias `chatLuong`: 'cao' | 'thuong') */
    quality?: 'normal' | 'high';
    /** Extra staff without an agent, 0–40, default 10 (alias `nhanVienPhu`) */
    extraStaff?: number;
    /** Status legend, bottom-left, default off (alias `chuThich`) */
    legend?: boolean;
    /** Clock + headcount, top-left, default on */
    hud?: boolean;
    /** Drag to pan, wheel to zoom, default on (alias `dieuKhien`) */
    controls?: boolean;
    /** 'always' (default) | 'ctrl' — zoom only with Ctrl/⌘ + wheel, for cards in a scrolling page (alias `zoomCuon`) */
    wheelZoom?: 'always' | 'ctrl';
    /** Initial zoom, default 1 */
    zoom?: number;
    /** Label scale; default shrinks automatically in short containers (alias `tiLeNhan`) */
    labelScale?: number;
    /** Frame-rate cap, default 30 */
    fps?: number;
    /** Clock used for the sky, default the machine clock (alias `gio`) */
    clock?: () => Date;
    /** The chief (role: 'chief') leaves the CEO desk every 40–70 s to look over working agents' shoulders and have a coffee. Default true (alias `ceoDiDao`) */
    chiefWalks?: boolean;
    /** Now and then two people standing / sitting close together chat with speech bubbles; the chief chats when checking on someone. Default true (alias `troChuyen`) */
    chatter?: boolean;
    /** Initial system status shown on the server racks: 'ok' (green glow) · 'error' (red blinking with yellow) · null (default) (alias `heThong`: 'ok' | 'loi') */
    systemStatus?: 'ok' | 'error' | null;
    /** Replace the chat lines: each entry is a list of lines spoken alternately; `chief` lines start with the chief (alias `loiThoai`: { thuong, ceo }) */
    chatLines?: { casual?: string[][]; work?: string[][]; cafe?: string[][]; evening?: string[][]; chief?: string[][]; /** `{viec}` is replaced by the agent's task */ chiefTask?: string[][] };
    /** Click on an agent ⇒ its id; click on empty space while one is selected ⇒ null */
    onSelect?: (agentId: string | null) => void;

    // Vietnamese names
    ngonNgu?: 'vi' | 'en' | 'zh';
    chu?: Partial<ChuGiaoDien>;
    bong?: boolean;
    chatLuong?: 'thuong' | 'cao';
    nhanVienPhu?: number;
    chuThich?: boolean;
    dieuKhien?: boolean;
    zoomCuon?: 'luon' | 'ctrl';
    tiLeNhan?: number;
    gio?: () => Date;
    ceoDiDao?: boolean;
    troChuyen?: boolean;
    heThong?: 'ok' | 'loi' | null;
    loiThoai?: { thuong?: string[][]; lamViec?: string[][]; cafe?: string[][]; toi?: string[][]; ceo?: string[][]; ceoViec?: string[][] };
}
/** @deprecated name kept for compatibility — use HiveOptions */
export type TuyChon = HiveOptions;

// ───────────────────────────── API ─────────────────────────────

export interface Position { x: number; y: number; z: number; island: string | null; zone: string | null; walking: boolean; labelOffset: number }

export interface AgentHiveApi {
    /** Replace the snapshot; agents missing from the list are removed. Only agents whose status changed move. */
    setAgents(agents: Agent[]): void;
    /** Apply one event without a full snapshot (sets that agent's status; `done` also plays a jump of joy) */
    pushEvent(event: HiveEvent): void;
    /** Smoothly move the camera to an agent */
    focus(agentId: string): void;
    /** Zoom, optionally around a point (world units) */
    setZoom(zoom: number, centerX?: number, centerZ?: number): void;
    /** Highlight ring under an agent — null to clear */
    select(agentId: string | null): void;
    /** Server racks show the system status: 'ok' green glow · 'error' red blinking with yellow · null default look */
    setSystemStatus(status: 'ok' | 'error' | null): void;
    /** Same as setSystemStatus with Vietnamese values: 'ok' | 'loi' | null */
    datHeThong(trangThai: 'ok' | 'loi' | null): void;
    /** Recompute the sky now (e.g. after changing your `clock`) */
    refreshSky(): void;
    /** Current position — null if no such agent */
    position(agentId: string): Position | null;
    /** Same as position() with Vietnamese keys */
    viTri(agentId: string): { x: number; y: number; z: number; dao: string | null; khu: string | null; dangDi: boolean; dayNhan: number } | null;
    /** Render stats */
    info(): { drawCalls: number; triangles: number; frames: number; agents: number; nhanVienPhu: number; fps: number; toaSang: boolean; haCap: boolean; troChuyen: { ai: string[]; cau: string }[] };
    /** Remove everything and release the WebGL context */
    dispose(): void;
}

export function createAgentHive(container: HTMLElement, options?: HiveOptions): AgentHiveApi;

// ───────────────────────────── Helpers ─────────────────────────────

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** Default layout (Vietnamese room names) */
export const DEFAULT_LAYOUT: Layout;
/** Default layout with English room names (used automatically when language: 'en') */
export const LAYOUT_EN: Layout;
/** Default layout with Chinese room names (used automatically when language: 'zh') */
export const LAYOUT_ZH: Layout;
export function findIsland(layout: Layout, id: string): Dao | undefined;
export function findZone(layout: Layout, id: string): Khu | undefined;
/** Sky colours at a moment */
export function skyAt(time?: Date | number): { top: string; bottom: string; sun: string; intensity: number; lightsOn: boolean; night: boolean; phase: DayPhase; hour: number };
/** 'dawn' 5–6:30 · 'day' 6:30–16 · 'dusk' 16–19:30 · 'night' */
export function dayPhase(hour: number): DayPhase;
/** HUD clock text, e.g. "DUSK · 17:42" */
export function clockLabel(time?: Date | number): string;
export function describeModel(model: string | ModelInfo | null | undefined): { short: string; provider: string; logo: string | null; name: string } | null;
export const PROVIDER_COLORS: Record<string, { color: string; letter: string }>;

// Vietnamese names of the helpers
export const LAYOUT_MAC_DINH: Layout;
export function timDao(layout: Layout, id: string): Dao | undefined;
export function timKhu(layout: Layout, id: string): Khu | undefined;
export function bauTroi(luc?: Date | number): { tren: string; duoi: string; nang: string; manh: number; den: boolean; dem: boolean; buoi: DayPhase; gio: number };
export function buoiTheoGio(gio: number): DayPhase;
export function nhanGio(luc?: Date | number): string;
export function moTaModel(model: string | ModelInfo | null | undefined): { ngan: string; hang: string; logo: string | null; ten: string } | null;
export const MAU_HANG: Record<string, { mau: string; chu: string }>;
