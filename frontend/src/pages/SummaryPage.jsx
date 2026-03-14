import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function SummaryPage() {
  const navigate = useNavigate();
  const initialRequestDoneRef = useRef(false);

  const {
    setup,
    session,
    finalSummary,
    isLoading,
    apiError,
    requestFinalSummary,
    resetSession
  } = useInterview();

  useEffect(() => {
    if (!setup.role || !session.evaluations.length || finalSummary || initialRequestDoneRef.current) {
      return;
    }

    initialRequestDoneRef.current = true;
    requestFinalSummary().catch(() => {
      // API error is already handled in context state.
    });
  }, [setup.role, session.evaluations.length, finalSummary, requestFinalSummary]);

  if (!setup.role) {
    return (
      <section className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 text-amber-100">
        <h2 className="mb-3 text-2xl font-semibold">Final Summary</h2>
        <p className="mb-4">Set up an interview first.</p>
        <Link className="underline" to="/setup">
          Go to Setup
        </Link>
      </section>
    );
  }

  if (!session.evaluations.length) {
    return (
      <section className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 text-amber-100">
        <h2 className="mb-3 text-2xl font-semibold">Final Summary</h2>
        <p className="mb-4">You need at least one evaluated answer before generating a final summary.</p>
        <Link className="underline" to="/interview">
          Back to Interview
        </Link>
      </section>
    );
  }

  const tips = Array.isArray(finalSummary?.topImprovementTips) ? finalSummary.topImprovementTips.slice(0, 3) : [];

  async function handleGenerateSummary() {
    try {
      await requestFinalSummary();
    } catch (error) {
      // API error is already handled in context state.
    }
  }

  function handleStartNewSession() {
    resetSession();
    navigate("/setup");
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Final Summary</h2>
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Generating..." : "Refresh Summary"}
        </button>
      </div>

      {apiError ? (
        <div className="rounded-lg border border-rose-600/40 bg-rose-500/10 p-3 text-sm text-rose-100">{apiError}</div>
      ) : null}

      {isLoading && !finalSummary ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-slate-300">
          Generating final summary...
        </div>
      ) : null}

      {finalSummary ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-brand-100">Overall Score</p>
              <p className="text-3xl font-bold text-white">{finalSummary.overallScore ?? "N/A"}</p>
            </div>

            <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-emerald-100">Strongest Area</p>
              <p className="text-lg font-semibold text-emerald-50">{finalSummary.strongestArea || "N/A"}</p>
            </div>

            <div className="rounded-lg border border-rose-600/40 bg-rose-500/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-rose-100">Weakest Area</p>
              <p className="text-lg font-semibold text-rose-50">{finalSummary.weakestArea || "N/A"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Top 3 Improvement Tips</h3>
            {tips.length ? (
              <ol className="list-decimal space-y-2 pl-5 text-slate-200">
                {tips.map((tip, index) => (
                  <li key={`tip-${index}`}>{tip}</li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-300">No improvement tips were returned.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
            Questions answered: <strong className="text-slate-100">{session.qaHistory.length}</strong>
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate("/interview")}
          className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Continue Interview
        </button>
        <button
          type="button"
          onClick={handleStartNewSession}
          className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
        >
          Start New Session
        </button>
      </div>
    </section>
  );
}

export default SummaryPage;
