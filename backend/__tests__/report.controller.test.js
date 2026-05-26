jest.mock("../src/models/Report", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../src/utils/reportCode", () => ({
  generateReportCode: jest.fn(),
}));

const Report = require("../src/models/Report");
const { generateReportCode } = require("../src/utils/reportCode");
const {
  createReport,
  getReportStatusByCode,
} = require("../src/controllers/report.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("report controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated report creation", async () => {
    const req = {
      body: { type: "Crime", area: "Kathmandu" },
    };
    const res = createResponse();

    await createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Unauthorized",
    });
    expect(Report.create).not.toHaveBeenCalled();
  });

  it("validates required type and area fields", async () => {
    const req = {
      user: { _id: "user-1" },
      body: { description: "Missing core fields" },
    };
    const res = createResponse();

    await createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "type and area required",
    });
    expect(Report.create).not.toHaveBeenCalled();
  });

  it("builds a normalized report from multipart fallback payload data", async () => {
    const createdAt = new Date("2026-05-19T10:00:00.000Z");
    const req = {
      protocol: "https",
      get: jest.fn(() => "example.com"),
      user: { _id: "user-1" },
      body: {
        payload: JSON.stringify({
          type: "Waste dump",
          area: "Ward 7",
          description: "Overflowing garbage",
          geoLocation: {
            latitude: 27.7172,
            longitude: 85.324,
            accuracy: 10,
            capturedAt: "2026-05-19T09:55:00.000Z",
          },
        }),
      },
      files: {
        photo: [{ filename: "photo.png" }],
      },
    };
    const res = createResponse();

    generateReportCode.mockResolvedValue("AT-2026-000001");
    Report.create.mockResolvedValue({
      _id: "report-1",
      reportCode: "AT-2026-000001",
      department: "municipality",
      type: "Waste dump",
      area: "Ward 7",
      geoLocation: {
        latitude: 27.7172,
        longitude: 85.324,
        accuracy: 10,
        capturedAt: new Date("2026-05-19T09:55:00.000Z"),
      },
      description: "Overflowing garbage",
      photoUrl: "https://example.com/uploads/reports/photo.png",
      videoUrl: "",
      audioUrl: "",
      priority: "Medium",
      status: "Open",
      createdAt,
    });

    await createReport(req, res);

    expect(generateReportCode).toHaveBeenCalledTimes(1);
    expect(Report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: "user-1",
        reportCode: "AT-2026-000001",
        department: "municipality",
        type: "Waste dump",
        area: "Ward 7",
        description: "Overflowing garbage",
        priority: "Medium",
        status: "Open",
        photoUrl: "https://example.com/uploads/reports/photo.png",
        videoUrl: "",
        audioUrl: "",
        geoLocation: {
          latitude: 27.7172,
          longitude: 85.324,
          accuracy: 10,
          capturedAt: new Date("2026-05-19T09:55:00.000Z"),
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        message: "Report submitted",
        report: expect.objectContaining({
          reportCode: "AT-2026-000001",
          department: "municipality",
          type: "Waste dump",
          area: "Ward 7",
          photoUrl: "https://example.com/uploads/reports/photo.png",
          priority: "Medium",
          status: "Open",
        }),
      })
    );
  });

  it("blocks report status access for unauthorized viewers", async () => {
    const req = {
      user: { _id: "user-2", role: "user" },
      params: { reportCode: "AT-2026-000001" },
    };
    const res = createResponse();

    Report.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            reportCode: "AT-2026-000001",
            department: "police",
            type: "Theft",
            area: "Kathmandu",
            description: "Phone stolen",
            priority: "High",
            status: "Open",
            createdAt: new Date("2026-05-19T10:00:00.000Z"),
            createdBy: { _id: "user-1", fullName: "Asha", role: "user" },
            assignedTo: null,
          }),
        }),
      }),
    });

    await getReportStatusByCode(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Not allowed to view this report",
    });
  });

  it("returns report status details for the report owner", async () => {
    const req = {
      user: { _id: "user-1", role: "user" },
      params: { reportCode: "AT-2026-000001" },
    };
    const res = createResponse();

    Report.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            reportCode: "AT-2026-000001",
            department: "police",
            type: "Theft",
            area: "Kathmandu",
            description: "Phone stolen",
            priority: "High",
            status: "Assigned",
            createdAt: new Date("2026-05-19T10:00:00.000Z"),
            createdBy: { _id: "user-1", fullName: "Asha", role: "user" },
            assignedTo: { fullName: "Officer Rana", role: "police" },
          }),
        }),
      }),
    });

    await getReportStatusByCode(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      report: expect.objectContaining({
        reportCode: "AT-2026-000001",
        department: "police",
        type: "Theft",
        status: "Assigned",
        assignedTo: {
          fullName: "Officer Rana",
          role: "police",
        },
      }),
    });
  });
});
