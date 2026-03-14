import {
  parseResumeProfile,
  generateQuestionFeedback,
  evaluateAnswerFeedback,
  generateFinalSummaryFeedback
} from "../services/interviewService.js";
import { extractResumeText } from "../utils/extractResumeText.js";
import { speakWithNovaSonic, transcribeWithNovaSonic } from "../services/voiceService.js";

export async function parseResume(req, res, next) {
  try {
    const targetRoleHint = String(req.body?.targetRoleHint || "").trim();
    const bodyResumeText = String(req.body?.resumeText || "").trim();

    let resumeText = bodyResumeText;

    if (!resumeText && req.file) {
      resumeText = await extractResumeText(req.file);
    }

    if (!resumeText) {
      return res.status(400).json({
        error: "Please provide resumeText or upload a resumeFile."
      });
    }

    if (resumeText.length < 80) {
      return res.status(400).json({
        error: "Resume text is too short to parse reliably. Please provide more details."
      });
    }

    const result = await parseResumeProfile({
      resumeText,
      targetRoleHint
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function transcribeVoice(req, res, next) {
  try {
    const audioBase64 = String(req.body?.audioBase64 || "").trim();

    if (!audioBase64) {
      return res.status(400).json({
        error: "audioBase64 is required."
      });
    }

    const result = await transcribeWithNovaSonic({ audioBase64 });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function speakVoice(req, res, next) {
  try {
    const text = String(req.body?.text || "").trim();
    const voiceId = String(req.body?.voiceId || "").trim() || undefined;

    if (!text) {
      return res.status(400).json({
        error: "text is required."
      });
    }

    const result = await speakWithNovaSonic({ text, voiceId });

    if (!result.audioBase64) {
      return res.status(422).json({
        code: "NO_AUDIO_OUTPUT",
        error:
          "Nova Sonic did not return audio for this request. This account/model path may support speech conversation but not pure text-to-speech in this endpoint."
      });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function generateQuestion(req, res, next) {
  try {
    const { role, interviewType, difficulty, previousQuestions = [], parsedResume = null } = req.body;

    if (!role || !interviewType || !difficulty) {
      return res.status(400).json({
        error: "role, interviewType, and difficulty are required."
      });
    }

    const result = await generateQuestionFeedback({
      role,
      interviewType,
      difficulty,
      previousQuestions,
      parsedResume
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function evaluateAnswer(req, res, next) {
  try {
    const { role, interviewType, difficulty, question, answer, parsedResume = null } = req.body;

    if (!role || !interviewType || !difficulty || !question || !answer) {
      return res.status(400).json({
        error: "role, interviewType, difficulty, question, and answer are required."
      });
    }

    const result = await evaluateAnswerFeedback({
      role,
      interviewType,
      difficulty,
      question,
      answer,
      parsedResume
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function finalSummary(req, res, next) {
  try {
    const { role, interviewType, difficulty, qaHistory = [], evaluations = [], parsedResume = null } = req.body;

    if (!role || !interviewType || !difficulty) {
      return res.status(400).json({
        error: "role, interviewType, and difficulty are required."
      });
    }

    const result = await generateFinalSummaryFeedback({
      role,
      interviewType,
      difficulty,
      qaHistory,
      evaluations,
      parsedResume
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
