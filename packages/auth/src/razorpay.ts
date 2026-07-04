import Razorpay from "razorpay";
import { env } from "./env";

let client: Razorpay | null = null;

/**
 * Lazily constructs and caches the Razorpay SDK client. Deferred (rather than a
 * module-level singleton like `stripe.ts`) so that importing the billing
 * registry never requires `RAZORPAY_*` secrets — the client is only built the
 * first time a Razorpay operation actually runs. This keeps the auth server
 * bootable during the transition before Razorpay keys are provisioned.
 */
export function razorpay(): Razorpay {
	if (!client) {
		client = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_KEY_SECRET,
		});
	}
	return client;
}
