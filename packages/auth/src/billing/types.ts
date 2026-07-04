import type { PlanTier } from "@velix/shared/billing";

export const BILLING_PROVIDER_IDS = ["stripe", "razorpay"] as const;
export type BillingProviderId = (typeof BILLING_PROVIDER_IDS)[number];

/**
 * Thrown when a provider cannot perform a capability another provider supports
 * (e.g. Razorpay has no reliable "restore a cancelled subscription" API). The
 * caller maps this to a user-facing "not available for this provider" message
 * rather than a generic 500 — the operation isn't broken, it's unsupported.
 */
export class BillingUnsupportedError extends Error {
	constructor(
		readonly provider: BillingProviderId,
		readonly operation: string,
	) {
		super(
			`"${operation}" is not supported by the ${provider} billing provider`,
		);
		this.name = "BillingUnsupportedError";
	}
}

export function isBillingProviderId(
	value: string | null | undefined,
): value is BillingProviderId {
	return value === "stripe" || value === "razorpay";
}

/** Where a checkout/manage flow should send the user back to. */
export interface BillingRedirectUrls {
	successUrl?: string;
	cancelUrl?: string;
	returnUrl?: string;
}

export interface CreateCustomerParams {
	organizationId: string;
	name: string;
	email: string;
}

export interface CheckoutParams {
	organizationId: string;
	customerId: string;
	plan: PlanTier;
	seats: number;
	annual: boolean;
	urls: BillingRedirectUrls;
}

/**
 * A subscription checkout in progress. `url` is what the client opens — a Stripe
 * Checkout Session URL or a Razorpay subscription `short_url`.
 */
export interface CheckoutResult {
	url: string;
	providerSubscriptionId?: string;
}

export interface CancelParams {
	organizationId: string;
	providerSubscriptionId: string;
	returnUrl?: string;
}

export interface RestoreParams {
	organizationId: string;
	providerSubscriptionId: string;
}

export interface UpdateSeatsParams {
	providerSubscriptionId: string;
	seats: number;
}

export interface InvoiceSummary {
	id: string;
	/** Unix seconds. */
	date: number;
	/** Amount in the currency's minor units (e.g. cents / paise). */
	amount: number;
	currency: string;
	hostedInvoiceUrl: string | null;
}

export interface PaymentMethodSummary {
	type: string;
	brand: string;
	last4: string | null;
}

export interface CustomerAddress {
	line1: string | null;
	line2: string | null;
	city: string | null;
	state: string | null;
	postalCode: string | null;
	country: string | null;
}

export interface CustomerDetails {
	name: string | null;
	email: string | null;
	address: CustomerAddress | null;
	paymentMethod: PaymentMethodSummary | null;
	taxId: { type: string; value: string } | null;
}

/** Result of verifying + parsing a provider webhook request. */
export interface WebhookEvent {
	id: string;
	type: string;
	raw: unknown;
}

export interface ManageUrlParams {
	customerId: string;
	returnUrl: string;
	flowType?: "payment_method_update" | "general";
}

export interface VerifyWebhookRequest {
	/** Raw request body, exactly as received (needed for signature checks). */
	body: string;
	headers: Record<string, string | undefined>;
}

/**
 * Unified interface every payment processor implements. Stripe wraps the
 * existing better-auth plugin logic; Razorpay is a custom implementation.
 * The caller selects an implementation via {@link resolveProviderId}.
 */
export interface BillingProvider {
	readonly id: BillingProviderId;

	createCustomer(params: CreateCustomerParams): Promise<{ customerId: string }>;

	/** Begin a subscription; returns a URL for the client to open. */
	createCheckout(params: CheckoutParams): Promise<CheckoutResult>;

	cancel(params: CancelParams): Promise<{ url?: string }>;
	restore(params: RestoreParams): Promise<void>;
	updateSeats(params: UpdateSeatsParams): Promise<void>;

	listInvoices(customerId: string): Promise<InvoiceSummary[]>;
	getCustomerDetails(customerId: string): Promise<CustomerDetails | null>;

	/**
	 * URL where the customer manages billing. Stripe returns a billing-portal
	 * session URL. Razorpay has no portal, so this may return null and the UI
	 * renders a custom management panel instead.
	 */
	getManageUrl(params: ManageUrlParams): Promise<string | null>;

	/** Verify the signature and parse a raw webhook request. Throws if invalid. */
	verifyWebhook(request: VerifyWebhookRequest): Promise<WebhookEvent>;
}
