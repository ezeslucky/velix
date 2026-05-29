import { describe, expect, test } from "bun:test";
import {
	buildPullRequestCompareUrl,
	normalizeGitHubRepoUrl,
	parseUpstreamRef,
} from "./pull-request-url";

describe("pull-request-url", () => {
	test("normalizes GitHub remote URLs", () => {
		expect(
			normalizeGitHubRepoUrl("https://github.com/ezeslucky/velix.git"),
		).toBe("https://github.com/ezeslucky/velix");
		expect(normalizeGitHubRepoUrl("git@github.com:ezeslucky/velix.git")).toBe(
			"https://github.com/ezeslucky/velix",
		);
		expect(
			normalizeGitHubRepoUrl("ssh://git@github.com/ezeslucky/velix.git"),
		).toBe("https://github.com/ezeslucky/velix");
	});

	test("parses upstream refs with slashes in branch names", () => {
		expect(parseUpstreamRef("ezeslucky/ezeslucky/halved-position")).toEqual({
			remoteName: "ezeslucky",
			branchName: "ezeslucky/halved-position",
		});
	});

	test("builds compare URLs for fork branches", () => {
		expect(
			buildPullRequestCompareUrl({
				baseRepoUrl: "https://github.com/ezeslucky/velix.git",
				baseBranch: "main",
				headRepoOwner: "ezeslucky",
				headBranch: "ezeslucky/halved-position",
			}),
		).toBe(
			"https://github.com/ezeslucky/velix/compare/main...ezeslucky:ezeslucky/halved-position?expand=1",
		);
	});
});
