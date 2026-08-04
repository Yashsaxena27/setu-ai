import { Router } from "express";
import {
  receiveWhatsApp,
  receiveSMS,
  receiveVoiceCall,
  processVoiceInput,
  voiceTimeout,
  receiveEmail,
} from "../controllers/communicationController";

const router = Router();

// Twilio WhatsApp Webhook
router.post("/whatsapp/webhook", receiveWhatsApp);

// Twilio SMS Webhook
router.post("/sms/webhook", receiveSMS);

// Twilio Voice Calls IVR
router.post("/voice/webhook", receiveVoiceCall);
router.post("/voice/process", processVoiceInput);
router.post("/voice/timeout", voiceTimeout);

// Inbound Email Webhook
router.post("/email/webhook", receiveEmail);

export default router;
