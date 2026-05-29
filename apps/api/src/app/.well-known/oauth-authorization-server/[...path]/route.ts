import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@velix/auth/server";

export const GET = oauthProviderAuthServerMetadata(auth);
