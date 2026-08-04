import { Router } from "express";
import { receiveWhatsApp } from "../controllers/communicationController";

const router = Router();

router.post("/webhook", receiveWhatsApp);

export default router;