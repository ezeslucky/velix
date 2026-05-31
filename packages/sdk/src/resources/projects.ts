import type { APIPromise } from "../core/api-promise";
import { VelixError } from "../core/error";
import { APIResource } from "../core/resource";
import type { RequestOptions } from "../internal/request-options";

export class Projects extends APIResource {
	
	list(options?: RequestOptions): APIPromise<ProjectListResponse> {
		return this._client.query<ProjectListResponse>(
			"v2Project.list",
			{ organizationId: this._requireOrgId() },
			options,
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

export interface Project {
	id: string;
	name: string;
	slug: string;
	repoCloneUrl: string | null;
	githubRepositoryId: string | null;
}

export type ProjectListResponse = Array<Project>;

export declare namespace Projects {
	export type { Project, ProjectListResponse };
}
