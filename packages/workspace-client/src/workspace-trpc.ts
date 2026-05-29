import type { AppRouter } from "@velix/host-service/trpc";
import { createTRPCReact } from "@trpc/react-query";

export const workspaceTrpc = createTRPCReact<AppRouter>({
	abortOnUnmount: true,
});
