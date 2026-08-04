import { Request, Response } from "express";
import { processUnifiedPipeline } from "../services/communicationPipeline";
import { WhatsAppAdapter } from "../adapters/WhatsAppAdapter";
import { SMSAdapter } from "../adapters/SMSAdapter";
import { VoiceAdapter } from "../adapters/VoiceAdapter";
import { EmailAdapter } from "../adapters/EmailAdapter";
import CommunicationLog from "../models/CommunicationLog";

// 1. WhatsApp Webhook Handler
export const receiveWhatsApp = async (req: Request, res: Response) => {
  try {
    const message = (req.body.Body || "").trim();
    const from = (req.body.From || "").trim();

    if (message.toLowerCase().startsWith("join ")) {
      res.set("Content-Type", "text/xml");
      return res.send(`
<Response>
  <Message>Welcome to Setu AI Welfare Assistant! 🌟

Please describe your profile details to find matching government welfare schemes. For example:
"I am a 45-year-old female farmer from Uttar Pradesh with an annual income of ₹1.2 Lakh."
  </Message>
</Response>
`);
    }

    if (!message) {
      res.set("Content-Type", "text/xml");
      return res.send(WhatsAppAdapter.generateTwiML("Please send details like your age, state, occupation, and income."));
    }

    // Call unified pipeline
    const { matches, user } = await processUnifiedPipeline(message, "WhatsApp", from);

    // Format WhatsApp response
    const replyText = WhatsAppAdapter.formatResponse(matches);

    // Track outbound message in CommunicationLog
    const outgoingLog = new CommunicationLog({
      channel: "WhatsApp",
      sender: from,
      direction: "Outgoing",
      text: replyText,
      user_id: user?._id,
    });
    await outgoingLog.save();

    res.set("Content-Type", "text/xml");
    return res.send(WhatsAppAdapter.generateTwiML(replyText));
  } catch (err: any) {
    console.error("WhatsApp Webhook Error:", err);
    res.set("Content-Type", "text/xml");
    return res.send(WhatsAppAdapter.generateTwiML("Sorry, something went wrong. Please try again later."));
  }
};

// 2. SMS Webhook Handler
export const receiveSMS = async (req: Request, res: Response) => {
  try {
    const message = (req.body.Body || "").trim();
    const from = (req.body.From || "").trim();

    if (!message) {
      res.set("Content-Type", "text/xml");
      return res.send(SMSAdapter.generateTwiML("Please SMS details like your age, state, occupation, and income to find matching schemes."));
    }

    // Call unified pipeline
    const { matches, user } = await processUnifiedPipeline(message, "SMS", from);

    // Format SMS response
    const replyText = SMSAdapter.formatResponse(matches);

    // Track outbound message in CommunicationLog
    const outgoingLog = new CommunicationLog({
      channel: "SMS",
      sender: from,
      direction: "Outgoing",
      text: replyText,
      user_id: user?._id,
    });
    await outgoingLog.save();

    res.set("Content-Type", "text/xml");
    return res.send(SMSAdapter.generateTwiML(replyText));
  } catch (err: any) {
    console.error("SMS Webhook Error:", err);
    res.set("Content-Type", "text/xml");
    return res.send(SMSAdapter.generateTwiML("Setu AI: Processing error occurred. Please try later."));
  }
};

// 3. Voice Call Greeting Handler
export const receiveVoiceCall = async (_req: Request, res: Response) => {
  res.set("Content-Type", "text/xml");
  return res.send(VoiceAdapter.generateGreeting());
};

// 4. Voice Input Processor Handler
export const processVoiceInput = async (req: Request, res: Response) => {
  try {
    const speechResult = (req.body.SpeechResult || "").trim();
    const from = (req.body.From || "").trim();

    console.log(`[Voice IVR Input] Speech result: "${speechResult}" from ${from}`);

    if (!speechResult) {
      res.set("Content-Type", "text/xml");
      return res.send(VoiceAdapter.generateRepeatPrompt());
    }

    // Call unified pipeline
    const { matches, user } = await processUnifiedPipeline(speechResult, "Voice", from);

    // Format Voice speech response
    const speechText = VoiceAdapter.formatVoiceResponse(matches);

    // Track outbound message in CommunicationLog
    const outgoingLog = new CommunicationLog({
      channel: "Voice",
      sender: from,
      direction: "Outgoing",
      text: speechText,
      user_id: user?._id,
    });
    await outgoingLog.save();

    res.set("Content-Type", "text/xml");
    return res.send(VoiceAdapter.generateTwiML(speechText));
  } catch (err: any) {
    console.error("Voice input processing error:", err);
    res.set("Content-Type", "text/xml");
    return res.send(VoiceAdapter.generateTwiML("We are experiencing difficulties reading your schemes. Goodbye."));
  }
};

// 5. Voice Timeout/Fallback Handler
export const voiceTimeout = async (_req: Request, res: Response) => {
  res.set("Content-Type", "text/xml");
  return res.send(VoiceAdapter.generateRepeatPrompt());
};

// 6. Inbound Email Webhook Handler
export const receiveEmail = async (req: Request, res: Response) => {
  try {
    const sender = (req.body.sender || req.body.From || "").trim();
    const subject = (req.body.subject || "").trim();
    const body = (req.body.body || req.body.Body || "").trim();

    if (!sender || !body) {
      return res.status(400).json({
        success: false,
        message: "Missing 'sender' or 'body' details in email payload.",
      });
    }

    // Process pipeline
    const { matches, profile, user } = await processUnifiedPipeline(body, "Email", sender);

    // Format email response fields
    const { subject: replySubject, text, html } = EmailAdapter.formatEmailResponse(matches, profile);

    // Send email using Mock transporter
    const emailSent = await EmailAdapter.sendMail(sender, replySubject, text, html, user?._id);

    return res.json({
      success: emailSent,
      profile,
      matchesCount: matches.length,
      message: "Inbound email processed and recommendations dispatched.",
    });
  } catch (err: any) {
    console.error("Email Inbound Webhook Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to process inbound email.",
    });
  }
};
