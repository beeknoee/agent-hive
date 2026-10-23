/**
 * <AgentHive> — thin React wrapper around createAgentHive.
 *
 *   <AgentHive agents={list} language="en" onSelect={id => …} style={{ height: 480 }} />
 *
 * Init options (layout, fps, shadows, extraStaff…) are read ONCE — change `key` to re-create. When `agents` changes we call
 * setAgents (cheap: only agents whose status changed move). `onReady(api)` gives access to pushEvent / focus / setZoom.
 *
 * Written with React.createElement, not JSX: the package ships its source as-is, and raw .jsx would break Next.js without
 * transpilePackages, webpack setups that don't run babel on node_modules, or SSR under plain Node.
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
