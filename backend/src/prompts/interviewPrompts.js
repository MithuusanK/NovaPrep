export function buildParseResumePrompt({ resumeText, targetRoleHint }) {
  return `
You are an interview preparation assistant.
Parse the following resume and return a structured summary for interview customization.

Target role hint:
${targetRoleHint || "Not provided"}

Resume text:
${resumeText}

Return JSON only using this exact schema:
{
  "candidateSummary": "string",
  "suggestedRoles": ["string"],
  "coreSkills": ["string"],
  "experienceHighlights": ["string"],
  "projectHighlights": ["string"],
  "behavioralThemes": ["string"]
}

Rules:
- Keep all outputs concise and useful for interview coaching.
- Use only information from the resume text.
- suggestedRoles should contain 2-5 relevant roles.
- No markdown, no explanation outside JSON.
`.trim();
}

const TOPIC_GUIDANCE = {
  behavioral: "Focus on past experiences using the STAR method (Situation, Task, Action, Result). Cover themes like conflict resolution, team collaboration, leadership, and learning from failures.",
  technical: "Focus on coding, problem-solving, or technical concepts relevant to the role. Ask about optimal solutions, time/space complexity, and real-world applications.",
  "system design": "Focus on designing scalable systems. Cover architecture decisions, trade-offs, databases, caching, load balancing, and scalability strategies.",
  "data structures & algorithms": "Focus on algorithmic problem-solving. Ask about optimal data structures, time/space complexity analysis, edge cases, and real-world applications.",
  "product sense": "Focus on product thinking. Cover user empathy, metrics, feature prioritization, trade-offs, and how to measure success.",
  mixed: "Mix behavioral and technical questions appropriate for the role."
};

export function buildGenerateQuestionPrompt({ role, interviewType, difficulty, previousQuestions, parsedResume }) {
  const resumeContext = parsedResume ? JSON.stringify(parsedResume) : "No parsed resume provided.";
  const topicGuidance = TOPIC_GUIDANCE[interviewType] || TOPIC_GUIDANCE.mixed;

  return `
You are an expert technical interview coach at a top-tier tech company (Google, Meta, Amazon, etc.).
Create ONE realistic interview question for this candidate profile:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

Topic guidance for this interview type:
${topicGuidance}

Parsed resume context (optional):
${resumeContext}

Avoid repeating these previous questions:
${JSON.stringify(previousQuestions)}

Return JSON only using this exact schema:
{
  "question": "string",
  "focusArea": "string",
  "expectedAnswerStyle": "string"
}

Rules:
- Question must be specific and realistic for a ${difficulty}-level ${role} candidate.
- focusArea should name the specific skill or concept being tested.
- expectedAnswerStyle should describe what a strong answer looks like (e.g., "STAR method with measurable outcomes", "pseudocode with complexity analysis").
- Tone should be professional and conversational.
- No markdown, no explanation outside JSON.
`.trim();
}

const EVALUATION_CRITERIA = {
  behavioral: "Evaluate STAR method usage (Situation, Task, Action, Result), specificity of examples, and demonstration of soft skills like leadership, collaboration, and learning from failure.",
  technical: "Evaluate technical accuracy, problem-solving approach, code quality or algorithm correctness, complexity analysis, and handling of edge cases.",
  "system design": "Evaluate coverage of scalability, trade-offs, architecture decisions, database choices, caching strategies, and load balancing. Check if the candidate asked clarifying questions and justified design decisions.",
  "data structures & algorithms": "Evaluate choice of data structure, correctness of algorithm, time/space complexity analysis, handling of edge cases, and clarity of explanation.",
  "product sense": "Evaluate user empathy, clarity of metrics, feature prioritization rationale, trade-off analysis, and how success would be measured.",
  mixed: "Evaluate both technical accuracy and communication clarity, problem-solving approach, and overall answer quality."
};

export function buildEvaluateAnswerPrompt({ role, interviewType, difficulty, question, answer, parsedResume }) {
  const resumeContext = parsedResume ? JSON.stringify(parsedResume) : "No parsed resume provided.";
  const evaluationCriteria = EVALUATION_CRITERIA[interviewType] || EVALUATION_CRITERIA.mixed;

  return `
You are an expert technical interview coach giving constructive, specific, and encouraging feedback.
Candidate details:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

Parsed resume context (optional):
${resumeContext}

Interview question:
${question}

Candidate answer:
${answer}

Evaluation criteria for this interview type:
${evaluationCriteria}

Score using these criteria (0-100 each): relevance, clarity, structure, depth.
If interview type includes behavioral, also score STAR usage (0-100).

Return JSON only using this exact schema:
{
  "score": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvedSampleAnswer": "string",
  "rubric": {
    "relevance": 0,
    "clarity": 0,
    "structure": 0,
    "depth": 0,
    "starMethod": 0
  }
}

Rules:
- Strengths and weaknesses must be specific and actionable — avoid generic praise like "good answer".
- Each weakness should include a concrete suggestion for improvement.
- improvedSampleAnswer must be a complete, model answer tailored to this exact question and role.
- score should reflect the average rubric quality.
- Tone should be encouraging and honest, like a supportive coach.
- No markdown, no explanation outside JSON.
`.trim();
}

export function buildFinalSummaryPrompt({ role, interviewType, difficulty, qaHistory, evaluations, parsedResume }) {
  const resumeContext = parsedResume ? JSON.stringify(parsedResume) : "No parsed resume provided.";

  return `
You are an expert technical interview coach preparing a final session debrief.
Session details:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

Parsed resume context (optional):
${resumeContext}

Question and answer history:
${JSON.stringify(qaHistory)}

Per-question evaluations:
${JSON.stringify(evaluations)}

Return JSON only using this exact schema:
{
  "overallScore": 0,
  "strongestArea": "string",
  "weakestArea": "string",
  "topImprovementTips": ["string", "string", "string"]
}

Rules:
- overallScore should be 0-100, averaged across all evaluations.
- strongestArea and weakestArea should name a specific skill or dimension (e.g., "STAR method usage", "complexity analysis", "trade-off reasoning").
- topImprovementTips must include exactly 3 practical, specific tips the candidate can act on before their next interview.
- Tips should relate directly to patterns observed across the session, not generic advice.
- Tone should be honest, encouraging, and actionable — like a mentor preparing the candidate for real interviews.
- No markdown, no explanation outside JSON.
`.trim();
}
