import { createCommand } from "@velix/cli-framework";
import type { ApiClient } from "./api-client";
import type { VelixConfig } from "./config";
import type { AuthSource } from "./resolve-auth";

export interface CliContext {
	api: ApiClient;
	config: VelixConfig;
	bearer: string;
	authSource: AuthSource;
}

export const command = createCommand<CliContext>();
