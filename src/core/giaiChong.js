/**
 * Giải chồng nhãn trong KHÔNG GIAN MÀN HÌNH (hàm thuần, kiểm thử được).
 *
 * Mỗi khối = nhãn tên (+ bóng chữ nếu có) neo ở ĐÁY GIỮA ngay trên đầu nhân vật. Khối ưu tiên cao xếp trước, giữ nguyên chỗ;
 * khối sau mà đè lên khối đã xếp thì bị đẩy LÊN (y màn hình giảm) vừa đủ để hết đè. Đẩy tối đa `toiDa` px — quá thì chịu đè
 * (người đứng sát nhau trong café: thà đè một chút còn hơn nhãn bay lên tận trời, xa khỏi người của nó).
 *
 * @param {Array<{ id:string, x:number, y:number, w:number, h:number, uuTien:number }>} khoi  x,y = điểm neo (px, y hướng xuống)
 * @param {{ khe?: number, toiDa?: number }} o
 * @returns {Map<string, number>} id → số px đã đẩy lên (≥ 0)
 */
export function giaiChong(khoi, o = {}) {
    const khe = o.khe ?? 3;
    const toiDa = o.toiDa ?? 90;
    const daXep = [];
    const kq = new Map();
    const xep = [...khoi].sort((a, b) => b.uuTien - a.uuTien || b.y - a.y);   // ưu tiên cao trước, rồi người gần camera (y lớn) trước
    for (const k of xep) {
        const trai = k.x - k.w / 2; const phai = k.x + k.w / 2;
        let day = 0;
        for (let vong = 0; vong < 12; vong++) {
            const tren = k.y - k.h - day; const duoi = k.y - day;
            let can = 0;
            for (const r of daXep) {
                if (phai <= r.trai || trai >= r.phai) continue;           // không chung cột ngang
                if (duoi <= r.tren - khe || tren >= r.duoi + khe) continue; // không chung hàng dọc
                can = Math.max(can, duoi - (r.tren - khe));                  // đẩy lên tới sát trên khối r
            }
            if (!can) break;
            day += can;
            if (day > toiDa) { day = toiDa; break; }
        }
        kq.set(k.id, day);
        daXep.push({ trai, phai, tren: k.y - k.h - day, duoi: k.y - day });
    }
    return kq;
}

/** Thứ tự ưu tiên hiển thị theo trạng thái. */
export const UU_TIEN = { can_xu_ly: 4, loi: 4, cho_duyet: 3, dang_chay: 2, ranh: 1, tat: 0 };
