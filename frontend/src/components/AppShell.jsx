import { Link, useLocation } from "react-router-dom";

const STEPS = [
  { path: "/setup",     label: "Setup" },
  { path: "/interview", label: "Interview" },
  { path: "/feedback",  label: "Feedback" },
  { path: "/summary",   label: "Summary" }
];

function AppShell({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const currentStep = STEPS.findIndex(s => s.path === location.pathname);

  return (
    <div className="min-h-screen" style={{ background: "#060d1e" }}>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="orb" style={{ width: 600, height: 600, top: -200, left: -100, background: "rgba(8, 145, 178, 0.07)" }} />
        <div className="orb" style={{ width: 400, height: 400, bottom: -100, right: -50, background: "rgba(167, 139, 250, 0.05)" }} />
      </div>

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: "linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6" style={{ zIndex: 1 }}>

        {/* Header */}
        <header
          className="mb-8 flex items-center justify-between px-5 py-3 rounded-2xl"
          style={{
            background: "rgba(10, 22, 40, 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)"
          }}
        >
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo mark */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "linear-gradient(135deg, #0891b2, #22d3ee)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="#060d1e" fillOpacity="0.9" />
                <circle cx="8" cy="8" r="2.5" fill="#060d1e" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-wide text-base group-hover:text-brand-300 transition-colors">
              NovaPrep
            </span>
          </Link>

          {/* Step indicator */}
          {!isLanding && currentStep >= 0 && (
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const isDone    = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.path} className="flex items-center gap-1">
                    <Link
                      to={step.path}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: isCurrent ? "rgba(34,211,238,0.12)" : "transparent",
                        color: isCurrent ? "#22d3ee" : isDone ? "#4a8a9a" : "#2d4a60",
                        border: isCurrent ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent"
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: isCurrent ? "#22d3ee" : isDone ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)",
                          color: isCurrent ? "#060d1e" : isDone ? "#22d3ee" : "#3d6080"
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </Link>
                    {i < STEPS.length - 1 && (
                      <div className="w-4 h-px" style={{ background: isDone ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 text-center" style={{ color: "#1d3a55", fontSize: "0.7rem" }}>
          Powered by Amazon Nova AI · NovaPrep
        </footer>
      </div>
    </div>
  );
}

export default AppShell;
