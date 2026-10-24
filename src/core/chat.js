/**
 * TRÒ CHUYỆN giữa nhân viên (hàm thuần + lời thoại mẫu). index.js lo nhịp: cứ 6–14 s ghép 2 người đang đứng / ngồi GẦN nhau
 * (cùng đảo, cách 0,5–2,6 đơn vị — thường là ở café) nói qua lại 2–4 câu bằng bóng chữ kiểu `chat`; CEO ghé bàn thì hỏi han.
 * App đổi lời thoại bằng tuỳ chọn `loiThoai` (en: `chatLines`) — { thuong: [[câu A, câu B, …], …], ceo: [[…], …] }.
 */

/** Lời thoại mẫu: mỗi đoạn là các câu NÓI LUÂN PHIÊN (người 1, người 2, người 1…). `ceo`: CEO nói trước. */
export const LOI_THOAI = {
    vi: {
        thuong: [
            ['Cà phê hôm nay ngon ghê', 'Pha chế mới pha đấy'],
            ['Deploy xong chưa?', 'Xong rồi, test xanh hết', 'Tuyệt!'],
            ['Trưa nay ăn gì?', 'Bún chả nhé?', 'Chốt!'],
            ['Báo cáo tuần gửi chưa?', 'Chiều nay mình gửi'],
            ['Model mới nhanh thật', 'Ừ, token/giây tăng gấp đôi'],
            ['Cuối tuần đi đâu không?', 'Chắc ở nhà ngủ bù 😴'],
            ['Ticket hôm nay nhiều không?', 'Ổn, gần hết rồi'],
            ['Họp lúc mấy giờ nhỉ?', '3 giờ, phòng họp kính'],
            ['Nghe nói sắp có bản mới', 'Đang chạy thử rồi đấy', 'Hóng ghê'],
            ['Hôm nay trời đẹp nhỉ', 'Ừ, làm xong ra ban công'],
        ],
        ceo: [
            ['Tiến độ thế nào rồi?', 'Sắp xong rồi sếp!', 'Tốt lắm 👍'],
            ['Có vướng gì không?', 'Dạ ổn ạ', 'Cần gì cứ báo nhé'],
            ['Làm tốt lắm!', 'Cảm ơn sếp!'],
            ['Nhớ nghỉ tay uống nước nhé', 'Dạ vâng ạ'],
            ['Hôm nay chạy được bao nhiêu rồi?', 'Gần trăm lượt rồi sếp', 'Giỏi!'],
        ],
    },
    zh: {
        thuong: [
            ['今天的咖啡真香', '咖啡师刚冲的'],
            ['部署好了吗？', '好了，测试全绿', '太棒了！'],
            ['中午吃什么？', '吃面吧？', '就这么定了！'],
            ['周报发了吗？', '下午发'],
            ['新模型真快', '每秒 token 翻倍了'],
            ['周末有安排吗？', '在家补觉 😴'],
            ['今天工单多吗？', '还好，快处理完了'],
            ['几点开会？', '三点，玻璃会议室'],
            ['听说新版本要来了', '已经在测试了', '好期待'],
            ['今天天气真好', '忙完去阳台透透气'],
        ],
        ceo: [
            ['进展怎么样？', '快完成了，老板！', '干得好 👍'],
            ['有什么卡住的吗？', '一切顺利', '需要帮忙就说'],
            ['做得不错！', '谢谢老板！'],
            ['记得休息喝水', '好的'],
            ['今天跑了多少次？', '快一百次了', '厉害！'],
        ],
    },
    en: {
        thuong: [
            ['Great coffee today', 'The barista just made it'],
            ['Is the deploy done?', 'Yep, all tests green', 'Nice!'],
            ['Lunch plans?', 'Noodles?', 'Deal!'],
            ['Sent the weekly report?', 'This afternoon'],
            ['The new model is fast', 'Twice the tokens per second'],
            ['Any weekend plans?', 'Catching up on sleep 😴'],
            ['Many tickets today?', 'Fine, almost done'],
            ['When is the meeting?', '3 pm, glass room'],
            ['Heard a new release is coming', 'Already testing it', 'Can\'t wait'],
            ['Lovely weather today', 'Balcony break later?'],
        ],
        ceo: [
            ['How is it going?', 'Almost done, boss!', 'Great work 👍'],
            ['Anything blocking you?', 'All good', 'Ping me if needed'],
            ['Nice job!', 'Thanks!'],
            ['Remember to take a break', 'Will do'],
            ['How many runs today?', 'Close to a hundred', 'Impressive!'],
        ],
    },
};

/**
 * Tìm MỘT cặp nói chuyện được: cùng đảo, khoảng cách trong [gan, xa]. `ds` = [{ id, x, z, dao }]. `ngauNhien` () => [0,1).
 * Trả [a, b] hoặc null. Duyệt theo thứ tự xáo trộn để không phải lúc nào cũng là hai người đầu danh sách.
 */
export function timCap(ds, { gan = 0.5, xa = 2.6, ngauNhien = Math.random } = {}) {
    const xao = ds.map(d => [ngauNhien(), d]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
    for (let i = 0; i < xao.length; i++) {
        for (let j = i + 1; j < xao.length; j++) {
            const a = xao[i]; const b = xao[j];
            if (!a.dao || a.dao !== b.dao) continue;
            const k = Math.hypot(a.x - b.x, a.z - b.z);
            if (k >= gan && k <= xa) return [a, b];
        }
    }
    return null;
}

/** Thời gian hiện một câu (ms): 2,4 s + 45 ms mỗi ký tự, tối đa 4,5 s. */
export const thoiGianCau = (cau) => Math.min(4500, 2400 + String(cau || '').length * 45);
