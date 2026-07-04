import {
	type BillingProvider,
	type BillingProviderId,
	isBillingProviderId,
} from "./types";

export interface ResolveProviderInput {
	/** Explicit override stored on the organization (`organizations.billingProvider`). */
	override?: string | null;
}

/**
 * Decide which billing provider owns a NEW subscription. An explicit override
 * always wins; otherwise every new subscription now goes to Razorpay (the
 * Stripe→Razorpay transition).
 *
 * NOTE: this is only for creating new subscriptions. Servicing an existing
 * subscription must dispatch on that row's stored `provider` column via
 * {@link getProvider}, never re-resolve here — otherwise a live Stripe
 * subscriber would be routed to the wrong provider.
 */
export function resolveProviderId(
	input: ResolveProviderInput = {},
): BillingProviderId {
	if (isBillingProviderId(input.override)) {
		return input.override;
	}
	return "razorpay";
}

/**
 * Provider implementations register here in later phases. Factories are lazy and
 * their results cached, so importing this abstraction never constructs a
 * provider SDK client (or requires its secrets) until a provider is used.
 */
const factories = new Map<BillingProviderId, () => BillingProvider>();
const instances = new Map<BillingProviderId, BillingProvider>();

export function registerProvider(
	id: BillingProviderId,
	factory: () => BillingProvider,
): void {
	factories.set(id, factory);
	instances.delete(id);
}

export function getProvider(id: BillingProviderId): BillingProvider {
	const cached = instances.get(id);
	if (cached) return cached;

	const factory = factories.get(id);
	if (!factory) {
		throw new Error(`No billing provider registered for "${id}"`);
	}

	const instance = factory();
	instances.set(id, instance);
	return instance;
}
