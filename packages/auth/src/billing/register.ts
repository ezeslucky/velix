import { RazorpayProvider } from "./providers/razorpay";
import { StripeProvider } from "./providers/stripe";
import { registerProvider } from "./resolve-provider";

/**
 * Registers every billing provider factory exactly once. Import this module for
 * its side effect before calling {@link getProvider} — `server.ts` does so at
 * startup. Factories are lazy, so importing this does not construct an SDK
 * client until a provider is actually used.
 *
 * During the Stripe→Razorpay transition BOTH providers are registered: Razorpay
 * handles new subscriptions, Stripe services existing ones (dispatched on the
 * subscription row's `provider` column).
 */
let registered = false;

export function registerBillingProviders(): void {
	if (registered) return;
	registered = true;
	registerProvider("stripe", () => new StripeProvider());
	registerProvider("razorpay", () => new RazorpayProvider());
}

registerBillingProviders();
