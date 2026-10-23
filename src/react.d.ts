import type { CSSProperties, ReactElement } from 'react';
import type { Agent, AgentHiveApi, TuyChon } from './index';

export interface AgentHiveProps extends Omit<TuyChon, 'onSelect'> {
    agents: Agent[];
    /** Bấm vào một agent ⇒ id; bấm chỗ trống khi đang chọn ⇒ null */
    onSelect?: (agentId: string | null) => void;
    onReady?: (api: AgentHiveApi) => void;
    className?: string;
    style?: CSSProperties;
}

export function AgentHive(props: AgentHiveProps): ReactElement;
export default AgentHive;
