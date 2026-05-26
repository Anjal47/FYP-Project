jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/CounselingRequest", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../src/models/CounselingAppointment", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/models/CounselingReview", () => ({
  aggregate: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require("../src/models/User");
const CounselingRequest = require("../src/models/CounselingRequest");
const CounselingAppointment = require("../src/models/CounselingAppointment");
const {
  createCounselingRequest,
  bookCounselingAppointment,
} = require("../src/controllers/counselingController");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("counseling controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates required intake fields", async () => {
    const req = {
      user: { _id: "user-1" },
      body: { problem: "Stress" },
    };
    const res = createResponse();

    await createCounselingRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "problem, age, gender, language, mode are required",
    });
    expect(CounselingRequest.create).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric or non-positive age", async () => {
    const req = {
      user: { _id: "user-1" },
      body: {
        problem: "Stress",
        age: "zero",
        gender: "Female",
        language: "English",
        mode: "Chat",
      },
    };
    const res = createResponse();

    await createCounselingRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "age must be a valid number",
    });
  });

  it("creates a counseling request with normalized values", async () => {
    const req = {
      user: { _id: "user-1" },
      body: {
        problem: "  Stress and anxiety  ",
        age: "22",
        gender: "Female",
        language: "English",
        mode: "Chat",
        description: "  Need support soon  ",
      },
    };
    const res = createResponse();

    CounselingRequest.create.mockResolvedValue({
      _id: "request-1",
      status: "Open",
    });

    await createCounselingRequest(req, res);

    expect(CounselingRequest.create).toHaveBeenCalledWith({
      user: "user-1",
      problem: "Stress and anxiety",
      age: 22,
      gender: "Female",
      language: "English",
      mode: "Chat",
      description: "Need support soon",
      status: "Open",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      request: { _id: "request-1", id: "request-1", status: "Open" },
    });
  });

  it("blocks bookings when the counsellor slot is already taken", async () => {
    const req = {
      user: { _id: "user-1" },
      body: {
        counsellorId: "c-1",
        requestId: "r-1",
        month: " June ",
        day: "12",
        slot: " 10:00 AM ",
      },
    };
    const res = createResponse();

    User.findOne.mockResolvedValue({ _id: "c-1", role: "counsellor", isActive: true });
    CounselingRequest.findOne.mockResolvedValue({ _id: "r-1", user: "user-1" });
    CounselingAppointment.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ _id: "appt-1" }) });

    await bookCounselingAppointment(req, res);

    expect(CounselingAppointment.findOne).toHaveBeenCalledWith({
      counsellorId: "c-1",
      month: "June",
      day: 12,
      slot: "10:00 AM",
      status: { $in: ["pending", "confirmed"] },
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "That slot is already booked for this counsellor.",
    });
  });

  it("blocks users from double-booking the same time slot", async () => {
    const req = {
      user: { _id: "user-1" },
      body: {
        counsellorId: "c-1",
        requestId: "r-1",
        month: "June",
        day: "12",
        slot: "10:00 AM",
      },
    };
    const res = createResponse();

    User.findOne.mockResolvedValue({ _id: "c-1", role: "counsellor", isActive: true });
    CounselingRequest.findOne.mockResolvedValue({ _id: "r-1", user: "user-1" });
    CounselingAppointment.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ _id: "appt-2", counsellorId: "c-2" }),
      });

    await bookCounselingAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "You already have a session booked at this time. Please choose another slot.",
    });
  });

  it("creates a counseling appointment and updates the request status", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const requestDoc = {
      _id: "r-1",
      status: "Open",
      counsellor: null,
      save,
    };
    const req = {
      user: { _id: "user-1" },
      body: {
        counsellorId: "c-1",
        requestId: "r-1",
        month: " June ",
        day: "12",
        slot: " 10:00 AM ",
        notes: "  Bring previous notes  ",
      },
    };
    const res = createResponse();

    User.findOne.mockResolvedValue({ _id: "c-1", role: "counsellor", isActive: true });
    CounselingRequest.findOne.mockResolvedValue(requestDoc);
    CounselingAppointment.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) });
    CounselingAppointment.create.mockResolvedValue({
      _id: "appt-3",
      status: "pending",
    });

    await bookCounselingAppointment(req, res);

    expect(CounselingAppointment.create).toHaveBeenCalledWith({
      userId: "user-1",
      counsellorId: "c-1",
      requestId: "r-1",
      month: "June",
      day: 12,
      slot: "10:00 AM",
      notes: "  Bring previous notes  ",
      status: "pending",
    });
    expect(requestDoc.status).toBe("Matched");
    expect(requestDoc.counsellor).toBe("c-1");
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      appointment: {
        _id: "appt-3",
        id: "appt-3",
        status: "pending",
        month: "June",
        day: 12,
        slot: "10:00 AM",
      },
    });
  });
});
