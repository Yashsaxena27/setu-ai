import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getNextBestAction,
  getDeadlineIntelligence,
  getWhyNot,
  getPortfolioPlan,
  explainPortfolio
} from "../controllers/intelligenceController";

const router = Router();

router.use(authMiddleware);

router.post("/next-best-action", getNextBestAction);
router.get("/deadline/:schemeId", getDeadlineIntelligence);
router.get("/why-not/:schemeId", getWhyNot);
router.get("/portfolio", getPortfolioPlan);
router.post("/portfolio/explain", explainPortfolio);

export default router;
