import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-black/20">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-brand-100">Amazon Nova AI Coach</p>
      <h1 className="mb-4 text-4xl font-bold leading-tight text-white">Practice Real Interviews with NovaPrep</h1>
      <p className="mb-8 max-w-2xl text-slate-300">
        Choose your target role, run a mock interview, and get constructive AI feedback you can improve with right
        away.
      </p>

      <button
        type="button"
        onClick={() => navigate("/setup")}
        className="rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition hover:bg-brand-500"
      >
        Start Interview
      </button>
    </section>
  );
}

export default LandingPage;
