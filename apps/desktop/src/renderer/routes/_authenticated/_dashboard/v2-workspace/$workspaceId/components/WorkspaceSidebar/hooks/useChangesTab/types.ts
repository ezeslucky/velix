import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@velix/host-service";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Commit = RouterOutputs["git"]["listCommits"]["commits"][number];
export type Branch = RouterOutputs["git"]["listBranches"]["branches"][number];
export type ChangedFile =
	RouterOutputs["git"]["getStatus"]["againstBase"][number];
