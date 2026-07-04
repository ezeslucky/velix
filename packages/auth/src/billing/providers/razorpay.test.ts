import { describe, expect, it, mock } from "bun:test";
import { createHmac } from "node:crypto";

const SECRET = "whsec_test_razorpay";

// Mock env + SDK client before importing the provider so no real Razorpay
// client is constructed and verifyWebhook uses a known secret.
mock.module("../../env", () => ({
	env: {
		RAZORPAY_WEBHOOK_SECRET: SECRET,
		RAZORPAY_KEY_ID: "rzp_test_key",
		RAZORPAY_KEY_SECRET: "rzp_test_secret",
		RAZORPAY_PRO_MONTHLY_PLAN_ID: "plan_monthly",
		RAZORPAY_PRO_YEARLY_PLAN_ID: "plan_yearly",
	},
}));

interface CreateCall {
	plan_id: string;
	total_count: number;
	quantity: number;
}
const createCalls: CreateCall[] = [];

mock.module("../../razorpay", () => ({
	razorpay: () => ({
		subscriptions: {
			create: async (params: CreateCall) => {
				createCalls.push(params);
				return { id: "sub_123", short_url: "https://rzp.io/i/abc" };
			},
		},
	}),
}));

const { RazorpayProvider } = await import("./razorpay");
const { BillingUnsupportedError } = await import("../types");

const provider = new RazorpayProvider();

function sign(body: string) {
	return createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("RazorpayProvider.verifyWebhook", () => {
	it("accepts a correctly signed payload and parses the event", async () => {
		const body = JSON.stringify({ event: "subscription.activated" });
		const result = await provider.verifyWebhook({
			body,
			headers: {
				"x-razorpay-signature": sign(body),
				"x-razorpay-event-id": "evt_1",
			},
		});
		expect(result).toEqual({
			id: "evt_1",
			type: "subscription.activated",
			raw: { event: "subscription.activated" },
		});
	});

	it("rejects a tampered payload", async () => {
		const body = JSON.stringify({ event: "subscription.charged" });
		const badSig = sign(`${body}tampered`);
		await expect(
			provider.verifyWebhook({
				body,
				headers: { "x-razorpay-signature": badSig },
			}),
		).rejects.toThrow(/signature verification failed/);
	});

	it("rejects when the signature header is missing", async () => {
		await expect(
			provider.verifyWebhook({ body: "{}", headers: {} }),
		).rejects.toThrow(/Missing x-razorpay-signature/);
	});
});

describe("RazorpayProvider.createCheckout", () => {
	it("uses the yearly plan id for annual pro and returns the short_url", async () => {
		createCalls.length = 0;
		const result = await provider.createCheckout({
			organizationId: "org_1",
			customerId: "cust_1",
			plan: "pro",
			seats: 3,
			annual: true,
			urls: {},
		});
		expect(result.url).toBe("https://rzp.io/i/abc");
		expect(result.providerSubscriptionId).toBe("sub_123");
		expect(createCalls[0]?.plan_id).toBe("plan_yearly");
		expect(createCalls[0]?.quantity).toBe(3);
	});

	it("uses the monthly plan id for non-annual pro", async () => {
		createCalls.length = 0;
		await provider.createCheckout({
			organizationId: "org_1",
			customerId: "cust_1",
			plan: "pro",
			seats: 1,
			annual: false,
			urls: {},
		});
		expect(createCalls[0]?.plan_id).toBe("plan_monthly");
	});

	it("refuses checkout for non-pro plans", async () => {
		await expect(
			provider.createCheckout({
				organizationId: "org_1",
				customerId: "cust_1",
				plan: "enterprise",
				seats: 1,
				annual: false,
				urls: {},
			}),
		).rejects.toBeInstanceOf(BillingUnsupportedError);
	});
});

describe("RazorpayProvider capabilities", () => {
	it("has no billing portal", async () => {
		expect(
			await provider.getManageUrl({ customerId: "c", returnUrl: "u" }),
		).toBeNull();
	});

	it("does not support restore", async () => {
		await expect(
			provider.restore({ organizationId: "o", providerSubscriptionId: "s" }),
		).rejects.toBeInstanceOf(BillingUnsupportedError);
	});
});
