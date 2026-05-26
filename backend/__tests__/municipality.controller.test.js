jest.mock("../src/models/Report", () => ({
  findById: jest.fn(),
}));

const Report = require("../src/models/Report");
const {
  updateMunicipalityReport,
} = require("../src/controllers/municipalityController");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("municipality controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks updates for non-municipality complaints", async () => {
    const req = {
      user: { _id: "muni-1" },
      params: { id: "report-1" },
      body: { take: true },
    };
    const res = createResponse();
    const next = jest.fn();

    Report.findById.mockResolvedValue({
      _id: "report-1",
      department: "police",
      type: "Theft",
    });

    await updateMunicipalityReport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Not a municipality complaint",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("lets a municipality staff member take an open report", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const report = {
      _id: "report-2",
      department: "municipality",
      type: "Waste overflow",
      assignedTo: null,
      status: "Open",
      save,
    };
    const updatedReport = { _id: "report-2", assignedTo: { _id: "muni-1" }, status: "Assigned" };
    const req = {
      user: { _id: "muni-1" },
      params: { id: "report-2" },
      body: { take: true },
    };
    const res = createResponse();
    const next = jest.fn();

    Report.findById
      .mockResolvedValueOnce(report)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedReport),
        }),
      });

    await updateMunicipalityReport(req, res, next);

    expect(report.assignedTo).toBe("muni-1");
    expect(report.status).toBe("Assigned");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      report: updatedReport,
    });
  });

  it("resolves a report only when assigned to the current municipality user", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const report = {
      _id: "report-3",
      department: "municipality",
      type: "Road pothole",
      assignedTo: "muni-1",
      status: "Assigned",
      save,
    };
    const updatedReport = { _id: "report-3", assignedTo: { _id: "muni-1" }, status: "Resolved" };
    const req = {
      user: { _id: "muni-1" },
      params: { id: "report-3" },
      body: { status: "Resolved" },
    };
    const res = createResponse();
    const next = jest.fn();

    Report.findById
      .mockResolvedValueOnce(report)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedReport),
        }),
      });

    await updateMunicipalityReport(req, res, next);

    expect(report.status).toBe("Resolved");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      report: updatedReport,
    });
  });
});
