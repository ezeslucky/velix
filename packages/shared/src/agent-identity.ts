import type { AgentDefinitionId, BuiltinAgentId } from "./agent-catalog";

export interface AgentIdentity {
	agentId: BuiltinAgentId | "droid";
	sessionId?: string;
	definitionId?: AgentDefinitionId;
}
