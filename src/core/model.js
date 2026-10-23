/**
 * Huy hiệu MODEL cạnh tên nhân viên (hàm THUẦN): nhận diện hãng + tên viết tắt từ id/tên model.
 *
 * Quy ước viết tắt: Haiku → HK · Sonnet → SN · Opus → OP · Luna → luna · Sol → Sol · Terra → Terra.
 * Model khác: lấy đoạn cuối của id, tối đa 8 ký tự.
 *
 * LOGO: repo KHÔNG nhúng logo thương hiệu (giấy phép MIT). App truyền `logo` (URL ảnh logo của chính app); không có thì vẽ
 * ô màu + chữ cái đầu của hãng (màu ở MAU_HANG).
 */

export const MAU_HANG = {
    anthropic: { mau: '#d97757', chu: 'A' },
    openai: { mau: '#10a37f', chu: 'O' },
    google: { mau: '#4285f4', chu: 'G' },
    xai: { mau: '#111827', chu: 'X' },
    deepseek: { mau: '#4d6bfe', chu: 'D' },
    alibaba: { mau: '#ff6a00', chu: 'Q' },
    khac: { mau: '#64748b', chu: '•' },
};

// Tên mã GPT là TỪ TRỌN (giữa - . / _ khoảng trắng hoặc đầu/cuối): `-sol` từng khớp nhầm `my-solution-model` (kiểm thử bắt).
const tu = (w) => new RegExp(`(^|[-_./\\s])${w}($|[-_./\\s\\d])`, 'i');
// Thứ tự có nghĩa: từ khoá cụ thể trước.
const VIET_TAT = [
    [/haiku/i, 'HK', 'anthropic'],
    [/sonnet/i, 'SN', 'anthropic'],
    [/opus/i, 'OP', 'anthropic'],
    [/fable/i, 'FB', 'anthropic'],
    [tu('luna'), 'luna', 'openai'],
    [tu('sol'), 'Sol', 'openai'],
    [tu('terra'), 'Terra', 'openai'],
];

const HANG = [
    [/claude|anthropic|haiku|sonnet|opus|fable/i, 'anthropic'],
    [/gpt|openai|codex|\bo\d\b/i, 'openai'],
    [tu('luna'), 'openai'], [tu('sol'), 'openai'], [tu('terra'), 'openai'],
    [/gemini|gemma|google/i, 'google'],
    [/grok|xai/i, 'xai'],
    [/deepseek/i, 'deepseek'],
    [/qwen|alibaba/i, 'alibaba'],
];

/**
 * @param {string | { id?:string, ten?:string, ngan?:string, hang?:string, logo?:string } | null | undefined} model
 * @returns {{ ngan:string, hang:string, logo:string|null, ten:string } | null}
 */
export function moTaModel(model) {
    if (!model) return null;
    const o = typeof model === 'string' ? { id: model } : model;
    const chuoi = `${o.id || ''} ${o.ten || ''}`.trim();
    if (!chuoi && !o.ngan) return null;
    const vt = VIET_TAT.find(([re]) => re.test(chuoi));
    const hang = o.hang || vt?.[2] || HANG.find(([re]) => re.test(chuoi))?.[1] || 'khac';
    let ngan = o.ngan || vt?.[1];
    if (!ngan) {
        const cuoi = String(o.ten || o.id).split(/[/\s]/).filter(Boolean).pop() || '';
        ngan = cuoi.length > 8 ? cuoi.slice(0, 8) : cuoi;
    }
    return { ngan, hang, logo: o.logo || null, ten: o.ten || o.id || ngan };
}
