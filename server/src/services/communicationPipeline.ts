import User from "../models/user";
import CommunicationLog from "../models/CommunicationLog";
import { parseProfile } from "./parseProfile";
import { findMatchingSchemes } from "./matchingService";
import { formatMatchResponse } from "./matchResponseFormatter";

export interface PipelineResult {
  profile: any;
  matches: any[];
  durationMs: number;
  user: any | null;
}

export async function processUnifiedPipeline(
  message: string,
  channel: "WhatsApp" | "SMS" | "Voice" | "Email",
  userContact: string
): Promise<PipelineResult> {
  const startTime = Date.now();
  let user = null;

  // Clean the phone number or email for lookup
  const cleanContact = userContact.trim();

  // 1. Identify User to unify context/history
  try {
    if (channel === "Email") {
      user = await User.findOne({ email: cleanContact.toLowerCase() });
    } else {
      // Clean phone number (remove non-digits or Twilio prefix)
      const cleanPhone = cleanContact.replace("whatsapp:", "").replace(/[^\d]/g, "");
      // Match end of number (last 10 digits) to avoid country code discrepancies
      if (cleanPhone.length >= 10) {
        const partialPhone = cleanPhone.slice(-10);
        user = await User.findOne({ phone: new RegExp(partialPhone + "$") });
      }
    }
  } catch (err) {
    console.error("[Pipeline] User lookup error:", err);
  }

  // 2. Log Incoming Message
  let incomingLog: any;
  try {
    incomingLog = new CommunicationLog({
      channel,
      sender: cleanContact,
      direction: "Incoming",
      text: message,
      user_id: user?._id,
    });
    await incomingLog.save();
  } catch (err) {
    console.error("[Pipeline] Log incoming error:", err);
  }

  let profile: any = {};
  let matches: any[] = [];
  let success = true;

  try {
    // Retrieve past incoming logs for context continuation
    let cumulativeMessage = message;
    try {
      const pastLogs = await CommunicationLog.find({
        sender: cleanContact,
        direction: "Incoming",
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

      if (pastLogs && pastLogs.length > 0) {
        // Filter out duplicate of the currently enqueued incoming log if already saved
        const otherLogs = pastLogs.filter(l => l.text !== message);
        if (otherLogs.length > 0) {
          const historyText = otherLogs.reverse().map(l => l.text).join(" \n ");
          cumulativeMessage = `${historyText} \n ${message}`;
          console.log(`[Pipeline] Preserving conversation history context for ${cleanContact}: "${cumulativeMessage}"`);
        }
      }
    } catch (err) {
      console.error("[Pipeline] Context lookup error:", err);
    }

    // 3. Reuse profile parsing
    profile = await parseProfile(cumulativeMessage);

    // If we have user details and parsed profile was empty/partial, merge context
    if (user) {
      profile.name = profile.name || user.name;
      profile.age = profile.age || (user.age ? Number(user.age) : null);
      profile.state = profile.state || user.state;
      profile.occupation = profile.occupation || user.occupation;
      profile.income = profile.income || (user.income ? Number(user.income) : null);
      profile.education = profile.education || user.education;
    }

    // 4. Reuse matching engine
    matches = await findMatchingSchemes(profile);
  } catch (err) {
    console.error("[Pipeline] Processing error:", err);
    success = false;
  }

  const durationMs = Date.now() - startTime;

  // 5. Update incoming log with success status and processing duration
  if (incomingLog) {
    try {
      incomingLog.success = success;
      incomingLog.durationMs = durationMs;
      await incomingLog.save();
    } catch (err) {
      console.error("[Pipeline] Update log error:", err);
    }
  }

  return {
    profile,
    matches: formatMatchResponse(matches),
    durationMs,
    user,
  };
}
