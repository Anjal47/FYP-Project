jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../src/models/Report", () => ({}));

jest.mock("pdfkit", () =>
  jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    end: jest.fn(),
  }))
);

const bcrypt = require("bcrypt");
const User = require("../src/models/User");
const {
  createStaff,
  getStats,
} = require("../src/controllers/admin.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("admin controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns dashboard stats for main staff groups", async () => {
    const req = {};
    const res = createResponse();
    const next = jest.fn();

    User.countDocuments
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5);

    await getStats(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      stats: {
        users: 25,
        counsellors: 3,
        therapists: 2,
        police: 4,
        municipality: 5,
        staff: 14,
        openReports: 0,
      },
    });
  });

  it("rejects invalid staff roles", async () => {
    const req = {
      body: {
        fullName: "Admin Staff",
        email: "staff@example.com",
        password: "secret123",
        role: "user",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    await createStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Invalid staff role",
    });
  });

  it("creates a staff account for supported roles", async () => {
    const req = {
      body: {
        fullName: "Officer Rana",
        email: "officer@example.com",
        password: "secret123",
        role: "police",
        qualification: "Inspector",
        workingArea: "Kathmandu",
        phone: "9800000000",
        bio: "Traffic operations",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue({
      _id: "staff-1",
      fullName: "Officer Rana",
      email: "officer@example.com",
      role: "police",
    });

    await createStaff(req, res, next);

    expect(User.create).toHaveBeenCalledWith({
      fullName: "Officer Rana",
      email: "officer@example.com",
      passwordHash: "hashed-password",
      role: "police",
      qualification: "Inspector",
      workingArea: "Kathmandu",
      phone: "9800000000",
      bio: "Traffic operations",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      staff: {
        id: "staff-1",
        fullName: "Officer Rana",
        email: "officer@example.com",
        role: "police",
      },
    });
  });
});
