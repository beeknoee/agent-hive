/**
 * TRÒ CHUYỆN giữa nhân viên (hàm thuần + lời thoại mẫu). index.js lo nhịp: cứ 6–14 s ghép 2 người đang đứng / ngồi GẦN nhau
 * (cùng đảo, cách 0,5–2,6 đơn vị) nói qua lại 2–3 câu bằng bóng chữ kiểu `chat`; CEO ghé bàn thì hỏi han.
 *
 * Lời thoại chia theo NGỮ CẢNH (mỗi ngôn ngữ ~65 đoạn thường + ~21 đoạn CEO):
 *   thuong   chuyện chung — luôn dùng được
 *   lamViec  chuyện công việc — khi một trong hai người đang làm (dang_chay)
 *   cafe     chuyện ở café — khi cả hai đang ở đảo café
 *   toi      chuyện buổi tối — từ 17 h tới 5 h sáng
 *   ceo      CEO hỏi han khi ghé bàn (CEO nói trước)
 *   ceoViec  CEO hỏi ĐÚNG việc đang làm — `{viec}` được thay bằng việc của nhân viên đó
 * App đổi lời thoại bằng tuỳ chọn `loiThoai` (en: `chatLines`) — { thuong, lamViec, cafe, toi, ceo, ceoViec }.
 */

/** Lời thoại mẫu: mỗi đoạn là các câu NÓI LUÂN PHIÊN (người 1, người 2, người 1…). */
export const LOI_THOAI = {
    vi: {
        thuong: [
            ['Hôm nay trời đẹp nhỉ', 'Ừ, làm xong ra ban công'],
            ['Cuối tuần đi đâu không?', 'Chắc ở nhà ngủ bù 😴'],
            ['Tối qua xem bóng đá không?', 'Có, trận hay ghê', 'Pha cuối căng thật'],
            ['Nghe nói sắp có bản mới', 'Đang chạy thử rồi đấy', 'Hóng ghê'],
            ['Họp lúc mấy giờ nhỉ?', '3 giờ, phòng họp kính'],
            ['Có ai thấy sạc của mình không?', 'Hình như để ở phòng họp'],
            ['Hôm nay đông người ghê', 'Cuối tháng mà'],
            ['Bạn dùng phím tắt gì nhiều nhất?', 'Ctrl+Z, không thì toang 😅'],
            ['Mới đọc bài về agent hay lắm', 'Gửi link mình xem với', 'Ok, gửi rồi đó'],
            ['Hôm nay mấy giờ về?', 'Xong việc là về'],
            ['Mạng hôm nay ổn không?', 'Sáng hơi chập chờn, giờ ổn rồi'],
            ['Tuần sau nghỉ lễ đúng không?', 'Ừ, được 2 ngày'],
            ['Ai đặt cây mới ở bồn hoa thế?', 'Bảo vệ mang lên đấy', 'Xanh mát ghê'],
            ['Dạo này bận không?', 'Bận nhưng vui'],
            ['Tuần này học được gì mới?', 'Cách viết prompt gọn hơn', 'Chia sẻ đi!'],
            ['Đèn ở đây đẹp ghê', 'Tối lên còn đẹp hơn'],
            ['Mai họp tổng kết đấy', 'Nhớ rồi, đã chuẩn bị số liệu'],
            ['Sinh nhật ai tuần này nhỉ?', 'Hình như bạn bên QA', 'Góp tiền mua bánh nhé'],
            ['Bàn phím mới gõ sướng không?', 'Êm lắm, gõ cả ngày không mỏi'],
            ['Hôm nay ai trực tối?', 'Bot trực, người nghỉ 😄'],
            ['Phòng họp còn trống không?', 'Còn, chiều trống hết'],
            ['Trông bạn hôm nay tươi thế', 'Ngủ đủ 8 tiếng đấy'],
            ['Kế hoạch quý sau xong chưa?', 'Đang lên, mai gửi bản nháp'],
            ['Đi thang máy hay đi bộ?', 'Đi bộ cho khoẻ'],
            ['Có ai muốn trà sữa không?', 'Cho mình một ly!', 'Mình nữa!'],
        ],
        lamViec: [
            ['Deploy xong chưa?', 'Xong rồi, test xanh hết', 'Tuyệt!'],
            ['Báo cáo tuần gửi chưa?', 'Chiều nay mình gửi'],
            ['Model mới nhanh thật', 'Ừ, token/giây tăng gấp đôi'],
            ['Ticket hôm nay nhiều không?', 'Ổn, gần hết rồi'],
            ['Review giúp mình PR này nhé?', 'Ok, 5 phút nữa nhé'],
            ['Log này lạ quá', 'Gửi mình xem', 'À, do cache cũ'],
            ['Test chạy bao lâu?', 'Khoảng 3 phút'],
            ['Khách hỏi tính năng mới', 'Ghi vào danh sách nhé'],
            ['Quota model còn nhiều không?', 'Còn khoảng 60%'],
            ['Lỗi hôm qua sửa chưa?', 'Sửa rồi, đang theo dõi'],
            ['Chiến dịch mới chạy sao rồi?', 'Lượt nhấp tăng 20%', 'Ngon!'],
            ['Dữ liệu tháng này đủ chưa?', 'Thiếu 2 ngày, đang bù'],
            ['Cái này nên dùng model nào?', 'Thử bản nhỏ trước cho rẻ'],
            ['Bug này khó tái hiện quá', 'Bật log chi tiết thử xem'],
            ['Hoá đơn tháng này khớp chưa?', 'Khớp hết rồi'],
            ['Prompt mới ổn không?', 'Trả lời gọn hơn hẳn'],
            ['Máy chủ hôm nay êm không?', 'RAM hơi cao, vẫn ổn'],
            ['Sao lưu chạy chưa?', 'Chạy lúc 2 giờ sáng rồi'],
            ['Bài viết mới đăng chưa?', 'Hẹn giờ 9 giờ tối'],
            ['Cần mình hỗ trợ gì không?', 'Xem giúp phần số liệu nhé', 'Ok luôn'],
        ],
        cafe: [
            ['Cà phê hôm nay ngon ghê', 'Pha chế mới pha đấy'],
            ['Bạn uống gì?', 'Bạc xỉu ít đá', 'Mình đen đá'],
            ['Nghỉ 5 phút cái đã', 'Chuẩn, đầu óc cần thở'],
            ['Bánh này ngon không?', 'Ngon, thử đi'],
            ['Uống mấy ly rồi?', 'Ly thứ ba rồi 😅'],
            ['Hôm nay có món mới', 'Matcha latte, ngon lắm'],
            ['Ngồi đây view đẹp ghê', 'Nhìn ra mây luôn'],
            ['Cà phê không đường à?', 'Ừ, đang giảm cân'],
            ['Pha chế làm nhanh ghê', 'Tay nghề lên rồi'],
            ['Cuối giờ làm ly nữa không?', 'Thôi, tối khó ngủ'],
            ['Nhạc ở đây chill ghê', 'Ai chọn playlist vậy?', 'Pha chế đấy'],
            ['Ghế này êm ghê', 'Ngồi là không muốn dậy'],
        ],
        toi: [
            ['Sắp tan làm chưa?', 'Xong nốt việc này là về'],
            ['Tối nay ăn gì?', 'Lẩu nhé?', 'Chốt!'],
            ['Muộn rồi, về nghỉ đi', 'Ừ, mai tính tiếp'],
            ['Còn ở lại à?', 'Chờ job chạy xong'],
            ['Tối nay trực không?', 'Không, có bot trực rồi'],
            ['Trời tối nhanh ghê', 'Đèn văn phòng bật hết rồi'],
            ['Mai đi làm sớm không?', '8 giờ có mặt'],
            ['Hôm nay mệt ghê', 'Về ngủ sớm đi'],
        ],
        ceo: [
            ['Tiến độ thế nào rồi?', 'Sắp xong rồi sếp!', 'Tốt lắm 👍'],
            ['Có vướng gì không?', 'Dạ ổn ạ', 'Cần gì cứ báo nhé'],
            ['Làm tốt lắm!', 'Cảm ơn sếp!'],
            ['Nhớ nghỉ tay uống nước nhé', 'Dạ vâng ạ'],
            ['Hôm nay chạy được bao nhiêu rồi?', 'Gần trăm lượt rồi sếp', 'Giỏi!'],
            ['Số liệu tuần này sao?', 'Tăng đều sếp ạ', 'Giữ phong độ nhé'],
            ['Cần thêm người hỗ trợ không?', 'Tạm đủ ạ'],
            ['Có ý tưởng gì mới không?', 'Có, mai em trình bày', 'Tốt, chờ đấy'],
            ['Khách có phản hồi gì không?', 'Toàn khen sếp ạ', 'Tuyệt vời!'],
            ['Đừng làm quá sức nhé', 'Dạ em biết rồi'],
            ['Chỗ này chạy ổn định chưa?', 'Ổn định 3 ngày nay rồi'],
            ['Có gì cần anh duyệt không?', 'Chiều em gửi ạ'],
            ['Hôm nay ai làm tốt nhất?', 'Cả đội đều cố ạ', 'Thế mới là đội!'],
            ['Chi phí model tháng này sao?', 'Trong ngân sách ạ', 'Tốt'],
            ['Cố lên, sắp xong rồi', 'Dạ, chiến tiếp ạ'],
        ],
        ceoViec: [
            ['"{viec}" sao rồi?', 'Đang làm ạ, sắp xong', 'Tốt 👍'],
            ['"{viec}" có khó không?', 'Hơi khó nhưng ổn ạ'],
            ['"{viec}" bao giờ xong?', 'Chừng 15 phút nữa sếp'],
            ['Xong "{viec}" báo anh nhé', 'Dạ vâng ạ'],
            ['"{viec}" cần thêm gì không?', 'Đủ rồi sếp ạ'],
            ['Ưu tiên "{viec}" trước nhé', 'Dạ rõ!'],
        ],
    },
    zh: {
        thuong: [
            ['今天天气真好', '忙完去阳台透透气'],
            ['周末有安排吗？', '在家补觉 😴'],
            ['昨晚看球了吗？', '看了，太精彩了', '最后那球真险'],
            ['听说新版本要来了', '已经在测试了', '好期待'],
            ['几点开会？', '三点，玻璃会议室'],
            ['有人看到我的充电器吗？', '好像在会议室'],
            ['今天人好多', '月底嘛'],
            ['你最常用哪个快捷键？', 'Ctrl+Z，不然就完了 😅'],
            ['刚看了篇讲 agent 的好文', '发我看看', '发你了'],
            ['今天几点下班？', '忙完就走'],
            ['今天网络稳吗？', '早上有点卡，现在好了'],
            ['下周放假对吧？', '对，放两天'],
            ['花坛的新植物谁放的？', '保安搬上来的', '看着真舒服'],
            ['最近忙吗？', '忙但开心'],
            ['这周学到什么新东西？', '把提示词写得更简洁', '分享一下！'],
            ['这里的灯真好看', '晚上更好看'],
            ['明天开总结会', '记得，数据准备好了'],
            ['这周谁过生日？', '好像是 QA 的同事', '一起买蛋糕吧'],
            ['新键盘好用吗？', '手感很好，打一天不累'],
            ['今晚谁值班？', '机器人值班，人休息 😄'],
            ['会议室空着吗？', '空着，下午都空'],
            ['你今天气色真好', '睡够八小时了'],
            ['下季度计划做好了吗？', '在写，明天发草稿'],
            ['坐电梯还是走楼梯？', '走楼梯，锻炼身体'],
            ['有人要奶茶吗？', '给我来一杯！', '我也要！'],
        ],
        lamViec: [
            ['部署好了吗？', '好了，测试全绿', '太棒了！'],
            ['周报发了吗？', '下午发'],
            ['新模型真快', '每秒 token 翻倍了'],
            ['今天工单多吗？', '还好，快处理完了'],
            ['帮我看下这个 PR？', '好，五分钟后'],
            ['这个日志好奇怪', '发我看看', '哦，是旧缓存'],
            ['测试要跑多久？', '大概三分钟'],
            ['客户问新功能', '记到需求列表里'],
            ['模型额度还多吗？', '还剩六成左右'],
            ['昨天的 bug 修了吗？', '修了，在观察'],
            ['新活动效果怎样？', '点击涨了 20%', '漂亮！'],
            ['这个月数据齐了吗？', '少两天，在补'],
            ['这个该用哪个模型？', '先试小模型，便宜'],
            ['这个 bug 很难复现', '开详细日志试试'],
            ['这个月发票对上了吗？', '全对上了'],
            ['新提示词效果如何？', '回答简洁多了'],
            ['服务器今天稳吗？', '内存有点高，还行'],
            ['备份跑了吗？', '凌晨两点跑完了'],
            ['新文章发了吗？', '定时晚上九点'],
            ['需要我帮忙吗？', '帮我看下数据', '没问题'],
        ],
        cafe: [
            ['今天的咖啡真香', '咖啡师刚冲的'],
            ['你喝什么？', '少冰拿铁', '我要冰美式'],
            ['先歇五分钟', '对，脑子要透透气'],
            ['这个蛋糕好吃吗？', '好吃，尝尝'],
            ['喝第几杯了？', '第三杯了 😅'],
            ['今天有新品', '抹茶拿铁，很好喝'],
            ['这里风景真好', '能看到云海'],
            ['咖啡不加糖？', '嗯，在减肥'],
            ['咖啡师手真快', '手艺见长'],
            ['下班前再来一杯？', '算了，晚上睡不着'],
            ['这里的音乐真放松', '谁选的歌单？', '咖啡师'],
            ['这椅子真舒服', '坐下就不想起来'],
        ],
        toi: [
            ['快下班了吗？', '忙完这个就走'],
            ['今晚吃什么？', '火锅？', '就这么定了！'],
            ['不早了，回去休息吧', '好，明天再说'],
            ['还没走？', '等任务跑完'],
            ['今晚值班吗？', '不用，有机器人值班'],
            ['天黑得真快', '办公室灯都亮了'],
            ['明天早到吗？', '八点到'],
            ['今天好累', '早点回去睡吧'],
        ],
        ceo: [
            ['进展怎么样？', '快完成了，老板！', '干得好 👍'],
            ['有什么卡住的吗？', '一切顺利', '需要帮忙就说'],
            ['做得不错！', '谢谢老板！'],
            ['记得休息喝水', '好的'],
            ['今天跑了多少次？', '快一百次了', '厉害！'],
            ['这周数据怎么样？', '稳步上升', '保持住'],
            ['需要加人手吗？', '暂时够了'],
            ['有什么新想法吗？', '有，明天汇报', '好，期待'],
            ['客户有什么反馈？', '都是好评', '太好了！'],
            ['别太累了', '知道了'],
            ['这块稳定了吗？', '稳定三天了'],
            ['有要我审批的吗？', '下午发给您'],
            ['今天谁表现最好？', '大家都很努力', '这才是团队！'],
            ['这个月模型费用如何？', '在预算内', '很好'],
            ['加油，快完成了', '好的，继续冲'],
        ],
        ceoViec: [
            ['“{viec}”怎么样了？', '在做，快好了', '好 👍'],
            ['“{viec}”难吗？', '有点难，但能搞定'],
            ['“{viec}”什么时候好？', '大概十五分钟'],
            ['“{viec}”做完告诉我', '好的'],
            ['“{viec}”还需要什么吗？', '够了，老板'],
            ['先做“{viec}”', '明白！'],
        ],
    },
    en: {
        thuong: [
            ['Lovely weather today', 'Balcony break later?'],
            ['Any weekend plans?', 'Catching up on sleep 😴'],
            ['Did you watch the match?', 'Yes, what a game', 'That last goal!'],
            ['Heard a new release is coming', 'Already testing it', 'Can\'t wait'],
            ['When is the meeting?', '3 pm, glass room'],
            ['Anyone seen my charger?', 'Maybe in the meeting room'],
            ['Busy office today', 'End of the month'],
            ['Favourite shortcut?', 'Ctrl+Z, obviously 😅'],
            ['Read a great post on agents', 'Send me the link', 'Sent!'],
            ['What time are you off today?', 'When this is done'],
            ['Is the network OK today?', 'Flaky this morning, fine now'],
            ['Holiday next week, right?', 'Yep, two days'],
            ['Who brought the new plant?', 'Security did', 'Looks great'],
            ['Busy lately?', 'Busy but fun'],
            ['Learned anything new?', 'Writing tighter prompts', 'Share it!'],
            ['Love the lights here', 'Even better at night'],
            ['Review meeting tomorrow', 'Got it, numbers are ready'],
            ['Whose birthday is it?', 'Someone from QA', 'Let\'s get a cake'],
            ['How\'s the new keyboard?', 'So smooth, no tired hands'],
            ['Who\'s on call tonight?', 'The bots are 😄'],
            ['Is the meeting room free?', 'All afternoon'],
            ['You look fresh today', 'Slept a full 8 hours'],
            ['Next quarter plan ready?', 'Draft tomorrow'],
            ['Lift or stairs?', 'Stairs, for the steps'],
            ['Anyone want bubble tea?', 'Me please!', 'Me too!'],
        ],
        lamViec: [
            ['Is the deploy done?', 'Yep, all tests green', 'Nice!'],
            ['Sent the weekly report?', 'This afternoon'],
            ['The new model is fast', 'Twice the tokens per second'],
            ['Many tickets today?', 'Fine, almost done'],
            ['Can you review my PR?', 'Sure, in 5 minutes'],
            ['This log looks odd', 'Show me', 'Ah, stale cache'],
            ['How long do the tests take?', 'About 3 minutes'],
            ['Customer asked for a feature', 'Add it to the list'],
            ['Much model quota left?', 'Around 60%'],
            ['Is yesterday\'s bug fixed?', 'Fixed, watching it'],
            ['How\'s the new campaign?', 'Clicks up 20%', 'Great!'],
            ['Is this month\'s data complete?', 'Two days missing, backfilling'],
            ['Which model for this?', 'Try the small one first'],
            ['Can\'t reproduce this bug', 'Turn on verbose logs'],
            ['Invoices matched?', 'All matched'],
            ['How\'s the new prompt?', 'Much shorter answers'],
            ['Servers calm today?', 'RAM a bit high, fine'],
            ['Did the backup run?', 'At 2 am, all good'],
            ['New post published?', 'Scheduled for 9 pm'],
            ['Need a hand?', 'Check the numbers for me?', 'On it'],
        ],
        cafe: [
            ['Great coffee today', 'The barista just made it'],
            ['What are you having?', 'Iced latte', 'Black for me'],
            ['Five-minute break', 'Exactly, brain needs air'],
            ['Is the cake good?', 'Really good, try it'],
            ['Which cup is that?', 'Third one 😅'],
            ['New drink on the menu', 'Matcha latte, so good'],
            ['Nice view from here', 'Right above the clouds'],
            ['No sugar?', 'Cutting down'],
            ['The barista is quick', 'Getting better every day'],
            ['One more before we leave?', 'No, I won\'t sleep'],
            ['Chill music here', 'Who picks the playlist?', 'The barista'],
            ['Comfy chairs', 'Hard to get up again'],
        ],
        toi: [
            ['Heading home soon?', 'Right after this'],
            ['Dinner plans?', 'Hotpot?', 'Deal!'],
            ['It\'s late, go rest', 'Yeah, tomorrow then'],
            ['Still here?', 'Waiting for a job to finish'],
            ['On call tonight?', 'No, the bots are'],
            ['Gets dark so fast', 'All the lights are on'],
            ['In early tomorrow?', 'By 8'],
            ['Long day', 'Get some sleep'],
        ],
        ceo: [
            ['How is it going?', 'Almost done, boss!', 'Great work 👍'],
            ['Anything blocking you?', 'All good', 'Ping me if needed'],
            ['Nice job!', 'Thanks!'],
            ['Remember to take a break', 'Will do'],
            ['How many runs today?', 'Close to a hundred', 'Impressive!'],
            ['How are this week\'s numbers?', 'Steadily up', 'Keep it going'],
            ['Need more help?', 'We\'re fine for now'],
            ['Any new ideas?', 'Yes, presenting tomorrow', 'Looking forward'],
            ['Any customer feedback?', 'All positive', 'Excellent!'],
            ['Don\'t overdo it', 'Got it'],
            ['Is this stable now?', 'Stable for 3 days'],
            ['Anything for me to approve?', 'Sending it this afternoon'],
            ['Who did best today?', 'The whole team', 'That\'s a team!'],
            ['Model costs this month?', 'Within budget', 'Good'],
            ['Keep going, almost there', 'On it!'],
        ],
        ceoViec: [
            ['How is "{viec}" going?', 'Almost done', 'Great 👍'],
            ['Is "{viec}" tricky?', 'A bit, but fine'],
            ['When will "{viec}" be done?', 'About 15 minutes'],
            ['Tell me when "{viec}" is done', 'Will do'],
            ['Need anything for "{viec}"?', 'All set'],
            ['Do "{viec}" first', 'Got it!'],
        ],
    },
};

/** Các NGỮ CẢNH lời thoại (khoá trong LOI_THOAI[ngôn ngữ]). */
export const NGU_CANH = ['thuong', 'lamViec', 'cafe', 'toi', 'ceo', 'ceoViec'];

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

/**
 * Bộ chọn đoạn hội thoại KHÔNG LẶP GẦN: nhớ các đoạn vừa dùng (một nửa tổng số đoạn đã thấy) và bỏ qua chúng khi còn đoạn khác.
 * `chon(ds)` — ds = mảng đoạn (gộp từ các ngữ cảnh); trả một đoạn hoặc null.
 */
export function taoBoChon({ ngauNhien = Math.random } = {}) {
    const ganDay = [];
    const thay = new Set();
    return function chon(ds) {
        if (!ds?.length) return null;
        for (const d of ds) thay.add(d[0]);
        const conLai = ds.filter(d => !ganDay.includes(d[0]));
        const nguon = conLai.length ? conLai : ds;
        const d = nguon[Math.floor(ngauNhien() * nguon.length)];
        ganDay.push(d[0]);
        while (ganDay.length > Math.max(1, Math.floor(thay.size / 2))) ganDay.shift();
        return d;
    };
}

/** Thay `{viec}` trong đoạn CEO bằng việc (cắt gọn 22 ký tự cho bóng chữ khỏi dài). */
export function dienViec(doan, viec) {
    const v = String(viec || '').trim();
    const ngan = v.length > 22 ? `${v.slice(0, 21)}…` : v;
    return doan.map(c => c.replace('{viec}', ngan));
}

/** Thời gian hiện một câu (ms): 2,4 s + 45 ms mỗi ký tự, tối đa 4,5 s. */
export const thoiGianCau = (cau) => Math.min(4500, 2400 + String(cau || '').length * 45);
