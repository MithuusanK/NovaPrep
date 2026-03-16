import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "◈", label: "System Design",        desc: "Scalability, trade-offs, architecture" },
  { icon: "⬡", label: "Data Structures",       desc: "Algorithms, complexity, edge cases" },
  { icon: "◉", label: "Behavioral",            desc: "STAR method, leadership, impact" },
  { icon: "◈", label: "Product Sense",         desc: "Metrics, prioritization, user empathy" }
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="fade-up">
      {/* Hero */}
      <div
        className="rounded-3xl p-10 mb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(13,30,56,0.9) 0%, rgba(8,20,42,0.95) 100%)",
          border: "1px solid rgba(34, 211, 238, 0.15)"
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative">
          <div className="nova-badge mb-5 inline-block">AMAZON NOVA · AI INTERVIEW COACH</div>

          <h1 className="text-5xl font-bold leading-tight text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
            Ace Your Next<br />
            <span style={{ background: "linear-gradient(90deg, #22d3ee, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tech Interview
            </span>
          </h1>

          <p className="text-base mb-8 max-w-lg leading-relaxed" style={{ color: "#7ba3c8" }}>
            Practice with an AI coach trained on real interview patterns from Google, Meta, Amazon and more. Get instant feedback, a model answer, and a score.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="btn-primary text-sm px-7 py-3"
            >
              Start Interview →
            </button>
            <div className="flex items-center gap-2" style={{ color: "#3d6080", fontSize: "0.8rem" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" style={{ boxShadow: "0 0 6px #22d3ee" }} />
              Voice-enabled · Real-time feedback
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="fade-up card-glow rounded-2xl p-4"
          >
            <div className="text-xl mb-2" style={{ color: "#22d3ee" }}>{f.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{f.label}</div>
            <div className="text-xs leading-snug" style={{ color: "#3d6080" }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-6 px-2" style={{ color: "#2d4a60", fontSize: "0.75rem" }}>
        {["Adaptive difficulty", "Resume-aware questions", "Rubric scoring", "Voice Q&A"].map(t => (
          <span key={t} className="flex items-center gap-1.5">
            <span style={{ color: "#22d3ee" }}>✓</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;
