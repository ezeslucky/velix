import { USER_GIT_ENV_SIMPLE_GIT_OPTIONS } from "@velix/shared/simple-git-options";
import simpleGit, { type SimpleGit, type SimpleGitOptions } from "simple-git";

const SIMPLE_GIT_OPTIONS =
	USER_GIT_ENV_SIMPLE_GIT_OPTIONS satisfies Partial<SimpleGitOptions>;

export function createUserSimpleGit(baseDir?: string): SimpleGit {
	return baseDir
		? simpleGit(baseDir, SIMPLE_GIT_OPTIONS)
		: simpleGit(SIMPLE_GIT_OPTIONS);
}
