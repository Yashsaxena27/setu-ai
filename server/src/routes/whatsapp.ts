import { Router } from "express";
import { receiveWhatsApp } from "../controllers/communicationController";

const router = Router();

// GET verification handshake for Twilio / Meta Webhooks
router.get("/webhook", (req, res) => {
  const hubChallenge = req.query["hub.challenge"];
  if (hubChallenge) {
    return res.status(200).send(hubChallenge);
  }
  return res.status(200).json({ status: "active", channel: "WhatsApp", service: "Setu AI" });
});

// POST message webhook handler
router.post("/webhook", receiveWhatsApp);

export default router;