import {
  generateQuestionFeedback,
  evaluateAnswerFeedback,
  generateFinalSummaryFeedback
} from "../services/interviewService.js";

export async function generateQuestion(req, res, next) {
  try {
    const { role, interviewType, difficulty, previousQuestions = [] } = req.body;

    if (!role || !interviewType || !difficulty) {
      return res.status(400).json({
        error: "role, interviewType, and difficulty are required."
      });
    }

    const result = await generateQuestionFeedback({
      role,
      interviewType,
      difficulty,
      previousQuestions
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function evaluateAnswer(req, res, next) {
  try {
    const { role, interviewType, difficulty, question, answer } = req.body;

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
      answer
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function finalSummary(req, res, next) {
  try {
    const { role, interviewType, difficulty, qaHistory = [], evaluations = [] } = req.body;

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
      evaluations
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
