import type { APIPromise } from "../core/api-promise";
import { VelixError } from "../core/error";
import { APIResource } from "../core/resource";
import type { RequestOptions } from "../internal/request-options";


export class Workspaces extends APIResource {
	
	list(
		params?: WorkspaceListParams,
		options?: RequestOptions,
	): APIPromise<WorkspaceListResponse> {
		return this._client.query<WorkspaceListResponse>(
			"v2Workspace.list",
			{ organizationId: this._requireOrgId(), ...params },
			options,
		);
	}

	/**
	 * Create a workspace on a specific host. Optionally spawn one or more
	 * agents inside it as soon as the worktree is ready (the `agents` sugar
	 * runs `agents.run` once per entry against the freshly-created workspace).
	 *
	 * The host service must be running and reachable via the relay tunnel.
	 * Provide exactly one of `branch` or `pr`.
	 */
	create(
		params: WorkspaceCreateParams,
		options?: RequestOptions,
	): APIPromise<WorkspaceCreateResult> {
		return this._client.hostMutation<WorkspaceCreateResult>(
			params.hostId,
			"workspaces.create",
			{
				projectId: params.projectId,
				name: params.name,
				branch: params.branch,
				pr: params.pr,
				baseBranch: params.baseBranch,
				taskId: params.taskId,
				agents: params.agents,
			},
			options,
		);
	}

	
	update(
		id: string,
		params: WorkspaceUpdateParams,
		options?: RequestOptions,
	): APIPromise<WorkspaceUpdateResult> {
		return this._client.mutation<WorkspaceUpdateResult>(
			"v2Workspace.update",
			{ id, ...params },
			options,
		);
	}

	
	async delete(
		id: string,
		options?: { hostId?: string },
	): Promise<WorkspaceDeleteResult> {
		let hostId = options?.hostId;
		if (!hostId) {
			const cloud = await this._client.query<HostLookup | null>(
				"v2Workspace.getFromHost",
				{ organizationId: this._requireOrgId(), id },
			);
			if (!cloud) throw new VelixError(`Workspace not found: ${id}`);
			hostId = cloud.hostId;
		}
		return this._client.hostMutation<WorkspaceDeleteResult>(
			hostId,
			"workspace.delete",
			{ id },
		);
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

/** Cloud-index workspace row (from the API). */
export interface Workspace {
	id: string;
	name: string;
	branch: string;
	projectId: string;
	projectName: string;
	hostId: string;
}

/** Workspace as returned by the host service (slightly different fields). */
export interface HostWorkspace {
	id: string;
	name: string;
	branch: string;
	projectId: string;
	/** Absolute path on the host filesystem. */
	path?: string;
	type?: "main" | "worktree";
}

interface HostLookup {
	hostId: string;
}

export type WorkspaceListResponse = Array<Workspace>;

export interface WorkspaceListParams {
	/** Restrict the listing to workspaces on a single host machineId. */
	hostId?: string;
	/** Restrict the listing to a single project by UUID. */
	projectId?: string;
	/** Restrict the listing by project name (case-insensitive exact match). */
	projectName?: string;
	/** Substring match against workspace name or branch. */
	search?: string;
}

export interface WorkspaceCreateParams {
	/** The host machineId to create the workspace on (see `hosts.list()`). */
	hostId: string;
	/** Project UUID (see `projects.list()`). */
	projectId: string;
	/** Workspace name. */
	name: string;
	/** Git branch the workspace tracks. Required unless `pr` is set. */
	branch?: string;
	/** Pull request number — server checks out the verified PR head and derives the branch. */
	pr?: number;
	/** Branch to fork from when `branch` does not exist. Ignored with `pr`. */
	baseBranch?: string;
	
	taskId?: string;
	/** Spawn one or more agents in the workspace immediately after creation. */
	agents?: WorkspaceAgentLaunch[];
}

export interface WorkspaceAgentLaunch {
	
	agent: string;
	/** What to tell the agent. */
	prompt: string;
	/** Host-scoped attachment ids; host resolves to absolute paths in the prompt. */
	attachmentIds?: string[];
}

export type WorkspaceCreateAgentResult =
	| { ok: true; kind: "terminal"; sessionId: string; label: string }
	| { ok: true; kind: "chat"; sessionId: string; label: string }
	| { ok: false; error: string };

export interface WorkspaceCreateResult {
	workspace: {
		id: string;
		organizationId: string;
		projectId: string;
		hostId: string;
		name: string;
		branch: string;
		type: "main" | "worktree";
		createdByUserId: string | null;
		taskId: string | null;
		createdAt: Date;
		updatedAt: Date;
	};
	terminals: Array<{ terminalId: string; label?: string }>;
	agents: WorkspaceCreateAgentResult[];
	alreadyExists: boolean;
	warnings: string[];
}

export interface WorkspaceUpdateParams {
	/** New workspace name. */
	name?: string;
	/** Link the workspace to a task by id, or pass `null` to unlink. */
	taskId?: string | null;
}

export interface WorkspaceUpdateResult {
	id: string;
	name: string;
	branch: string;
	organizationId: string;
	projectId: string;
	hostId: string;
	type: "main" | "worktree";
	createdByUserId: string | null;
	taskId: string | null;
	createdAt: Date;
	updatedAt: Date;
	txid: number;
}

export interface WorkspaceDeleteResult {
	[key: string]: unknown;
}

export declare namespace Workspaces {
	export type {
		Workspace,
		HostWorkspace,
		WorkspaceListResponse,
		WorkspaceListParams,
		WorkspaceCreateParams,
		WorkspaceAgentLaunch,
		WorkspaceCreateAgentResult,
		WorkspaceCreateResult,
		WorkspaceUpdateParams,
		WorkspaceUpdateResult,
		WorkspaceDeleteResult,
	};
}
