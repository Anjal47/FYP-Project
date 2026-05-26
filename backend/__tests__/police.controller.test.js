jest.mock("../src/models/Report", () => ({
  findById: jest.fn(),
}));

const Report = require("../src/models/Report");
const {
  getPoliceReports,
  updatePoliceReport,
} = require("../src/controllers/policeController");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("police controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restricts police report listing to police users", async () => {
    const req = {
      user: { _id: "user-1", role: "user" },
      query: {},
    };
    const res = createResponse();

    await getPoliceReports(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Police only",
    });
  });

  it("blocks police updates on municipality complaints", async () => {
    const req = {
      user: { _id: "police-1", role: "police" },
      params: { id: "report-1" },
      body: { action: "assignToMe" },
    };
    const res = createResponse();

    Report.findById.mockResolvedValue({
      _id: "report-1",
      department: "municipality",
      type: "Waste dump",
    });

    await updatePoliceReport(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Not a police report",
    });
  });

  it("assigns a police report to the current officer", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const report = {
      _id: "report-2",
      department: "police",
      type: "Theft",
      assignedTo: null,
      status: "Open",
      save,
    };
    const req = {
      user: { _id: "police-1", role: "police" },
      params: { id: "report-2" },
      body: { action: "assignToMe" },
    };
    const res = createResponse();

    Report.findById.mockResolvedValue(report);

    await updatePoliceReport(req, res);

    expect(report.assignedTo).toBe("police-1");
    expect(report.status).toBe("Assigned");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Assigned",
      report,
    });
  });

  it("marks a police report as resolved", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const report = {
      _id: "report-3",
      department: "police",
      type: "Assault",
      assignedTo: "police-1",
      status: "Assigned",
      save,
    };
    const req = {
      user: { _id: "police-1", role: "police" },
      params: { id: "report-3" },
      body: { action: "resolve" },
    };
    const res = createResponse();

    Report.findById.mockResolvedValue(report);

    await updatePoliceReport(req, res);

    expect(report.status).toBe("Resolved");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "Resolved",
      report,
    });
  });
});
