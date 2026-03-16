import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function SummaryPage() {
  const navigate = useNavigate();
  const initialRequestDoneRef = useRef(false);

  const { setup, session, finalSummary, isLoading, apiError, requestFinalSummary, resetSession } = useInterview();

  useEffect(() => {
    if (!setup.role || !session.evaluations.length || finalSummary || initialRequestDoneRef.current) return;
    initialRequestDoneRef.current = true;
    requestFinalSummary().catch(() => {});
  }, [setup.role, session.evaluations.length, finalSummary, requestFinalSummary]);

  if (!setup.role) {
    return (
      <div className="fade-up rounded-2xl p-8 text-center card-glow">
        <p className="mb-4" style={{ color: "#7ba3c8" }}>Set up an interview first.</p>
        <Link to="/setup" className="btn-ghost text-sm px-5 py-2 inline-block">Go to Setup</Link>
      </div>
    );
  }

  if (!session.evaluations.length) {
    return (
      <div className="fade-up rounded-2xl p-8 text-center card-glow">
        <p className="mb-4" style={{ color: "#7ba3c8" }}>Complete at least one question to generate a summary.</p>
        <Link to="/interview" className="btn-ghost text-sm px-5 py-2 inline-block">Back to Interview</Link>
      </div>
    );
  }

  async function handleGenerateSummary() {
    try { await requestFinalSummary(); } catch {}
  }

  function handleStartNewSession() { resetSession(); navigate("/setup"); }

  const tips    = Array.isArray(finalSummary?.topImprovementTips) ? finalSummary.topImprovementTips.slice(0, 3) : [];
  const score   = finalSummary?.overallScore ?? null;
  const scoreColor = score === null ? "#3d6080" : score >= 80 ? "#22d3ee" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="fade-up space-y-4">

      {/* Header */}
      <div
        className="rounded-3xl p-7 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(10,22,40,0.95) 0%, rgba(8,16,36,0.98) 100%)", border: "1px solid rgba(34,211,238,0.15)" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)" }} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="nova-badge mb-2 inline-block">SESSION COMPLETE</div>
            <h2 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.01em" }}>Final Summary</h2>
            <p className="text-xs mt-1" style={{ color: "#3d6080" }}>{session.qaHistory.length} question{session.qaHistory.length !== 1 ? "s" : ""} answered</p>
          </div>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="btn-ghost text-xs px-4 py-2"
          >
            {isLoading ? "Generating…" : "↺ Refresh"}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          {apiError}
        </div>
      )}

      {isLoading && !finalSummary && (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(34,211,238,0.07)", color: "#3d6080" }}>
          <div className="flex justify-center gap-1 mb-3">
            {[1,2,3,4,5].map(i => <span key={i} className="wave-bar" />)}
          </div>
          Generating your summary…
        </div>
      )}

      {finalSummary && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)" }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
                Score
              </div>
              <div className="text-4xl font-bold" style={{ color: scoreColor, letterSpacing: "-0.02em" }}>
                {finalSummary.overallScore ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#34d399", letterSpacing: "0.1em" }}>
                Strongest
              </div>
              <div className="text-sm font-semibold text-white leading-snug">
                {finalSummary.strongestArea || "—"}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#f87171", letterSpacing: "0.1em" }}>
                Weakest
              </div>
              <div className="text-sm font-semibold text-white leading-snug">
                {finalSummary.weakestArea || "—"}
              </div>
            </div>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(34,211,238,0.08)" }}
            >
              <h3 className="text-sm font-semibold text-white mb-4">Top 3 Improvements Before Your Next Interview</h3>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#a5c8d8" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => navigate("/interview")} className="btn-ghost flex-1 py-3 text-sm">
          Continue Interview
        </button>
        <button type="button" onClick={handleStartNewSession} className="btn-primary flex-1 py-3 text-sm">
          New Session →
        </button>
      </div>
    </div>
  );
}

export default SummaryPage;
