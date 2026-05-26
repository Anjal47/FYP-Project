process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.STRIPE_CURRENCY = "usd";
process.env.APP_DEEP_LINK_SCHEME = "angeltouch";

const mockCreateSession = jest.fn();
const mockRetrieveSession = jest.fn();

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
        retrieve: mockRetrieveSession,
      },
    },
  }))
);

jest.mock("../src/models/TrafficFine", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../src/models/TrafficPayment", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
}));

const TrafficFine = require("../src/models/TrafficFine");
const TrafficPayment = require("../src/models/TrafficPayment");
const {
  createFine,
  handleStripeCancel,
  initiatePayment,
} = require("../src/controllers/trafficPay.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
}

describe("traffic payment controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates target user details when creating a fine", async () => {
    const req = {
      body: {
        reason: "Helmet violation",
        amount: 500,
      },
    };
    const res = createResponse();

    await createFine(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "user or userEmail, reason and amount are required",
    });
  });

  it("requires a fineId to initiate a payment", async () => {
    const req = {
      body: {},
      user: { _id: "user-1" },
    };
    const res = createResponse();

    await initiatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "fineId is required",
    });
  });

  it("blocks payment initiation for a fine owned by another user", async () => {
    const req = {
      body: { fineId: "fine-1" },
      user: { _id: "user-1" },
    };
    const res = createResponse();

    TrafficFine.findById.mockResolvedValue({
      _id: "fine-1",
      user: "user-2",
      status: "UNPAID",
    });

    await initiatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "You can only pay your own fine",
    });
  });

  it("reuses the guardrail when a pending payment already exists", async () => {
    const req = {
      body: { fineId: "fine-1" },
      user: { _id: "user-1" },
    };
    const res = createResponse();

    TrafficFine.findById.mockResolvedValue({
      _id: "fine-1",
      user: "user-1",
      status: "UNPAID",
    });
    TrafficPayment.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: "payment-1",
        fine: "fine-1",
        status: "PENDING",
        method: "STRIPE",
      }),
    });

    await initiatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message:
        "A payment for this fine is already in progress. Return to the app and tap Verify Payment before trying again.",
      payment: {
        _id: "payment-1",
        fine: "fine-1",
        status: "PENDING",
        method: "STRIPE",
      },
    });
  });

  it("creates a Stripe checkout session and marks the fine as pending", async () => {
    const paymentSave = jest.fn().mockResolvedValue(undefined);
    const req = {
      protocol: "https",
      get: jest.fn(() => "example.com"),
      body: { fineId: "fine-1" },
      user: { _id: "user-1", email: "user@example.com" },
    };
    const res = createResponse();

    TrafficFine.findById.mockResolvedValue({
      _id: "fine-1",
      user: "user-1",
      status: "UNPAID",
      amount: 25,
      fineCode: "FINE-2026-111111",
      reason: "Helmet violation",
    });
    TrafficPayment.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    TrafficPayment.create.mockResolvedValue({
      _id: "payment-2",
      fine: "fine-1",
      amount: 25,
      transactionRef: "local-ref",
      status: "PENDING",
      method: "STRIPE",
      save: paymentSave,
    });
    mockCreateSession.mockResolvedValue({
      id: "cs_test_123",
      status: "open",
      url: "https://checkout.stripe.com/session/cs_test_123",
    });

    await initiatePayment(req, res);

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        client_reference_id: "payment-2",
        customer_email: "user@example.com",
        success_url:
          "https://example.com/api/traffic/payments/stripe/success?paymentId=payment-2&session_id={CHECKOUT_SESSION_ID}",
        cancel_url:
          "https://example.com/api/traffic/payments/stripe/cancel?paymentId=payment-2&session_id={CHECKOUT_SESSION_ID}",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "usd",
              unit_amount: 2500,
            }),
          }),
        ],
      })
    );
    expect(paymentSave).toHaveBeenCalledTimes(1);
    expect(TrafficFine.findByIdAndUpdate).toHaveBeenCalledWith("fine-1", {
      status: "PENDING",
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      payment: expect.objectContaining({
        _id: "payment-2",
        fine: "fine-1",
        status: "PENDING",
        method: "STRIPE",
        gatewayRef: "cs_test_123",
        gatewayStatus: "open",
        gatewayPayload: JSON.stringify({
          id: "cs_test_123",
          status: "open",
          url: "https://checkout.stripe.com/session/cs_test_123",
        }),
      }),
      stripe: {
        checkoutUrl: "https://checkout.stripe.com/session/cs_test_123",
        sessionId: "cs_test_123",
        currency: "usd",
      },
    });
  });

  it("marks the fine unpaid again when Stripe checkout is cancelled", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const payment = {
      _id: "payment-3",
      fine: "fine-1",
      gatewayRef: "",
      gatewayStatus: "",
      gatewayPayload: "",
      status: "PENDING",
      save,
    };
    const req = {
      query: {
        paymentId: "payment-3",
        session_id: "cs_cancelled_1",
      },
    };
    const res = createResponse();

    TrafficPayment.findById.mockResolvedValue(payment);

    await handleStripeCancel(req, res);

    expect(payment.gatewayRef).toBe("cs_cancelled_1");
    expect(payment.gatewayStatus).toBe("canceled");
    expect(payment.gatewayPayload).toBe(JSON.stringify({ session_id: "cs_cancelled_1" }));
    expect(payment.status).toBe("FAILED");
    expect(save).toHaveBeenCalledTimes(1);
    expect(TrafficFine.findByIdAndUpdate).toHaveBeenCalledWith("fine-1", {
      status: "UNPAID",
    });
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/html; charset=utf-8");
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("Payment Not Completed"));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("angeltouch://payment-return"));
  });
});
