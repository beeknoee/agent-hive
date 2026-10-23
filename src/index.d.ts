/** can_xu_ly = cần chủ ra tay (vd tin nhắn khách bot không trả lời được) — cùng lỗi ra đứng quanh bồn hoa giữa, chấm đỏ nháy */
export type TrangThai = 'ranh' | 'dang_chay' | 'cho_duyet' | 'loi' | 'can_xu_ly' | 'tat';

export interface NgoaiHinh {
    gioi?: 'nam' | 'nu';
    /** 'sang' | 'vang' | 'ngam' | 'nau' | 'den' hoặc mã màu */
    da?: string;
    /** Ghi đè một phần được (chỉ kiểu hoặc chỉ màu) */
    toc?: { kieu?: 'ngan' | 'xoan' | 'cua' | 'troc' | 'dai' | 'bui' | 'duoi-ngua' | 'bob'; mau?: string };
    trangPhuc?: 'so-mi' | 'van-phong' | 'ky-thuat' | 'bao-ve' | 'blouse' | 'thuong' | 'hoodie';
    ao?: string;
    quan?: string;
    vay?: boolean;
    phuKien?: string[];
    kinh?: boolean;
    cao?: number;
}

export interface ModelAgent {
    id?: string;
    ten?: string;
    /** Viết tắt hiện cạnh tên (mặc định tự suy: Haiku→HK, Sonnet→SN, Opus→OP, luna, Sol, Terra…) */
    ngan?: string;
    /** anthropic · openai · google · xai · deepseek · alibaba · khac */
    hang?: string;
    /** URL ảnh logo (repo không nhúng logo thương hiệu; không có ⇒ ô màu hãng + chữ cái) */
    logo?: string;
}

export interface Agent {
    id: string;
    /** Nhãn viên thuốc trên đầu */
    ten: string;
    /** id khu: khach-hang · marketing · tai-chinh · code · ha-tang · qa · thu-vien · bd (layout mặc định) */
    phong?: string;
    vaiTro?: 'chief' | 'staff' | 'bot';
    trangThai: TrangThai;
    /** Bóng chữ khi đang chạy / chờ duyệt (≤ 40 ký tự) */
    viec?: string;
    ngoaiHinh?: NgoaiHinh;
    /** Model đang dùng — hiện [logo] viết-tắt nhỏ cạnh tên. Chuỗi id (vd 'claude-sonnet-5-5') hoặc đối tượng */
    model?: string | ModelAgent;
}

export interface SuKien {
    agentId: string;
    loai: 'bat_dau' | 'xong' | 'loi' | 'cho_duyet' | 'duyet' | 'can_xu_ly';
    viec?: string;
}

export interface Dao { id: string; ten: string; x: number; z: number; w: number; d: number; tron?: boolean; kinh?: boolean; mau?: string }
export interface Khu { id: string; dao: string; ten?: string; loai: 'ban' | 'cafe' | 'hop' | 'buc' | 'ceo' | 'bao' | 'may'; x: number; z: number; cot?: number; hang?: number; mau?: string }
export interface Layout { dao: Dao[]; khu: Khu[]; cau: { tu: string; den: string }[] }

export interface ChuGiaoDien {
    nhanVien: string; dangLam: string; canXuLy: string;
    /** 5 nhãn chú thích theo thứ tự: đang làm · chờ duyệt · lỗi · cần xử lý · rảnh */
    chuThich: string[];
    /** Tiền tố bóng chữ */
    loi: string; duyet: string; can: string;
    /** Hậu tố nhãn nhân viên phụ + tên vai */
    phu: string; vai: Partial<Record<'bao-ve' | 'ky-thuat' | 'blouse' | 'phuc-vu' | 'khac', string>>;
}

export interface TuyChon {
    layout?: Layout;
    /** Trần khung hình (mặc định 30) */
    fps?: number;
    /** Bóng đổ — đẹp hơn, nặng hơn (khuyên bật ở bản toàn màn hình) */
    bong?: boolean;
    /** Đồng hồ HUD "DUSK · 17:42" — DAWN · DAY · DUSK · NIGHT (mặc định bật) */
    hud?: boolean;
    /** Bảng chú thích màu trạng thái góc dưới trái (mặc định tắt) */
    chuThich?: boolean;
    /** Cuộn = phóng, kéo = dời (mặc định bật) */
    dieuKhien?: boolean;
    /** 'luon' (mặc định): cuộn = phóng · 'ctrl': chỉ phóng khi giữ Ctrl/⌘ — dùng khi nhúng làm thẻ trong trang dài */
    zoomCuon?: 'luon' | 'ctrl';
    zoom?: number;
    /** 'cao' = toả sáng ban đêm (nạp động, tự tắt nếu máy chậm) — dùng cho bản toàn màn hình. Mặc định 'thuong' */
    chatLuong?: 'thuong' | 'cao';
    /** Tỉ lệ cỡ nhãn/bóng chữ (mặc định tự: khung cao < 600 px thì co dần tới 0,78) */
    tiLeNhan?: number;
    /** Nhân viên phụ không gắn agent cho sinh động (mặc định 10, tối đa 40) */
    nhanVienPhu?: number;
    /** Đồng hồ cho bầu trời (mặc định giờ máy) */
    gio?: () => Date;
    /** Ngôn ngữ chữ HUD + chú thích: 'vi' (mặc định) · 'en'. Tên đảo / khu đổi qua `layout` */
    ngonNgu?: 'vi' | 'en';
    /** Ghi đè từng chữ giao diện (vd { can: 'Cần anh' } cho tiền tố bóng chữ cần xử lý) — xem bảng CHU ở src/index.js */
    chu?: Partial<ChuGiaoDien>;
    /** Bấm vào một agent ⇒ id; bấm chỗ trống khi đang chọn ⇒ null */
    onSelect?: (agentId: string | null) => void;
}

export interface AgentHiveApi {
    setAgents(agents: Agent[]): void;
    pushEvent(ev: SuKien): void;
    focus(agentId: string): void;
    setZoom(zoom: number, tamX?: number, tamZ?: number): void;
    /** Chọn (vòng xanh dưới chân, hiện nhãn) — null để bỏ chọn */
    select(agentId: string | null): void;
    refreshSky(): void;
    /** Vị trí hiện tại (đơn vị thế giới) — null nếu không có agent đó */
    viTri(agentId: string): { x: number; y: number; z: number; dao: string | null; khu: string | null; dangDi: boolean; dayNhan: number } | null;
    info(): { drawCalls: number; triangles: number; frames: number; agents: number; nhanVienPhu: number; fps: number; toaSang: boolean; haCap: boolean };
    dispose(): void;
}

export function createAgentHive(container: HTMLElement, options?: TuyChon): AgentHiveApi;
export const LAYOUT_MAC_DINH: Layout;
/** Như LAYOUT_MAC_DINH, tên đảo / khu tiếng Anh (mặc định khi ngonNgu: 'en') */
export const LAYOUT_EN: Layout;
export function timDao(layout: Layout, id: string): Dao | undefined;
export function timKhu(layout: Layout, id: string): Khu | undefined;
export type Buoi = 'dawn' | 'day' | 'dusk' | 'night';
export function bauTroi(luc?: Date | number): { tren: string; duoi: string; nang: string; manh: number; den: boolean; dem: boolean; buoi: Buoi; gio: number };
export function nhanGio(luc?: Date | number): string;
export function buoiTheoGio(gio: number): Buoi;
export function moTaModel(model: string | ModelAgent | null | undefined): { ngan: string; hang: string; logo: string | null; ten: string } | null;
export const MAU_HANG: Record<string, { mau: string; chu: string }>;
