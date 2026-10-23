/**
 * TOẢ SÁNG (bloom) cho chế độ chất lượng CAO (toàn màn hình).
 *
 * - Nạp ĐỘNG (chunk riêng): bản thẻ không tải mã hậu kỳ.
 * - UnrealBloomPass tự chạy ở nửa độ phân giải trở xuống (chuỗi mip) ⇒ rẻ hơn nhiều so với toàn khung.
 * - GIỮ ALPHA: canvas trong suốt (trời + đảo xa là nền CSS). Pass gốc cộng cả kênh alpha (AdditiveBlending) ⇒ cả khung thành đục,
 *   mất trời. Đổi sang CustomBlending: màu CỘNG, alpha GIỮ NGUYÊN ⇒ quầng sáng chồng lên nền CSS như mong muốn.
 */
import * as THREE from 'three';

export async function taoToaSang(renderer, scene, camera) {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import('three/examples/jsm/postprocessing/EffectComposer.js'),
        import('three/examples/jsm/postprocessing/RenderPass.js'),
        import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
        import('three/examples/jsm/postprocessing/OutputPass.js'),
    ]);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // strength, radius, threshold — threshold cao: chỉ LED / đèn / màn hình loé, sàn gỗ không nhoè
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.4, 0.62);
    const bm = bloom.blendMaterial;
    bm.blending = THREE.CustomBlending;
    bm.blendEquation = THREE.AddEquation;
    bm.blendSrc = THREE.OneFactor; bm.blendDst = THREE.OneFactor;               // màu: cộng
    bm.blendSrcAlpha = THREE.ZeroFactor; bm.blendDstAlpha = THREE.OneFactor;    // alpha: giữ của cảnh
    bm.needsUpdate = true;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return {
        datCo(w, h, pr) { composer.setPixelRatio(pr); composer.setSize(w, h); },
        ve() { composer.render(); },
        huy() { composer.dispose(); bloom.dispose(); },
    };
}
