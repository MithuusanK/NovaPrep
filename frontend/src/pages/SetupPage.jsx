import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function SetupPage() {
  const navigate = useNavigate();
  const { setup, setSetup, resetSession, requestResumeParsing, isLoading, apiError } = useInterview();

  const [role, setRole] = useState(setup.role);
  const [interviewType, setInterviewType] = useState(setup.interviewType);
  const [difficulty, setDifficulty] = useState(setup.difficulty);
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [parseSuccess, setParseSuccess] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setSetup((prev) => ({
      ...prev,
      role: role.trim(),
      interviewType,
      difficulty
    }));

    resetSession();
    navigate("/interview");
  }

  async function handleParseResume() {
    setLocalError("");
    setParseSuccess("");

    if (!resumeFile && !resumeText.trim()) {
      setLocalError("Add resume text or upload a resume file first.");
      return;
    }

    try {
      await requestResumeParsing({
        resumeText: resumeText.trim(),
        resumeFile,
        targetRoleHint: role.trim()
      });
      setParseSuccess("Resume parsed successfully. Interview will be personalized.");
    } catch (error) {
      // API error is shown from shared context state.
    }
  }

  const parsedResume = setup.parsedResume;
  const parsedSkills = Array.isArray(parsedResume?.coreSkills) ? parsedResume.coreSkills.slice(0, 8) : [];

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
            <option value="system design">System Design</option>
            <option value="data structures & algorithms">Data Structures &amp; Algorithms</option>
            <option value="product sense">Product Sense</option>
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

        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">Resume Context (Optional)</label>
            <span className="text-xs text-slate-400">PDF or TXT</span>
          </div>

          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={5}
            placeholder="Paste resume text here (optional if uploading a file)"
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-brand-500 focus:ring-2"
          />

          <input
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setResumeFile(file);
            }}
            className="mb-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-500"
          />

          <button
            type="button"
            onClick={handleParseResume}
            disabled={isLoading}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Parsing..." : "Parse Resume with Nova"}
          </button>

          {localError ? (
            <p className="mt-3 text-sm text-amber-300">{localError}</p>
          ) : null}
          {apiError ? (
            <p className="mt-3 text-sm text-rose-300">{apiError}</p>
          ) : null}
          {parseSuccess ? (
            <p className="mt-3 text-sm text-emerald-300">{parseSuccess}</p>
          ) : null}
        </div>

        {parsedResume ? (
          <div className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-4">
            <p className="mb-2 text-sm font-medium text-emerald-100">Parsed Resume Summary</p>
            <p className="text-sm text-emerald-50">{parsedResume.candidateSummary || "No summary returned."}</p>
            {parsedSkills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {parsedSkills.map((skill, index) => (
                  <span
                    key={`skill-${index}`}
                    className="rounded-full border border-emerald-500/40 bg-emerald-600/20 px-2 py-1 text-xs text-emerald-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

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
