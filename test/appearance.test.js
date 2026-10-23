import test from 'node:test';
import assert from 'node:assert/strict';
import { ngoaiHinh, MAU_DA, TRANG_PHUC } from '../src/core/appearance.js';

test('cùng id ⇒ cùng ngoại hình (ổn định giữa các lần tải)', () => {
    assert.deepEqual(ngoaiHinh({ id: 'ads-optimizer', phong: 'marketing' }), ngoaiHinh({ id: 'ads-optimizer', phong: 'marketing' }));
});

test('200 nhân viên đủ đa dạng: cả nam lẫn nữ, ≥ 4 màu da, ≥ 5 loại trang phục, ≥ 6 kiểu tóc', () => {
    const PHONG = ['khach-hang', 'marketing', 'tai-chinh', 'code', 'ha-tang', 'qa', 'thu-vien', undefined];
    const ds = Array.from({ length: 200 }, (_, i) => ngoaiHinh({ id: `nv-${i}`, phong: PHONG[i % PHONG.length] }));
    assert.deepEqual(new Set(ds.map(x => x.gioi)), new Set(['nam', 'nu']));
    assert.ok(new Set(ds.map(x => x.da)).size >= 4);
    assert.ok(new Set(ds.map(x => x.trangPhuc)).size >= 5);
    assert.ok(new Set(ds.map(x => x.toc.kieu)).size >= 6);
});

test('phòng kéo trang phục: Machine Deck chủ yếu áo kỹ thuật, QA chủ yếu blouse', () => {
    const dem = (phong, loai) => Array.from({ length: 100 }, (_, i) => ngoaiHinh({ id: `${phong}-${i}`, phong })).filter(x => x.trangPhuc === loai).length;
    assert.ok(dem('ha-tang', 'ky-thuat') >= 50);
    assert.ok(dem('qa', 'blouse') >= 50);
});

test('ghi đè được + bảo vệ + chief', () => {
    const h = ngoaiHinh({ id: 'x', ngoaiHinh: { gioi: 'nu', da: 'den', trangPhuc: 'ky-thuat' } });
    assert.equal(h.gioi, 'nu'); assert.equal(h.da, MAU_DA.den); assert.equal(h.trangPhuc, 'ky-thuat');
    assert.equal(ngoaiHinh({ id: 'g', vaiTro: 'bao-ve' }).trangPhuc, 'bao-ve');
    assert.ok(ngoaiHinh({ id: 'c', vaiTro: 'chief' }).phuKien.includes('cavat'));
    for (const k of Object.keys(TRANG_PHUC)) assert.ok(TRANG_PHUC[k].ao.length > 0);
});
