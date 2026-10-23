import test from 'node:test';
import assert from 'node:assert/strict';
import { moTaModel } from '../src/core/model.js';

test('viết tắt theo quy ước HK / SN / OP / luna / Sol / Terra', () => {
    assert.equal(moTaModel('claude-haiku-5-5').ngan, 'HK');
    assert.equal(moTaModel('claude-sonnet-5-5').ngan, 'SN');
    assert.equal(moTaModel('claude-opus-5-5').ngan, 'OP');
    assert.equal(moTaModel('gpt-6.1-luna').ngan, 'luna');
    assert.equal(moTaModel('gpt-6.1-sol').ngan, 'Sol');
    assert.equal(moTaModel('gpt-6.1-terra').ngan, 'Terra');
    assert.equal(moTaModel('Sonnet').ngan, 'SN');
    assert.equal(moTaModel('Luna').ngan, 'luna');
});

test('nhận diện hãng', () => {
    assert.equal(moTaModel('claude-opus-5-5').hang, 'anthropic');
    assert.equal(moTaModel('gpt-6.1-sol').hang, 'openai');
    assert.equal(moTaModel('Terra').hang, 'openai');
    assert.equal(moTaModel('gemini-3-pro').hang, 'google');
    assert.equal(moTaModel('deepseek-v4').hang, 'deepseek');
});

test('"solution" không bị nhận nhầm là Sol', () => {
    assert.notEqual(moTaModel('my-solution-model').ngan, 'Sol');
});

test('model lạ: lấy đoạn cuối ≤ 8 ký tự; ghi đè được ngan/hang/logo; rỗng ⇒ null', () => {
    assert.equal(moTaModel('mistral/large').ngan, 'large');
    const m = moTaModel({ id: 'x', ngan: 'XL', hang: 'openai', logo: '/logo.svg' });
    assert.deepEqual([m.ngan, m.hang, m.logo], ['XL', 'openai', '/logo.svg']);
    assert.equal(moTaModel(null), null);
    assert.equal(moTaModel(''), null);
});
