import { Router } from "express";
import {
  parseResume,
  transcribeVoice,
  speakVoice,
  generateQuestion,
  evaluateAnswer,
  finalSummary
} from "../controllers/interviewController.js";
import { resumeUpload } from "../middleware/upload.js";

const router = Router();

router.post("/parse-resume", resumeUpload.single("resumeFile"), parseResume);
router.post("/voice/transcribe", transcribeVoice);
router.post("/voice/speak", speakVoice);
router.post("/generate-question", generateQuestion);
router.post("/evaluate-answer", evaluateAnswer);
router.post("/final-summary", finalSummary);

export default router;
