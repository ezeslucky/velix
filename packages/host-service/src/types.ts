import type { Octokit } from "@octokit/rest";
import type { TRPCClient } from "@trpc/client";
import type { ChatService } from "@velix/chat/server/desktop";
import type { AppRouter } from "@velix/trpc";
import type { HostDb } from "./db";
import type { EventBus } from "./events";
import type { ChatRuntimeManager } from "./runtime/chat";
import type { WorkspaceFilesystemManager } from "./runtime/filesystem";
import type { GitFactory } from "./runtime/git";
import type { PullRequestRuntimeManager } from "./runtime/pull-requests";
import type { ExecGh } from "./trpc/router/workspace-creation/utils/exec-gh";

export type ApiClient = TRPCClient<AppRouter>;

export interface HostServiceRuntime {
	auth: ChatService;
	chat: ChatRuntimeManager;
	filesystem: WorkspaceFilesystemManager;
	pullRequests: PullRequestRuntimeManager;
}

export interface HostServiceContext {
	git: GitFactory;
	github: () => Promise<Octokit>;
	execGh: ExecGh;
	api: ApiClient;
	db: HostDb;
	runtime: HostServiceRuntime;
	eventBus: EventBus;
	organizationId: string;
	isAuthenticated: boolean;
}
