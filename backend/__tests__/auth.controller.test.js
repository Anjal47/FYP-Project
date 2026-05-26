jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/utils/mailer", () => ({
  sendMail: jest.fn(),
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const {
  login,
  registerUser,
} = require("../src/controllers/auth.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("auth controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "7d";
    jwt.sign.mockReturnValue("signed-token");
  });

  it("validates required registration fields", async () => {
    const req = { body: { fullName: "Asha" } };
    const res = createResponse();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "fullName, email, password required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks duplicate registration emails", async () => {
    const req = {
      body: {
        fullName: "Asha",
        email: "asha@example.com",
        password: "secret123",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    User.findOne.mockResolvedValue({ _id: "existing-user" });

    await registerUser(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: "asha@example.com" });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Email already used",
    });
  });

  it("creates a normal user account and returns auth payload", async () => {
    const req = {
      body: {
        fullName: "  Asha Rai  ",
        email: " ASHA@EXAMPLE.COM ",
        password: "secret123",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue({
      _id: "user-1",
      fullName: "Asha Rai",
      email: "asha@example.com",
      role: "user",
      bio: "",
      qualification: "",
      workingArea: "",
      phone: "",
      isActive: true,
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
    });

    await registerUser(req, res, next);

    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
    expect(User.create).toHaveBeenCalledWith({
      fullName: "Asha Rai",
      email: "asha@example.com",
      passwordHash: "hashed-password",
      role: "user",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      token: "signed-token",
      user: expect.objectContaining({
        id: "user-1",
        fullName: "Asha Rai",
        email: "asha@example.com",
        role: "user",
      }),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid login credentials", async () => {
    const req = {
      body: {
        email: "asha@example.com",
        password: "wrong-password",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    User.findOne.mockResolvedValue({
      _id: "user-1",
      passwordHash: "hashed-password",
      isActive: true,
    });
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Invalid credentials",
    });
  });

  it("blocks login for disabled accounts", async () => {
    const req = {
      body: {
        email: "asha@example.com",
        password: "secret123",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    User.findOne.mockResolvedValue({
      _id: "user-1",
      fullName: "Asha Rai",
      email: "asha@example.com",
      passwordHash: "hashed-password",
      role: "user",
      isActive: false,
    });
    bcrypt.compare.mockResolvedValue(true);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Account disabled",
    });
  });
});
