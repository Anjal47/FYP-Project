/* global AbortSignal */

const APP_CONTEXT = `
AngelTouch is a mobile app focused on support, reporting, and safety flows in Nepal.

Main app areas:
- Reporting: users can report crime, traffic issues, and waste or municipality issues.
- Donations: users can browse approved requests, donate, or ask for support.
- Counseling: users can submit a counseling form, choose a counsellor, and book sessions.
- Therapy: users can book therapy support and chat with providers.
- Traffic: users can check traffic information and pay fines.
- Support: users can view emergency and wellbeing contact numbers.
- NGO Support: users can reach support organizations for referrals, crisis help, and practical guidance.

Important support numbers shown in the app:
- Police: 100
- Fire Service: 101
- Ambulance: 102
- Traffic Control: 103
- Child Helpline: 1098
- Suicide Prevention Helpline: 1166
- Women and GBV Support: 1145
`.trim();

const HELP_CHAT_INSTRUCTIONS = `
You are AngelTouch's in-app help assistant.

Your job:
- Give short, clear, practical answers about how to use the app.
- Help users find the right app section for reporting, donations, counseling, therapy, traffic, and support.
- If the user describes immediate danger, self-harm risk, violence, abuse, or urgent medical risk, tell them to contact emergency or crisis support right away using the numbers in the app.
- Do not claim to file reports, book appointments, or contact services for the user.
- Do not give legal, medical, or mental health diagnosis.
- If something is unclear, say what you do know and suggest the closest app area to open next.
- Keep replies under 120 words unless the user asks for more detail.

Use this app context:
${APP_CONTEXT}
`.trim();

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-8)
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = String(item?.content || "").trim();

      if (!content) return null;
      return { role, content: content.slice(0, 500) };
    })
    .filter(Boolean);
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];

  for (const item of payload?.output || []) {
    if (item?.type !== "message") continue;

    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) {
        parts.push(String(content.text).trim());
      }
    }
  }

  return parts.join("\n").trim();
}

function classifyHelpChatError({ status, errorType, errorCode, errorMessage }) {
  const text = String(errorMessage || "").toLowerCase();
  const type = String(errorType || "").toLowerCase();
  const code = String(errorCode || "").toLowerCase();

  if (
    status === 429 ||
    type.includes("insufficient_quota") ||
    code.includes("insufficient_quota") ||
    text.includes("exceeded your current quota") ||
    text.includes("billing") ||
    text.includes("usage limit")
  ) {
    return "quota_exceeded";
  }

  return "temporary_error";
}

function buildFallbackReply(message, mode = "default", preferredLanguage = "English") {
  const text = String(message || "").toLowerCase();
  const isNepali = preferredLanguage === "Nepali";

  if (mode === "missing_key") {
    const guidance = buildFallbackReply(message, "default", preferredLanguage);

    return isNepali
      ? `सर्भरमा live AI अहिले कन्फिगर गरिएको छैन। तर म अझै app navigation मा मद्दत गर्न सक्छु। ${guidance}`
      : `Live AI is not configured on the server yet. I can still help with app navigation. ${guidance}`;
  }

  if (mode === "temporary_error") {
    const guidance = buildFallbackReply(message, "default", preferredLanguage);

    return isNepali
      ? `Live AI reply अहिले अस्थायी रूपमा उपलब्ध छैन। तर म अझै app navigation मा मद्दत गर्न सक्छु। ${guidance}`
      : `The live AI reply is temporarily unavailable. I can still help with app navigation. ${guidance}`;
  }

  if (mode === "quota_exceeded") {
    const guidance = buildFallbackReply(message, "default", preferredLanguage);

    return isNepali
      ? `Live AI अहिले चल्नका लागि server को OpenAI billing वा quota पुगेको छैन। API billing मिलाएपछि live reply फेरि काम गर्छ। यसबीचमा म app navigation मा मद्दत गर्न सक्छु। ${guidance}`
      : `Live AI is not active right now because the server's OpenAI billing or quota needs attention. Once API billing is set up, live replies will work again. I can still help with app navigation. ${guidance}`;
  }

  if (/(suicide|self harm|kill myself|unsafe|abuse|violence|bleeding|attack|emergency|urgent)/i.test(text)) {
    return isNepali
      ? "यदि यो अत्यावश्यक हो भने तुरुन्तै वास्तविक सहयोगमा सम्पर्क गर्नुहोस्: प्रहरी १००, एम्बुलेन्स १०२, दमकल १०१, ट्राफिक १०३, बाल हेल्पलाइन १०९८, आत्महत्या रोकथाम ११६६, वा महिला तथा लैङ्गिक हिंसा सहायता ११४५।"
      : "If this is urgent, please contact real support now: Police 100, Ambulance 102, Fire 101, Traffic 103, Child Helpline 1098, Suicide Prevention 1166, or Women and GBV Support 1145.";
  }

  if (/(report|crime|police|waste|municipality|traffic issue)/i.test(text)) {
    return isNepali
      ? "रिपोर्टिङ खोल्नुहोस् र तपाईंको समस्यासँग मिल्ने रिपोर्ट प्रकार छान्नुहोस्। अपराधसम्बन्धी केसका लागि Police वा Crime Reporting, सडक समस्याका लागि Traffic, र स्थानीय समस्याका लागि Municipality वा Waste रिपोर्टिङ प्रयोग गर्नुहोस्।"
      : "Open the reporting area and choose the report type that fits your issue. For crime use Police or Crime Reporting, for road issues use Traffic, and for waste or local issues use the municipality or waste reporting flow.";
  }

  if (/(donate|donation|charity|support request)/i.test(text)) {
    return isNepali
      ? "स्वीकृत अनुरोधहरू हेर्न, सहयोग अनुरोध पेश गर्न, वा दान प्रक्रिया जारी राख्न Donate वा Charity सेक्शन खोल्नुहोस्।"
      : "Open Donate or Charity to browse approved requests, submit a support request, or continue with the donation flow.";
  }

  if (/(counsel|counsellor|counselor|mental|talk to someone)/i.test(text)) {
    return isNepali
      ? "Counseling खोल्नुहोस्, छोटो intake form पूरा गर्नुहोस्, र त्यसपछि counsellor सूची वा तपाईंका booked sessions मा जानुहोस्।"
      : "Open Counseling, complete the short intake form, then continue to the counsellor list or your booked sessions.";
  }

  if (/(therapy|therapist)/i.test(text)) {
    return isNepali
      ? "Therapy खोल्नुहोस् र therapy support flow छान्नुहोस्, त्यसपछि booking वा therapist chat मा जानुहोस्।"
      : "Open Therapy to choose the therapy support flow, then continue to booking or your therapist chat if you already have a session.";
  }

  if (/(fine|traffic fine|pay)/i.test(text)) {
    return isNepali
      ? "भुक्तानी प्रक्रिया जारी राख्न Traffic खोल्नुहोस् र fine payment विकल्प प्रयोग गर्नुहोस्।"
      : "Open Traffic and use the fine payment option to continue the payment flow.";
  }

  if (/(ngo|organization|organisation|shelter|referral|support group)/i.test(text)) {
    return isNepali
      ? "सहयोगी संस्थाहरूलाई call वा email गर्न NGO support directory खोल्नुहोस्। यदि emergency वा crisis numbers चाहिन्छ भने Support खोल्नुहोस्।"
      : "Open the NGO support directory to call or email support organizations. If you need emergency or crisis numbers instead, open Support for helplines.";
  }

  if (/(contact|helpline|phone|call|support number)/i.test(text)) {
    return isNepali
      ? "एक-ट्याप helplines का लागि Support खोल्नुहोस्। एपमा Police 100, Fire 101, Ambulance 102, Traffic 103, Child Helpline 1098, Suicide Prevention 1166, र Women and GBV Support 1145 छन्। संस्थागत सम्पर्कका लागि NGO directory खोल्नुहोस्।"
      : "Open Support for one-tap helplines. The app lists Police 100, Fire 101, Ambulance 102, Traffic 103, Child Helpline 1098, Suicide Prevention 1166, and Women and GBV Support 1145. For organization contacts, open the NGO directory.";
  }

  return isNepali
    ? "म रिपोर्टिङ, दान, परामर्श, थेरापी, ट्राफिक जरिवाना, आपतकालीन सम्पर्क, र एनजिओ सहयोगमा मद्दत गर्न सक्छु। जस्तै यस्तो सोधेर हेर्नुहोस्: समस्या कसरी रिपोर्ट गर्ने, परामर्शदातासँग कसरी सम्पर्क गर्ने, एनजिओसम्म कसरी पुग्ने, वा जरिवाना कसरी तिर्ने?"
    : "I can help with reporting, donations, counseling, therapy, traffic fines, emergency contacts, and NGO support. Try asking something like: how do I report an issue, how do I contact a counsellor, how do I reach an NGO, or how do I pay a fine?";
}

async function askHelpChat(req, res) {
  const message = String(req.body?.message || "").trim();
  const history = sanitizeHistory(req.body?.history);
  const preferredLanguage = String(req.body?.preferredLanguage || "English").trim();

  if (!message) {
    return res.status(400).json({ ok: false, message: "Message is required" });
  }

  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const model = String(process.env.OPENAI_HELP_CHAT_MODEL || "gpt-4o-mini").trim();

  if (!apiKey) {
    return res.json({
      ok: true,
      reply: buildFallbackReply(message, "missing_key", preferredLanguage),
      source: "fallback",
      configured: false,
    });
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: `${HELP_CHAT_INSTRUCTIONS}\n\nReply language: ${preferredLanguage === "Nepali" ? "Nepali" : "English"}.`,
        input: [...history, { role: "user", content: message.slice(0, 600) }],
        max_output_tokens: 220,
        store: false,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const payload = await openAiResponse.json().catch(() => ({}));

    if (!openAiResponse.ok) {
      const errMessage =
        payload?.error?.message || payload?.message || "Failed to generate help reply";
      const helpChatError = new Error(errMessage);
      helpChatError.status = openAiResponse.status;
      helpChatError.errorType = payload?.error?.type;
      helpChatError.errorCode = payload?.error?.code;
      throw helpChatError;
    }

    const reply = extractResponseText(payload);

    return res.json({
      ok: true,
      reply: reply || buildFallbackReply(message, "default", preferredLanguage),
      source: "openai",
      configured: true,
    });
  } catch (error) {
    console.error("Help chat AI error:", error.message);
    const fallbackMode = classifyHelpChatError({
      status: error?.status,
      errorType: error?.errorType,
      errorCode: error?.errorCode,
      errorMessage: error?.message,
    });

    return res.json({
      ok: true,
      reply: buildFallbackReply(message, fallbackMode, preferredLanguage),
      source: "fallback",
      configured: fallbackMode !== "quota_exceeded",
      reason: fallbackMode,
    });
  }
}

module.exports = {
  askHelpChat,
};
