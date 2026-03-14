import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function InterviewPage() {
  const navigate = useNavigate();
  const initialRequestDoneRef = useRef(false);
  const [answer, setAnswer] = useState("");
  const [localError, setLocalError] = useState("");

  const {
    setup,
    currentQuestion,
    latestFeedback,
    setLatestFeedback,
    isLoading,
    apiError,
    requestQuestion,
    requestAnswerEvaluation,
    addCompletedAnswer
  } = useInterview();

  useEffect(() => {
    if (!setup.role || currentQuestion || initialRequestDoneRef.current) {
      return;
    }

    initialRequestDoneRef.current = true;
    requestQuestion().catch(() => {
      // API error state is already handled in context.
    });
  }, [setup.role, currentQuestion, requestQuestion]);

  if (!setup.role) {
    return (
      <section className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 text-amber-100">
        <p className="mb-4">Set up your interview first.</p>
        <Link className="underline" to="/setup">
          Go to Setup
        </Link>
      </section>
    );
  }

  async function handleGenerateQuestion() {
    setLocalError("");
    setLatestFeedback(null);
    setAnswer("");
    try {
      await requestQuestion();
    } catch (error) {
      // API error state is already handled in context.
    }
  }

  async function handleSubmitAnswer(event) {
    event.preventDefault();
    setLocalError("");

    const trimmedAnswer = answer.trim();

    if (!currentQuestion?.question) {
      setLocalError("No question is loaded yet. Generate a question first.");
      return;
    }

    if (!trimmedAnswer) {
      setLocalError("Please type an answer before submitting.");
      return;
    }

    try {
      const evaluation = await requestAnswerEvaluation({
        question: currentQuestion.question,
        answer: trimmedAnswer
      });

      addCompletedAnswer({
        question: currentQuestion.question,
        answer: trimmedAnswer,
        evaluation
      });
    } catch (error) {
      // API error state is already handled in context.
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h2 className="mb-3 text-2xl font-semibold text-white">Interview</h2>
      <p className="mb-6 text-slate-300">Answer the current question, then submit for AI evaluation.</p>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
        <p>
          <strong className="text-slate-100">Role:</strong> {setup.role}
        </p>
        <p>
          <strong className="text-slate-100">Interview Type:</strong> {setup.interviewType}
        </p>
        <p>
          <strong className="text-slate-100">Difficulty:</strong> {setup.difficulty}
        </p>
      </div>

      {apiError ? (
        <div className="mb-4 rounded-lg border border-rose-600/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {apiError}
        </div>
      ) : null}

      {localError ? (
        <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          {localError}
        </div>
      ) : null}

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-950 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Current Question</h3>
          <button
            type="button"
            onClick={handleGenerateQuestion}
            disabled={isLoading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "New Question"}
          </button>
        </div>

        {currentQuestion?.question ? (
          <div className="space-y-2">
            <p className="text-slate-100">{currentQuestion.question}</p>
            {currentQuestion.focusArea ? (
              <p className="text-sm text-slate-400">Focus area: {currentQuestion.focusArea}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-slate-400">No question loaded yet. Click "New Question".</p>
        )}
      </div>

      <form onSubmit={handleSubmitAnswer} className="space-y-4">
        <div>
          <label htmlFor="candidate-answer" className="mb-2 block text-sm font-medium text-slate-200">
            Your Answer
          </label>
          <textarea
            id="candidate-answer"
            rows={7}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer here..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-brand-500 focus:ring-2"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !currentQuestion?.question}
          className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Submitting..." : "Submit Answer"}
        </button>
      </form>

      {latestFeedback && typeof latestFeedback.score === "number" ? (
        <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-4">
          <p className="text-emerald-100">
            Answer evaluated. Score: <strong>{latestFeedback.score}</strong>/100
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/feedback")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              View Feedback
            </button>
            <button
              type="button"
              onClick={handleGenerateQuestion}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500"
            >
              Next Question
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default InterviewPage;
