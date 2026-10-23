/**
 * Quản lý CHỖ NGỒI (hàm thuần, không Three.js — kiểm thử bằng node --test). Tách khỏi index.js để kiểm thử được.
 *
 * - Mỗi khu một dãy chỗ CỐ ĐỊNH (choNgoi chỉ nối thêm chỗ dư, chỗ đã cấp không bao giờ dời).
 * - Nhân viên PHỤ (id tiền tố TIEN_TO_PHU) chỉ ngồi chỗ CHUẨN còn trống, không tạo chỗ dư; agent cần chỗ mà chỗ chuẩn hết ⇒
 *   ĐUỔI một nhân viên phụ (trả id để index.js cho người đó đi chỗ khác). Bản trước dùng chung bể ⇒ phụ chiếm bàn của agent.
 * - lay() lấy chỗ mới TRƯỚC, được rồi mới nhả chỗ cũ (bản trước nhả trước ⇒ khu đích không có thì mất chỗ, người khác ngồi đè).
 */
import { choNgoi, timKhu, timDao } from './layout.js';

export const TIEN_TO_PHU = '__agent-hive:phu:';   // tiền tố riêng ⇒ không đụng id agent thật (bản trước 'npc:0' trùng được)
export const laPhu = (id) => typeof id === 'string' && id.startsWith(TIEN_TO_PHU);

export function taoQuanLyCho(layout) {
    const khu = new Map();      // khuId → { k, dao, chuan, ds, nguoi: (id|null)[] }
    const daNgoi = new Map();   // id → { khu, i }

    const layKhu = (khuId) => {
        let c = khu.get(khuId);
        if (c) return c;
        const k = timKhu(layout, khuId);
        if (!k) return null;
        const dao = timDao(layout, k.dao);
        const ds = choNgoi(k, 1, dao);
        c = { k, dao, chuan: ds.length, ds, nguoi: [] };
        khu.set(khuId, c);
        return c;
    };
    const nha = (id, d = daNgoi.get(id)) => {
        if (!d) return;
        const c = khu.get(d.khu);
        if (c && c.nguoi[d.i] === id) c.nguoi[d.i] = null;
        if (daNgoi.get(id) === d) daNgoi.delete(id);
    };
    const choCua = (c, i) => ({ ...c.ds[i], dao: c.k.dao });

    return {
        /**
         * Lấy chỗ ở khu `khuId` cho `id`. Trả null nếu khu không có / phụ hết chỗ chuẩn (khi đó chỗ cũ GIỮ NGUYÊN).
         * @returns {{ cho: any, duoi: string|null } | null}  duoi = nhân viên phụ vừa bị đuổi khỏi chỗ (nếu có)
         */
        lay(khuId, id) {
            const c = layKhu(khuId);
            if (!c) return null;
            const cu = daNgoi.get(id);
            if (cu?.khu === khuId) return { cho: choCua(c, cu.i), duoi: null };
            const phu = laPhu(id);
            let i = -1; let duoi = null;
            for (let j = 0; j < c.chuan; j++) if (c.nguoi[j] == null) { i = j; break; }
            if (i < 0 && phu) return null;
            if (i < 0) {
                // Chỗ chuẩn hết: đuổi nhân viên phụ đang ngồi chỗ chuẩn (nếu có), không thì ra chỗ dư
                const j = c.nguoi.findIndex((x, n) => n < c.chuan && laPhu(x));
                if (j >= 0) { duoi = c.nguoi[j]; daNgoi.delete(duoi); i = j; }
                else {
                    i = c.nguoi.findIndex((x, n) => n >= c.chuan && x == null);
                    if (i < 0) i = Math.max(c.nguoi.length, c.chuan);
                    if (i >= c.ds.length) c.ds = choNgoi(c.k, i + 1, c.dao);
                }
            }
            c.nguoi[i] = id;
            nha(id, cu);
            daNgoi.set(id, { khu: khuId, i });
            return { cho: choCua(c, i), duoi };
        },
        /** Nhả chỗ của id (gỡ agent / đổi khu). */
        tra(id) { nha(id); },
        /** Khu đang ngồi (hoặc undefined). */
        khuCua(id) { return daNgoi.get(id)?.khu; },
        /** Ai đang giữ chỗ thứ i của khu (mảng id | null theo chỗ) — quán café dùng để biết ghế nào có khách. */
        dsKhu(khuId) { return [...(khu.get(khuId)?.nguoi || [])]; },
        /** Số người ở một khu (để kiểm thử). */
        dem(khuId) { return (khu.get(khuId)?.nguoi || []).filter(x => x != null).length; },
    };
}
