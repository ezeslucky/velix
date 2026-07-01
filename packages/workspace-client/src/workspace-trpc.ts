import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@velix/host-service/trpc";

export const workspaceTrpc = createTRPCReact<AppRouter>({
	abortOnUnmount: true,
});
