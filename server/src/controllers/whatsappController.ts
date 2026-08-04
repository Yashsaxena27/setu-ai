import { Request, Response } from "express";
import { parseProfile } from "../services/parseProfile";
import { findMatchingSchemes } from "../services/matchingService";
import { formatMatchResponse } from "../services/matchResponseFormatter";
import { formatWhatsAppResponse } from "../services/whatsappService";

export const receiveWhatsAppMessage = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("📩 Incoming WhatsApp Message");

    const message = (req.body.Body || "").trim();

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

      return res.send(`
<Response>
  <Message>
Please send your details like:
"I am a 22 year old student from Uttar Pradesh with income 2 lakh."
  </Message>
</Response>
`);
    }

    console.log("From:", req.body.From);
    console.log("Name:", req.body.ProfileName);
    console.log("Message:", message);

    // Parse WhatsApp message into a user profile
    const profile = await parseProfile(message);
    console.log("Parsed Profile:", profile);

    // Find matching schemes
    const matches = await findMatchingSchemes(profile);

    // Format API response
    const formattedMatches = formatMatchResponse(matches);

    // Format WhatsApp reply
    const reply = formatWhatsAppResponse(formattedMatches);

    res.set("Content-Type", "text/xml");

    return res.send(`
<Response>
  <Message>${reply}</Message>
</Response>
`);
  } catch (err: any) {
    console.error("===== WHATSAPP ERROR =====");
    console.error(err);

    res.set("Content-Type", "text/xml");

   return res.send(`
<Response>
  <Message>
Sorry, something went wrong while processing your request.
Please try again later.
  </Message>
</Response>
`);
  }
};