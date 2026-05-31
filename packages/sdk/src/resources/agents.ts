import { VelixError } from "../core/error";
import { APIResource } from "../core/resource";
import type { RequestOptions } from "../internal/request-options";


export class Agents extends APIResource {
	
	list(params: AgentListParams, options?: RequestOptions) {
		this._requireOrgId();
		return this._client.hostQuery<AgentListResponse>(
			params.hostId,
			"settings.agentConfigs.list",
			undefined,
			options,
		);
	}

	
	async run(
		params: AgentRunParams,
		options?: { hostId?: string },
	): Promise<AgentRunResult> {
		this._requireOrgId();
		let hostId = options?.hostId;
		if (!hostId) {
			const cloud = await this._client.query<HostLookup | null>(
				"v2Workspace.getFromHost",
				{
					organizationId: this._client.organizationId,
					id: params.workspaceId,
				},
			);
			if (!cloud) {
				throw new VelixError(`Workspace not found: ${params.workspaceId}`);
			}
			hostId = cloud.hostId;
		}
		return this._client.hostMutation<AgentRunResult>(hostId, "agents.run", {
			workspaceId: params.workspaceId,
			agent: params.agent,
			prompt: params.prompt,
			attachmentIds: params.attachmentIds,
		});
	}

	private _requireOrgId(): string {
		if (!this._client.organizationId) {
			throw new VelixError(
				"organizationId is required. Set VELIX_ORGANIZATION_ID, or pass `organizationId` to the Velix constructor.",
			);
		}
		return this._client.organizationId;
	}
}

export type PromptTransport = "argv" | "stdin";

/** A configured terminal-agent row on a host (from `list`). */
export interface HostAgentConfig {
	id: string;
	presetId: string;
	label: string;
	command: string;
	args: string[];
	promptTransport: PromptTransport;
	promptArgs: string[];
	env: Record<string, string>;
	order: number;
}

export type AgentListResponse = Array<HostAgentConfig>;

export interface AgentListParams {
	/** Host machineId to query (see `hosts.list()`). */
	hostId: string;
}

export interface AgentRunParams {
	/** Workspace UUID to run the agent in. */
	workspaceId: string;
	
	agent: string;
	/** Prompt sent to the agent. */
	prompt: string;
	/** Host-scoped attachment ids; host resolves to absolute paths in the prompt. */
	attachmentIds?: string[];
}

interface HostLookup {
	hostId: string;
}

export type AgentRunResult =
	| { kind: "terminal"; sessionId: string; label: string }
	| { kind: "chat"; sessionId: string; label: string };

export declare namespace Agents {
	export type {
		HostAgentConfig,
		AgentListResponse,
		AgentListParams,
		AgentRunParams,
		AgentRunResult,
		PromptTransport,
	};
}
