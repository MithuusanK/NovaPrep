import {
  buildParseResumePrompt,
  buildEvaluateAnswerPrompt,
  buildFinalSummaryPrompt,
  buildGenerateQuestionPrompt
} from "../prompts/interviewPrompts.js";
import { invokeNovaJson } from "./novaService.js";

export async function parseResumeProfile(input) {
  const prompt = buildParseResumePrompt(input);

  return invokeNovaJson({
    prompt,
    mockResponse: {
      candidateSummary:
        "Entry-level frontend candidate with internship experience in React, debugging, and shipping user-facing features.",
      suggestedRoles: ["Frontend Engineer Intern", "Junior Web Developer", "UI Engineer Intern"],
      coreSkills: ["React", "JavaScript", "CSS", "Debugging", "Git"],
      experienceHighlights: [
        "Improved dashboard reporting workflow during internship.",
        "Collaborated with mentor and team to deliver features on deadline."
      ],
      projectHighlights: [
        "Built interactive web UI projects using React.",
        "Shipped analytics and dashboard-related improvements."
      ],
      behavioralThemes: ["Ownership", "Adaptability", "Collaboration", "Problem-solving"]
    }
  });
}

export async function generateQuestionFeedback(input) {
  const prompt = buildGenerateQuestionPrompt(input);

  return invokeNovaJson({
    prompt,
    mockResponse: {
      question: "Tell me about a time you had to learn a new technology quickly for a project.",
      focusArea: "Adaptability",
      expectedAnswerStyle: "Use STAR: situation, task, action, result."
    }
  });
}

export async function evaluateAnswerFeedback(input) {
  const prompt = buildEvaluateAnswerPrompt(input);

  return invokeNovaJson({
    prompt,
    mockResponse: {
      score: 78,
      strengths: [
        "Your answer was relevant to the question.",
        "You showed ownership and initiative."
      ],
      weaknesses: [
        "The result was not quantified with measurable impact.",
        "The structure could be clearer and more concise."
      ],
      improvedSampleAnswer:
        "In my internship, I had one week to add a new analytics tool to our dashboard. I created a learning plan, built a prototype in two days, and reviewed it with my mentor. We shipped it by Friday and reduced manual reporting by 30 percent.",
      rubric: {
        relevance: 82,
        clarity: 75,
        structure: 74,
        depth: 80,
        starMethod: 79
      }
    }
  });
}

export async function generateFinalSummaryFeedback(input) {
  const prompt = buildFinalSummaryPrompt(input);

  return invokeNovaJson({
    prompt,
    mockResponse: {
      overallScore: 80,
      strongestArea: "Relevance",
      weakestArea: "Depth",
      topImprovementTips: [
        "Quantify outcomes with numbers in every answer.",
        "Use a clear STAR structure for behavioral responses.",
        "Add more technical trade-off reasoning in technical answers."
      ]
    }
  });
}
