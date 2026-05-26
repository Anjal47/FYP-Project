import {
  getRoleRoute,
  parsePaymentReturnUrl,
  resolveInitialRouteFromStorage,
} from "../../src/navigation/authStack.logic";

function createStorage(values = {}) {
  return {
    getItem: jest.fn((key) => Promise.resolve(values[key] ?? null)),
  };
}

describe("authStack logic", () => {
  test.each([
    ["admin", "AdminTabs"],
    ["counsellor", "CounsellorHome"],
    ["therapist", "TherapistHome"],
    ["police", "PoliceHome"],
    ["municipality", "MunicipalityWasteDashboard"],
    ["user", "Home"],
    [undefined, "Home"],
  ])("maps role %p to %p", (role, route) => {
    expect(getRoleRoute(role)).toBe(route);
  });

  it("restores the saved role route when token and user role exist", async () => {
    const storage = createStorage({
      token: "token-123",
      user: JSON.stringify({ role: "police" }),
    });

    await expect(resolveInitialRouteFromStorage(storage)).resolves.toBe(
      "PoliceHome"
    );
  });

  it("falls back to Welcome when storage is incomplete or invalid", async () => {
    const missingTokenStorage = createStorage({
      user: JSON.stringify({ role: "admin" }),
    });

    const brokenUserStorage = createStorage({
      token: "token-123",
      user: "{bad-json",
    });

    await expect(
      resolveInitialRouteFromStorage(missingTokenStorage)
    ).resolves.toBe("Welcome");
    await expect(
      resolveInitialRouteFromStorage(brokenUserStorage)
    ).resolves.toBe("Welcome");
  });

  it("parses supported payment return deep links", () => {
    expect(
      parsePaymentReturnUrl(
        "angeltouch://payment-return?paymentId=pay_123&status=success"
      )
    ).toEqual({
      paymentId: "pay_123",
      status: "success",
    });
  });

  it("ignores malformed or unrelated deep links", () => {
    expect(parsePaymentReturnUrl("angeltouch://something-else")).toBeNull();
    expect(parsePaymentReturnUrl("not a url")).toBeNull();
    expect(parsePaymentReturnUrl("")).toBeNull();
  });
});
