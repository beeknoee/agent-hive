/**
 * <AgentHive> — lớp React mỏng bọc createAgentHive.
 *
 *   <AgentHive agents={ds} onSelect={id => …} style={{ height: 480 }} />
 *
 * Tuỳ chọn khởi tạo (layout, fps, bong, nhanVienPhu…) chỉ đọc LẦN ĐẦU — đổi thì đổi `key` để dựng lại.
 * `agents` đổi ⇒ gọi setAgents (rẻ: chỉ nhân vật đổi trạng thái mới đi lại). `onReady(api)` để gọi pushEvent / focus / setZoom.
 *
 * Viết bằng React.createElement, KHÔNG JSX: gói xuất thẳng mã nguồn, file .jsx thô làm vỡ Next.js không bật
 * transpilePackages, webpack không babel node_modules, hoặc SSR chạy bằng Node.
 */
import React, { useEffect, useRef } from 'react';
import { createAgentHive } from './index.js';

export function AgentHive({ agents, onSelect, onReady, className, style, ...tuyChon }) {
    const khung = useRef(null);
    const api = useRef(null);
    const chon = useRef(onSelect);
    chon.current = onSelect;
    const dsRef = useRef(agents);
    dsRef.current = agents;

    useEffect(() => {
        const h = createAgentHive(khung.current, { ...tuyChon, onSelect: (id) => chon.current?.(id) });
        api.current = h;
        if (dsRef.current) h.setAgents(dsRef.current);   // StrictMode dựng lại ⇒ nạp ngay danh sách hiện tại
        onReady?.(h);
        return () => { h.dispose(); api.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { if (agents) api.current?.setAgents(agents); }, [agents]);

    return React.createElement('div', { ref: khung, className, style: { position: 'relative', width: '100%', height: 420, ...style } });
}

export default AgentHive;
