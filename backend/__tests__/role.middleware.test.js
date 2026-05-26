const requireRole = require("../src/middleware/role");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("requireRole middleware", () => {
  it("rejects requests with no authenticated user", () => {
    const middleware = requireRole("admin");
    const req = {};
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects users whose role is not allowed", () => {
    const middleware = requireRole("admin", "police");
    const req = { user: { role: "user" } };
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Forbidden",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("continues when the user role is allowed", () => {
    const middleware = requireRole("admin", "police");
    const req = { user: { role: "police" } };
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
