import { Router } from "express";
import {
  generateQuestion,
  evaluateAnswer,
  finalSummary
} from "../controllers/interviewController.js";

const router = Router();

router.post("/generate-question", generateQuestion);
router.post("/evaluate-answer", evaluateAnswer);
router.post("/final-summary", finalSummary);

export default router;
