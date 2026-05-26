jest.mock("../src/utils/chatAppointmentResolver", () => ({
  resolveChatFromAppointment: jest.fn(),
}));

jest.mock("../src/models/Conversation", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/models/Message", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

const { resolveChatFromAppointment } = require("../src/utils/chatAppointmentResolver");
const Conversation = require("../src/models/Conversation");
const Message = require("../src/models/Message");
const {
  getMessages,
  sendMessage,
} = require("../src/controllers/chat.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("chat controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires message text before sending", async () => {
    const req = {
      params: { appointmentId: "appt-1" },
      body: { text: "   " },
      user: { _id: "user-1", role: "user" },
    };
    const res = createResponse();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Message text required",
    });
  });

  it("creates a conversation and sends a user message with realtime emit", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const convo = {
      _id: "convo-1",
      appointmentId: "appt-1",
      serviceType: "counseling",
      userId: "user-1",
      staffId: "staff-1",
      staffRole: "counsellor",
      lastMessageAt: null,
      save,
    };
    const msg = {
      _id: "msg-1",
      conversationId: "convo-1",
      senderId: "user-1",
      senderRole: "user",
      text: "Hello counselor",
      readByUser: true,
      readByStaff: false,
    };
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    const req = {
      params: { appointmentId: "appt-1" },
      body: { text: "  Hello counselor  " },
      user: { _id: "user-1", role: "user" },
      io: { to },
    };
    const res = createResponse();

    resolveChatFromAppointment.mockResolvedValue({
      appointmentId: "appt-1",
      serviceType: "counseling",
      userId: "user-1",
      staffId: "staff-1",
      staffRole: "counsellor",
    });
    Conversation.findOne.mockResolvedValue(null);
    Conversation.create.mockResolvedValue(convo);
    Message.create.mockResolvedValue(msg);

    await sendMessage(req, res);

    expect(Conversation.create).toHaveBeenCalledWith({
      appointmentId: "appt-1",
      serviceType: "counseling",
      userId: "user-1",
      staffId: "staff-1",
      staffRole: "counsellor",
      lastMessageAt: null,
    });
    expect(Message.create).toHaveBeenCalledWith({
      conversationId: "convo-1",
      senderId: "user-1",
      senderRole: "user",
      text: "Hello counselor",
      readByUser: true,
      readByStaff: false,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith("appt:appt-1");
    expect(emit).toHaveBeenCalledWith("chat:newMessage", {
      appointmentId: "appt-1",
      message: msg,
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: msg,
    });
  });

  it("blocks message access for users outside the conversation", async () => {
    const req = {
      params: { appointmentId: "appt-1" },
      user: { _id: "user-2", role: "user" },
    };
    const res = createResponse();

    resolveChatFromAppointment.mockResolvedValue({
      appointmentId: "appt-1",
      serviceType: "counseling",
      userId: "user-1",
      staffId: "staff-1",
      staffRole: "counsellor",
    });
    Conversation.findOne.mockResolvedValue({
      _id: "convo-1",
      appointmentId: "appt-1",
      serviceType: "counseling",
      userId: "user-1",
      staffId: "staff-1",
    });

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Not allowed",
    });
  });
});
