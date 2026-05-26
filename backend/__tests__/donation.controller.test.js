jest.mock("../src/models/DonationRequest", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

const DonationRequest = require("../src/models/DonationRequest");
const {
  approveDonationRequest,
  closeDonationRequest,
  createDonationRequest,
  getApprovedDonations,
  getMyDonationRequests,
  recordDonationProgress,
  rejectDonationRequest,
} = require("../src/controllers/donation.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function mockFindChain(result) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    populate: jest.fn().mockReturnThis(),
  };
  DonationRequest.find.mockReturnValue(chain);
  return chain;
}

describe("donation controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated donation submissions", async () => {
    const req = { body: {} };
    const res = createResponse();

    await createDonationRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Unauthorized",
    });
  });

  it("creates a donation request with progress defaults and file URLs", async () => {
    const req = {
      protocol: "https",
      get: jest.fn(() => "example.com"),
      user: { _id: "user-1" },
      body: {
        fullName: "  Asha Rai  ",
        contact: " 9800000000 ",
        location: "  Kathmandu ",
        helpType: "  Medical  ",
        description: "  Urgent support needed  ",
        amountNeeded: "1500",
      },
      files: {
        qrImage: [{ filename: "qr.png" }],
        proofImage: [{ filename: "proof.png" }],
      },
    };
    const res = createResponse();

    DonationRequest.create.mockResolvedValue({
      _id: "donation-1",
      fullName: "Asha Rai",
      contact: "9800000000",
      location: "Kathmandu",
      helpType: "Medical",
      description: "Urgent support needed",
      amountNeeded: 1500,
      raisedAmount: 0,
      donorCount: 0,
      urgency: "Medium",
      qrImage: "https://example.com/uploads/donations/qr.png",
      proofImage: "https://example.com/uploads/donations/proof.png",
      proofVideo: "",
      adminNotes: "",
      status: "pending",
      isClosed: false,
      closedAt: null,
      createdAt: new Date("2026-05-19T12:00:00.000Z"),
      updatedAt: new Date("2026-05-19T12:00:00.000Z"),
    });

    await createDonationRequest(req, res);

    expect(DonationRequest.create).toHaveBeenCalledWith({
      fullName: "Asha Rai",
      contact: "9800000000",
      location: "Kathmandu",
      helpType: "Medical",
      description: "Urgent support needed",
      amountNeeded: 1500,
      raisedAmount: 0,
      donorCount: 0,
      urgency: "Medium",
      qrImage: "https://example.com/uploads/donations/qr.png",
      proofImage: "https://example.com/uploads/donations/proof.png",
      proofVideo: "",
      status: "pending",
      isClosed: false,
      closedAt: null,
      createdBy: "user-1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        message: "Donation request submitted for admin approval",
        donation: expect.objectContaining({
          _id: "donation-1",
          amountNeeded: 1500,
          raisedAmount: 0,
          donorCount: 0,
          remainingAmount: 1500,
          progressPercent: 0,
          isFunded: false,
          status: "pending",
        }),
      })
    );
  });

  it("returns approved donations with computed progress fields", async () => {
    const req = {};
    const res = createResponse();
    mockFindChain([
      {
        _id: "donation-1",
        fullName: "Asha",
        contact: "9800",
        location: "Kathmandu",
        helpType: "Medical",
        description: "Support",
        amountNeeded: 2000,
        raisedAmount: 750,
        donorCount: 3,
        urgency: "Urgent",
        qrImage: "",
        proofImage: "",
        proofVideo: "",
        adminNotes: "",
        status: "approved",
        isClosed: false,
        closedAt: null,
        createdAt: new Date("2026-05-19T12:00:00.000Z"),
        updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      },
    ]);

    await getApprovedDonations(req, res);

    expect(DonationRequest.find).toHaveBeenCalledWith({
      status: "approved",
      isClosed: false,
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      donations: [
        expect.objectContaining({
          _id: "donation-1",
          amountNeeded: 2000,
          raisedAmount: 750,
          donorCount: 3,
          remainingAmount: 1250,
          progressPercent: 37.5,
          isFunded: false,
        }),
      ],
    });
  });

  it("returns the requester's own donation requests", async () => {
    const req = {
      user: { _id: "user-5" },
    };
    const res = createResponse();
    mockFindChain([
      {
        _id: "donation-2",
        fullName: "Sita",
        contact: "9811",
        location: "Pokhara",
        helpType: "Education",
        description: "Tuition support",
        amountNeeded: 1000,
        raisedAmount: 1000,
        donorCount: 4,
        urgency: "Medium",
        qrImage: "",
        proofImage: "",
        proofVideo: "",
        adminNotes: "",
        status: "approved",
        isClosed: false,
        closedAt: null,
        createdAt: new Date("2026-05-19T12:00:00.000Z"),
        updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      },
    ]);

    await getMyDonationRequests(req, res);

    expect(DonationRequest.find).toHaveBeenCalledWith({
      createdBy: "user-5",
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      donations: [
        expect.objectContaining({
          _id: "donation-2",
          isFunded: true,
          remainingAmount: 0,
          progressPercent: 100,
        }),
      ],
    });
  });

  it("updates donation progress for approved requests", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const donation = {
      _id: "donation-3",
      fullName: "Mina",
      contact: "9800",
      location: "Lalitpur",
      helpType: "Medical",
      description: "Hospital bill",
      amountNeeded: 3000,
      raisedAmount: 900,
      donorCount: 2,
      urgency: "Urgent",
      qrImage: "",
      proofImage: "",
      proofVideo: "",
      adminNotes: "",
      status: "approved",
      isClosed: false,
      closedAt: null,
      createdAt: new Date("2026-05-19T12:00:00.000Z"),
      updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      save,
    };
    const req = {
      params: { id: "donation-3" },
      body: { amountReceived: "600", donorIncrement: "2" },
    };
    const res = createResponse();

    DonationRequest.findById.mockResolvedValue(donation);

    await recordDonationProgress(req, res);

    expect(donation.raisedAmount).toBe(1500);
    expect(donation.donorCount).toBe(4);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Donation progress updated",
      donation: expect.objectContaining({
        _id: "donation-3",
        raisedAmount: 1500,
        donorCount: 4,
        remainingAmount: 1500,
        progressPercent: 50,
      }),
    });
  });

  it("blocks closing a donation request for non-owners", async () => {
    const req = {
      user: { _id: "user-8", role: "user" },
      params: { id: "donation-4" },
    };
    const res = createResponse();

    DonationRequest.findById.mockResolvedValue({
      _id: "donation-4",
      createdBy: "user-1",
      status: "approved",
      isClosed: false,
    });

    await closeDonationRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "You do not have permission to close this donation request",
    });
  });

  it("closes an approved donation request for its owner", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const donation = {
      _id: "donation-5",
      fullName: "Nima",
      contact: "9800",
      location: "Bhaktapur",
      helpType: "Shelter",
      description: "Repair support",
      amountNeeded: 2500,
      raisedAmount: 2500,
      donorCount: 5,
      urgency: "Medium",
      qrImage: "",
      proofImage: "",
      proofVideo: "",
      adminNotes: "",
      status: "approved",
      isClosed: false,
      closedAt: null,
      createdBy: "user-9",
      createdAt: new Date("2026-05-19T12:00:00.000Z"),
      updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      save,
    };
    const req = {
      user: { _id: "user-9", role: "user" },
      params: { id: "donation-5" },
    };
    const res = createResponse();

    DonationRequest.findById.mockResolvedValue(donation);

    await closeDonationRequest(req, res);

    expect(donation.isClosed).toBe(true);
    expect(donation.closedAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Donation request closed",
      donation: expect.objectContaining({
        _id: "donation-5",
        isClosed: true,
        isFunded: true,
      }),
    });
  });

  it("updates the status and notes when approving a donation request", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const donation = {
      _id: "donation-6",
      fullName: "Asha",
      contact: "9800",
      location: "Kathmandu",
      helpType: "Medical",
      description: "Urgent support",
      amountNeeded: 1500,
      raisedAmount: 0,
      donorCount: 0,
      urgency: "Medium",
      qrImage: "",
      proofImage: "",
      proofVideo: "",
      adminNotes: "",
      status: "pending",
      isClosed: false,
      closedAt: null,
      createdAt: new Date("2026-05-19T12:00:00.000Z"),
      updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      save,
    };
    const req = {
      params: { id: "donation-6" },
      body: { adminNotes: "  Verified by admin  " },
    };
    const res = createResponse();

    DonationRequest.findById.mockResolvedValue(donation);

    await approveDonationRequest(req, res);

    expect(donation.status).toBe("approved");
    expect(donation.adminNotes).toBe("Verified by admin");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Donation request approved",
      donation: expect.objectContaining({
        _id: "donation-6",
        status: "approved",
        adminNotes: "Verified by admin",
      }),
    });
  });

  it("updates the status when rejecting a donation request", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const donation = {
      _id: "donation-7",
      fullName: "Rita",
      contact: "9800",
      location: "Biratnagar",
      helpType: "Medical",
      description: "Support needed",
      amountNeeded: 1200,
      raisedAmount: 0,
      donorCount: 0,
      urgency: "Medium",
      qrImage: "",
      proofImage: "",
      proofVideo: "",
      adminNotes: "",
      status: "pending",
      isClosed: false,
      closedAt: null,
      createdAt: new Date("2026-05-19T12:00:00.000Z"),
      updatedAt: new Date("2026-05-19T12:00:00.000Z"),
      save,
    };
    const req = {
      params: { id: "donation-7" },
      body: { adminNotes: "  Missing proof  " },
    };
    const res = createResponse();

    DonationRequest.findById.mockResolvedValue(donation);

    await rejectDonationRequest(req, res);

    expect(donation.status).toBe("rejected");
    expect(donation.adminNotes).toBe("Missing proof");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Donation request rejected",
      donation: expect.objectContaining({
        _id: "donation-7",
        status: "rejected",
        adminNotes: "Missing proof",
      }),
    });
  });
});
