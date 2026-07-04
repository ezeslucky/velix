import type { PlanTier } from "@velix/shared/billing";
import type Stripe from "stripe";
import { env } from "../../env";
import { stripeClient } from "../../stripe";
import type {
	BillingProvider,
	CancelParams,
	CheckoutParams,
	CheckoutResult,
	CreateCustomerParams,
	CustomerDetails,
	InvoiceSummary,
	ManageUrlParams,
	PaymentMethodSummary,
	RestoreParams,
	UpdateSeatsParams,
	VerifyWebhookRequest,
	WebhookEvent,
} from "../types";

function priceIdFor(plan: PlanTier, annual: boolean): string {
	if (plan === "enterprise") return env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID;
	return annual
		? env.STRIPE_PRO_YEARLY_PRICE_ID
		: env.STRIPE_PRO_MONTHLY_PRICE_ID;
}

function summarizePaymentMethod(
	pm: Stripe.PaymentMethod | null,
): PaymentMethodSummary | null {
	if (!pm) return null;
	if (pm.card) {
		return { type: "card", brand: pm.card.brand, last4: pm.card.last4 };
	}
	if (pm.link) {
		return { type: "link", brand: "Link", last4: null };
	}
	if (pm.us_bank_account) {
		return {
			type: "bank",
			brand: pm.us_bank_account.bank_name ?? "Bank account",
			last4: pm.us_bank_account.last4 ?? null,
		};
	}
	return { type: pm.type, brand: pm.type, last4: null };
}

/**
 * Stripe implementation of {@link BillingProvider}. Reads/management calls hit
 * the Stripe SDK directly (mirroring the previous billing router). Note: the
 * live Stripe *checkout* flow is driven by the better-auth Stripe plugin, so
 * `createCheckout` here exists for interface completeness and is not the wired
 * UI path for Stripe.
 */
export class StripeProvider implements BillingProvider {
	readonly id = "stripe" as const;

	async createCustomer(
		params: CreateCustomerParams,
	): Promise<{ customerId: string }> {
		const customer = await stripeClient.customers.create({
			name: params.name,
			email: params.email,
			metadata: { organizationId: params.organizationId },
		});
		return { customerId: customer.id };
	}

	async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
		const session = await stripeClient.checkout.sessions.create({
			mode: "subscription",
			customer: params.customerId,
			line_items: [
				{
					price: priceIdFor(params.plan, params.annual),
					quantity: params.seats,
				},
			],
			success_url: params.urls.successUrl ?? env.NEXT_PUBLIC_WEB_URL,
			cancel_url: params.urls.cancelUrl ?? env.NEXT_PUBLIC_WEB_URL,
			subscription_data: {
				metadata: { referenceId: params.organizationId },
			},
			metadata: { referenceId: params.organizationId },
		});

		if (!session.url) {
			throw new Error("Stripe did not return a checkout URL");
		}
		return { url: session.url };
	}

	async cancel(params: CancelParams): Promise<{ url?: string }> {
		await stripeClient.subscriptions.update(params.providerSubscriptionId, {
			cancel_at_period_end: true,
		});
		return {};
	}

	async restore(params: RestoreParams): Promise<void> {
		await stripeClient.subscriptions.update(params.providerSubscriptionId, {
			cancel_at_period_end: false,
		});
	}

	async updateSeats(params: UpdateSeatsParams): Promise<void> {
		const subscription = await stripeClient.subscriptions.retrieve(
			params.providerSubscriptionId,
		);
		const itemId = subscription.items.data[0]?.id;
		if (!itemId) return;

		await stripeClient.subscriptions.update(params.providerSubscriptionId, {
			items: [{ id: itemId, quantity: params.seats }],
			proration_behavior: "create_prorations",
		});
	}

	async listInvoices(customerId: string): Promise<InvoiceSummary[]> {
		const invoices = await stripeClient.invoices.list({
			customer: customerId,
			limit: 100,
			status: "paid",
		});
		return invoices.data.map((invoice) => ({
			id: invoice.id ?? "",
			date: invoice.created,
			amount: invoice.amount_paid,
			currency: invoice.currency,
			hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
		}));
	}

	async getCustomerDetails(
		customerId: string,
	): Promise<CustomerDetails | null> {
		const [customer, taxIds, paymentMethods] = await Promise.all([
			stripeClient.customers.retrieve(customerId),
			stripeClient.customers.listTaxIds(customerId, { limit: 1 }),
			stripeClient.paymentMethods.list({ customer: customerId, limit: 1 }),
		]);

		if ((customer as Stripe.DeletedCustomer).deleted) return null;

		const { name, email, address } = customer as Stripe.Customer;
		const taxId = taxIds.data[0] ?? null;

		return {
			name: name ?? null,
			email: email ?? null,
			address: address
				? {
						line1: address.line1,
						line2: address.line2,
						city: address.city,
						state: address.state,
						postalCode: address.postal_code,
						country: address.country,
					}
				: null,
			paymentMethod: summarizePaymentMethod(paymentMethods.data[0] ?? null),
			taxId: taxId ? { type: taxId.type, value: taxId.value } : null,
		};
	}

	async getManageUrl(params: ManageUrlParams): Promise<string | null> {
		const session = await stripeClient.billingPortal.sessions.create({
			customer: params.customerId,
			return_url: params.returnUrl,
			...(params.flowType === "payment_method_update" && {
				flow_data: { type: "payment_method_update" as const },
			}),
		});
		return session.url;
	}

	async verifyWebhook(request: VerifyWebhookRequest): Promise<WebhookEvent> {
		const signature = request.headers["stripe-signature"];
		if (!signature) {
			throw new Error("Missing stripe-signature header");
		}
		if (!env.STRIPE_WEBHOOK_SECRET) {
			throw new Error("STRIPE_WEBHOOK_SECRET is not set");
		}
		const event = stripeClient.webhooks.constructEvent(
			request.body,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
		);
		return { id: event.id, type: event.type, raw: event };
	}
}
