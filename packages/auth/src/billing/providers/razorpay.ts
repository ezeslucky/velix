import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanTier } from "@velix/shared/billing";
import { env } from "../../env";
import { razorpay } from "../../razorpay";
import {
	type BillingProvider,
	BillingUnsupportedError,
	type CancelParams,
	type CheckoutParams,
	type CheckoutResult,
	type CreateCustomerParams,
	type CustomerDetails,
	type InvoiceSummary,
	type ManageUrlParams,
	type RestoreParams,
	type UpdateSeatsParams,
	type VerifyWebhookRequest,
	type WebhookEvent,
} from "../types";

// Razorpay subscriptions require an upfront billing-cycle count (there is no
// "until cancelled"). Ten years is effectively indefinite for our purposes; a
// lapsed subscription is renewed by re-subscribing.
const YEARLY_CYCLES = 10;
const MONTHLY_CYCLES = 120;

/**
 * Only `pro` is self-serve on Razorpay; `enterprise` is contact-sales and `free`
 * never checks out. Throws {@link BillingUnsupportedError} otherwise.
 */
function planIdFor(plan: PlanTier, annual: boolean): string {
	if (plan !== "pro") {
		throw new BillingUnsupportedError(
			"razorpay",
			`checkout for the "${plan}" plan`,
		);
	}
	return annual
		? env.RAZORPAY_PRO_YEARLY_PLAN_ID
		: env.RAZORPAY_PRO_MONTHLY_PLAN_ID;
}

// Narrow views of the Razorpay SDK responses — only the fields we read. The SDK
// ships broad types; these keep our field access explicit and provider-local.
interface RzpSubscription {
	id: string;
	short_url: string;
	status: string;
	current_start: number | null;
	current_end: number | null;
	quantity?: number;
}
interface RzpCustomer {
	id: string;
	name?: string;
	email?: string;
	contact?: string | number;
	gstin?: string | null;
}
interface RzpInvoice {
	id: string;
	created_at: number;
	amount_paid?: number;
	amount?: number;
	currency: string;
	short_url?: string | null;
}

/**
 * Razorpay implementation of {@link BillingProvider}. Used for all NEW
 * subscriptions during the Stripe→Razorpay transition. Razorpay has no billing
 * portal ({@link getManageUrl} returns null) and no reliable un-cancel, so
 * {@link restore} is unsupported.
 */
export class RazorpayProvider implements BillingProvider {
	readonly id = "razorpay" as const;

	async createCustomer(
		params: CreateCustomerParams,
	): Promise<{ customerId: string }> {
		const customer = (await razorpay().customers.create({
			name: params.name,
			email: params.email,
			fail_existing: 0,
			notes: { organizationId: params.organizationId },
		})) as unknown as RzpCustomer;
		return { customerId: customer.id };
	}

	async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
		const subscription = (await razorpay().subscriptions.create({
			plan_id: planIdFor(params.plan, params.annual),
			total_count: params.annual ? YEARLY_CYCLES : MONTHLY_CYCLES,
			quantity: params.seats,
			customer_notify: 1,
			notes: { referenceId: params.organizationId },
		})) as unknown as RzpSubscription;

		if (!subscription.short_url) {
			throw new Error("Razorpay did not return a subscription checkout URL");
		}
		return {
			url: subscription.short_url,
			providerSubscriptionId: subscription.id,
		};
	}

	async cancel(params: CancelParams): Promise<{ url?: string }> {
		// cancel_at_cycle_end keeps access until the paid period ends.
		await razorpay().subscriptions.cancel(params.providerSubscriptionId, true);
		return {}; // no portal URL for Razorpay
	}

	async restore(_params: RestoreParams): Promise<void> {
		// Razorpay cannot reliably un-cancel a subscription set to cancel at
		// cycle end; the customer must re-subscribe. Surfaced so the UI hides
		// "restore" for Razorpay rows instead of failing opaquely.
		throw new BillingUnsupportedError("razorpay", "restore");
	}

	async updateSeats(params: UpdateSeatsParams): Promise<void> {
		await razorpay().subscriptions.update(params.providerSubscriptionId, {
			quantity: params.seats,
		});
	}

	async listInvoices(customerId: string): Promise<InvoiceSummary[]> {
		const result = (await razorpay().invoices.all({
			customer_id: customerId,
			count: 100,
		})) as unknown as { items: RzpInvoice[] };

		return result.items.map((invoice) => ({
			id: invoice.id,
			date: invoice.created_at,
			amount: invoice.amount_paid ?? invoice.amount ?? 0,
			currency: invoice.currency,
			hostedInvoiceUrl: invoice.short_url ?? null,
		}));
	}

	async getCustomerDetails(
		customerId: string,
	): Promise<CustomerDetails | null> {
		const customer = (await razorpay().customers.fetch(
			customerId,
		)) as unknown as RzpCustomer;

		return {
			name: customer.name ?? null,
			email: customer.email ?? null,
			// Razorpay does not expose a stored billing address or a default
			// payment method on the customer object; those live inside the hosted
			// checkout. Left null until/if we integrate the Tokens API.
			address: null,
			paymentMethod: null,
			taxId: customer.gstin ? { type: "gstin", value: customer.gstin } : null,
		};
	}

	async getManageUrl(_params: ManageUrlParams): Promise<string | null> {
		return null; // Razorpay has no billing portal; UI renders a custom panel
	}

	async verifyWebhook(request: VerifyWebhookRequest): Promise<WebhookEvent> {
		const signature = request.headers["x-razorpay-signature"];
		if (!signature) {
			throw new Error("Missing x-razorpay-signature header");
		}
		if (!env.RAZORPAY_WEBHOOK_SECRET) {
			throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
		}

		const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
			.update(request.body)
			.digest("hex");

		const expectedBuf = Buffer.from(expected, "utf8");
		const actualBuf = Buffer.from(signature, "utf8");
		if (
			expectedBuf.length !== actualBuf.length ||
			!timingSafeEqual(expectedBuf, actualBuf)
		) {
			throw new Error("Razorpay webhook signature verification failed");
		}

		const parsed = JSON.parse(request.body) as { event?: string };
		return {
			id: request.headers["x-razorpay-event-id"] ?? "",
			type: parsed.event ?? "",
			raw: parsed,
		};
	}
}
