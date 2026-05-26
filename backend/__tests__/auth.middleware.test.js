jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const auth = require("../src/middleware/auth");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("auth middleware", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("rejects requests with no bearer token", async () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Missing token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the active user and continues for a valid token", async () => {
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createResponse();
    const next = jest.fn();
    const user = { _id: "user-1", role: "admin", isActive: true };
    const select = jest.fn().mockResolvedValue(user);

    jwt.verify.mockReturnValue({ id: "user-1" });
    User.findById.mockReturnValue({ select });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect(User.findById).toHaveBeenCalledWith("user-1");
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks disabled accounts even when the token is valid", async () => {
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createResponse();
    const next = jest.fn();
    const select = jest.fn().mockResolvedValue({
      _id: "user-1",
      role: "admin",
      isActive: false,
    });

    jwt.verify.mockReturnValue({ id: "user-1" });
    User.findById.mockReturnValue({ select });

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Account disabled",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens", async () => {
    const req = { headers: { authorization: "Bearer bad-token" } };
    const res = createResponse();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => {
      throw new Error("bad token");
    });

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
