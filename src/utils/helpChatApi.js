import { BASE_URL } from "./api";

function buildLocalHelpReply(message, preferredLanguage = "English") {
  const text = String(message || "").toLowerCase();
  const isNepali = preferredLanguage === "Nepali";

  if (/(suicide|self harm|kill myself|unsafe|abuse|violence|bleeding|attack|emergency|urgent)/i.test(text)) {
    return isNepali ? "यदि यो अत्यावश्यक हो भने तुरुन्तै वास्तविक सहयोगमा सम्पर्क गर्नुहोस्: प्रहरी १००, एम्बुलेन्स १०२, दमकल १०१, ट्राफिक १०३, बाल हेल्पलाइन १०९८, आत्महत्या रोकथाम ११६६, वा महिला तथा लैङ्गिक हिंसा सहायता ११४५।" : "If this is urgent, contact real support now: Police 100, Ambulance 102, Fire 101, Traffic 103, Child Helpline 1098, Suicide Prevention 1166, or Women and GBV Support 1145.";
  }

  if (/(report|crime|police|waste|municipality|traffic issue)/i.test(text)) {
    return isNepali ? "रिपोर्टिङ खोल्नुहोस् र तपाईंको समस्यासँग मिल्ने रिपोर्ट प्रकार छान्नुहोस्। प्रहरीसम्बन्धी केसका लागि अपराध रिपोर्टिङ, सडक घटनाका लागि ट्राफिक, र स्थानीय समस्याका लागि फोहोर वा नगरपालिका प्रयोग गर्नुहोस्।" : "Open Reporting and choose the report type that fits your issue. Use Crime Reporting for police cases, Traffic for road incidents, and Waste or Municipality for local issues.";
  }

  if (/(donate|donation|charity|support request)/i.test(text)) {
    return isNepali ? "स्वीकृत अनुरोधहरू हेर्न, सहयोग अनुरोध पेश गर्न, वा दान प्रक्रिया जारी राख्न दान सेक्सन खोल्नुहोस्।" : "Open Donate to browse approved requests, submit a support request, or continue the donation flow.";
  }

  if (/(counsel|counsellor|counselor|mental|talk to someone)/i.test(text)) {
    return isNepali ? "परामर्श खोल्नुहोस्, छोटो प्रारम्भिक फारम पूरा गर्नुहोस्, त्यसपछि परामर्शदाता सूची वा तपाईंका बुक गरिएका सेसनहरूतर्फ जानुहोस्।" : "Open Counseling, complete the short intake form, then continue to the counsellor list or your booked sessions.";
  }

  if (/(therapy|therapist)/i.test(text)) {
    return isNepali ? "बुकिङ, अपोइन्टमेन्ट वा थेरापिस्ट च्याट जारी राख्न थेरापी खोल्नुहोस्।" : "Open Therapy to continue with booking, appointments, or your therapist chat.";
  }

  if (/(fine|traffic fine|pay)/i.test(text)) {
    return isNepali ? "भुक्तानी प्रक्रिया जारी राख्न ट्राफिक खोल्नुहोस् र जरिवाना भुक्तानी विकल्प प्रयोग गर्नुहोस्।" : "Open Traffic and use the fine payment option to continue the payment flow.";
  }

  if (/(ngo|organization|organisation|shelter|referral|support group)/i.test(text)) {
    return isNepali ? "सहयोगी संस्थाहरूलाई कल वा इमेल गर्न एनजिओ सहयोग निर्देशिका खोल्नुहोस्। यदि आपतकालीन वा संकट नम्बर चाहिन्छ भने सहायता सेक्सन खोल्नुहोस्।" : "Open the NGO support directory to call or email support organizations. If you need emergency or crisis numbers instead, open Support for helplines.";
  }

  if (/(contact|helpline|phone|call|support number)/i.test(text)) {
    return isNepali ? "एक-ट्याप हेल्पलाइनका लागि सहायता खोल्नुहोस्: प्रहरी १००, दमकल १०१, एम्बुलेन्स १०२, ट्राफिक १०३, बाल हेल्पलाइन १०९८, आत्महत्या रोकथाम ११६६, र महिला तथा लैङ्गिक हिंसा सहायता ११४५। संस्थागत सम्पर्कका लागि एनजिओ निर्देशिका खोल्नुहोस्।" : "Open Support for one-tap helplines like Police 100, Fire 101, Ambulance 102, Traffic 103, Child Helpline 1098, Suicide Prevention 1166, and Women and GBV Support 1145. For organization contacts, open the NGO directory.";
  }

  return isNepali ? "म रिपोर्टिङ, दान, परामर्श, थेरापी, ट्राफिक जरिवाना, आपतकालीन सम्पर्क, र एनजिओ सहयोगमा मद्दत गर्न सक्छु। समस्या कसरी रिपोर्ट गर्ने, परामर्शदातासँग कसरी सम्पर्क गर्ने, एनजिओसम्म कसरी पुग्ने, वा जरिवाना कसरी तिर्ने भनेर सोधेर हेर्नुहोस्।" : "I can help with reporting, donations, counseling, therapy, traffic fines, emergency contacts, and NGO support. Try asking how to report an issue, contact a counsellor, reach an NGO, or pay a fine.";
}

export async function sendHelpChatMessage({ message, history, preferredLanguage = "English" }) {
  const safeMessage = String(message || "").trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${BASE_URL}/api/help-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: safeMessage,
        history,
        preferredLanguage,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !String(data?.reply || "").trim()) {
      return {
        ok: true,
        reply: buildLocalHelpReply(safeMessage, preferredLanguage),
        source: "local-fallback",
        configured: false,
      };
    }

    return data;
  } catch {
    return {
      ok: true,
      reply: buildLocalHelpReply(safeMessage, preferredLanguage),
      source: "local-fallback",
      configured: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
