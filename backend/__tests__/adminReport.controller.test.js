jest.mock("../src/models/Report", () => ({
  find: jest.fn(),
}));

const Report = require("../src/models/Report");
const { getAllReports } = require("../src/controllers/adminReport.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("admin report controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows only admins to list all reports", async () => {
    const req = {
      user: { _id: "user-1", role: "user" },
      query: {},
    };
    const res = createResponse();

    await getAllReports(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Admin only",
    });
  });

  it("returns filtered admin report data with mapped staff and creator info", async () => {
    const createdAt = new Date("2026-05-19T10:00:00.000Z");
    const req = {
      user: { _id: "admin-1", role: "admin" },
      query: {
        status: "Open",
        assigned: "Assigned",
        department: "police",
        q: "theft",
      },
    };
    const res = createResponse();

    Report.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: "report-1",
                reportCode: "AT-2026-000111",
                department: "police",
                type: "Theft",
                area: "Kathmandu",
                description: "Phone stolen",
                priority: "High",
                status: "Open",
                createdAt,
                createdBy: {
                  _id: "user-1",
                  fullName: "Asha Rai",
                  role: "user",
                  email: "asha@example.com",
                },
                assignedTo: {
                  _id: "police-1",
                  fullName: "Officer Rana",
                  role: "police",
                  email: "officer@example.com",
                },
              },
            ]),
          }),
        }),
      }),
    });

    await getAllReports(req, res);

    expect(Report.find).toHaveBeenCalledWith({
      status: "Open",
      department: "police",
      assignedTo: { $ne: null },
      $or: [
        { reportCode: /theft/i },
        { type: /theft/i },
        { area: /theft/i },
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reports: [
        expect.objectContaining({
          _id: "report-1",
          reportCode: "AT-2026-000111",
          department: "police",
          type: "Theft",
          assignedTo: {
            _id: "police-1",
            fullName: "Officer Rana",
            role: "police",
            email: "officer@example.com",
          },
          createdBy: {
            _id: "user-1",
            fullName: "Asha Rai",
            role: "user",
            email: "asha@example.com",
          },
        }),
      ],
    });
  });
});
