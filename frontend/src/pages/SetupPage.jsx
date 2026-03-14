import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function SetupPage() {
  const navigate = useNavigate();
  const { setup, setSetup, resetSession } = useInterview();

  const [role, setRole] = useState(setup.role);
  const [interviewType, setInterviewType] = useState(setup.interviewType);
  const [difficulty, setDifficulty] = useState(setup.difficulty);

  function handleSubmit(event) {
    event.preventDefault();

    setSetup({
      role: role.trim(),
      interviewType,
      difficulty
    });

    resetSession();
    navigate("/interview");
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h2 className="mb-6 text-2xl font-semibold text-white">Interview Setup</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Target Role</label>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g., Frontend Engineer Intern"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none ring-brand-500 focus:ring-2"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Interview Type</label>
          <select
            value={interviewType}
            onChange={(event) => setInterviewType(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none ring-brand-500 focus:ring-2"
          >
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Difficulty</label>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none ring-brand-500 focus:ring-2"
          >
            <option value="entry">Entry</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white transition hover:bg-brand-500"
        >
          Continue to Interview
        </button>
      </form>
    </section>
  );
}

export default SetupPage;
