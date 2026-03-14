export function buildGenerateQuestionPrompt({ role, interviewType, difficulty, previousQuestions }) {
  return `
You are a professional interviewer.
Create ONE realistic interview question for this candidate profile:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

Avoid repeating these previous questions:
${JSON.stringify(previousQuestions)}

Return JSON only using this exact schema:
{
  "question": "string",
  "focusArea": "string",
  "expectedAnswerStyle": "string"
}

Rules:
- Keep question concise and specific.
- Tone should be professional and realistic.
- No markdown, no explanation outside JSON.
`.trim();
}

export function buildEvaluateAnswerPrompt({ role, interviewType, difficulty, question, answer }) {
  return `
You are an interview coach giving constructive, specific, and encouraging feedback.
Candidate details:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

Interview question:
${question}

Candidate answer:
${answer}

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
- Keep strengths and weaknesses concrete and actionable.
- improvedSampleAnswer must be tailored to this exact question.
- score should reflect rubric quality.
- No markdown, no explanation outside JSON.
`.trim();
}

export function buildFinalSummaryPrompt({ role, interviewType, difficulty, qaHistory, evaluations }) {
  return `
You are an interview coach preparing a final session summary.
Session details:
- Target role: ${role}
- Interview type: ${interviewType}
- Difficulty: ${difficulty}

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
- overallScore should be 0-100.
- topImprovementTips must include exactly 3 practical tips.
- Tone should be encouraging and realistic.
- No markdown, no explanation outside JSON.
`.trim();
}
