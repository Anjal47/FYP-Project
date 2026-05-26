const { askHelpChat } = require("../src/controllers/helpChat.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("help chat controller", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("requires a message", async () => {
    const req = {
      body: {},
    };
    const res = createResponse();

    await askHelpChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Message is required",
    });
  });

  it("returns a safe fallback reply when the OpenAI key is not configured", async () => {
    process.env.OPENAI_API_KEY = "";
    const req = {
      body: {
        message: "How do I report a traffic issue?",
        preferredLanguage: "English",
      },
    };
    const res = createResponse();

    await askHelpChat(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reply:
        "Live AI is not configured on the server yet. I can still help with app navigation. Open the reporting area and choose the report type that fits your issue. For crime use Police or Crime Reporting, for road issues use Traffic, and for waste or local issues use the municipality or waste reporting flow.",
      source: "fallback",
      configured: false,
    });
  });

  it("returns a billing-specific fallback reply when OpenAI quota is exceeded", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({
        error: {
          type: "insufficient_quota",
          code: "insufficient_quota",
          message:
            "You exceeded your current quota, please check your plan and billing details.",
        },
      }),
    });

    const req = {
      body: {
        message: "How do I donate?",
        preferredLanguage: "English",
      },
    };
    const res = createResponse();

    await askHelpChat(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reply:
        "Live AI is not active right now because the server's OpenAI billing or quota needs attention. Once API billing is set up, live replies will work again. I can still help with app navigation. Open Donate or Charity to browse approved requests, submit a support request, or continue with the donation flow.",
      source: "fallback",
      configured: false,
      reason: "quota_exceeded",
    });
  });
});
