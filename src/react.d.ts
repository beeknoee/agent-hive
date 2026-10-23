import type { CSSProperties, ReactElement } from 'react';
import type { Agent, AgentHiveApi, HiveOptions } from './index';

export interface AgentHiveProps extends Omit<HiveOptions, 'onSelect'> {
    agents: Agent[];
    /** Click on an agent ⇒ its id; click on empty space while one is selected ⇒ null */
    onSelect?: (agentId: string | null) => void;
    /** Called once with the imperative API (focus, pushEvent, setZoom, …) */
    onReady?: (api: AgentHiveApi) => void;
    className?: string;
    style?: CSSProperties;
}

/** Thin React wrapper around createAgentHive. Init options are read once — change `key` to re-create. */
export function AgentHive(props: AgentHiveProps): ReactElement;
export default AgentHive;
