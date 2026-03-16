import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";

function SetupPage() {
  const navigate = useNavigate();
  const { setup, setSetup, resetSession, requestResumeParsing, isLoading, apiError } = useInterview();

  const [role, setRole]               = useState(setup.role);
  const [interviewType, setInterviewType] = useState(setup.interviewType);
  const [difficulty, setDifficulty]   = useState(setup.difficulty);
  const [resumeText, setResumeText]   = useState("");
  const [resumeFile, setResumeFile]   = useState(null);
  const [localError, setLocalError]   = useState("");
  const [parseSuccess, setParseSuccess] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setSetup((prev) => ({ ...prev, role: role.trim(), interviewType, difficulty }));
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
      await requestResumeParsing({ resumeText: resumeText.trim(), resumeFile, targetRoleHint: role.trim() });
      setParseSuccess("Resume parsed — interview questions will be personalized to your background.");
    } catch {}
  }

  const parsedResume = setup.parsedResume;
  const parsedSkills = Array.isArray(parsedResume?.coreSkills) ? parsedResume.coreSkills.slice(0, 8) : [];

  const selectStyle = {
    background: "rgba(6, 13, 30, 0.8)",
    border: "1px solid rgba(34, 211, 238, 0.15)",
    color: "#e2f0ff",
    borderRadius: "10px",
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    fontFamily: "Sora, sans-serif",
    fontSize: "0.9rem",
    appearance: "none",
    cursor: "pointer"
  };

  return (
    <div className="fade-up">
      <div
        className="rounded-3xl p-8"
        style={{ background: "rgba(10, 22, 40, 0.85)", border: "1px solid rgba(34, 211, 238, 0.1)", backdropFilter: "blur(8px)" }}
      >
        <div className="mb-7">
          <div className="nova-badge mb-3 inline-block">STEP 1 OF 4</div>
          <h2 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.01em" }}>Interview Setup</h2>
          <p className="text-sm mt-1" style={{ color: "#4a6a80" }}>Configure your session before we begin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Target role */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
              Target Role
            </label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g., Frontend Engineer Intern"
              className="input-nova"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Interview type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
                Interview Type
              </label>
              <div className="relative">
                <select value={interviewType} onChange={e => setInterviewType(e.target.value)} style={selectStyle}>
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="system design">System Design</option>
                  <option value="data structures & algorithms">DS &amp; Algorithms</option>
                  <option value="product sense">Product Sense</option>
                  <option value="mixed">Mixed</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#22d3ee", fontSize: "0.7rem" }}>▾</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
                Difficulty
              </label>
              <div className="relative">
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#22d3ee", fontSize: "0.7rem" }}>▾</span>
              </div>
            </div>
          </div>

          {/* Resume section */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(6, 13, 30, 0.6)", border: "1px solid rgba(34, 211, 238, 0.08)" }}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">Resume Context</label>
              <span className="nova-badge">Optional · PDF or TXT</span>
            </div>

            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              rows={4}
              placeholder="Paste your resume text here (optional)..."
              className="input-nova"
              style={{ resize: "vertical", minHeight: "80px" }}
            />

            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(34,211,238,0.04)", border: "1px dashed rgba(34,211,238,0.15)" }}
            >
              <span style={{ color: "#22d3ee", fontSize: "0.9rem" }}>↑</span>
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,application/pdf"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <span className="text-sm" style={{ color: resumeFile ? "#22d3ee" : "#4a6a80" }}>
                  {resumeFile ? resumeFile.name : "Click to upload PDF or TXT"}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleParseResume}
              disabled={isLoading}
              className="btn-ghost text-sm px-4 py-2"
            >
              {isLoading ? "Parsing with Nova AI..." : "Parse Resume with Nova"}
            </button>

            {localError && <p className="text-xs" style={{ color: "#fbbf24" }}>{localError}</p>}
            {apiError   && <p className="text-xs" style={{ color: "#f87171" }}>{apiError}</p>}
            {parseSuccess && <p className="text-xs" style={{ color: "#34d399" }}>{parseSuccess}</p>}
          </div>

          {/* Parsed resume preview */}
          {parsedResume && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(34, 211, 238, 0.05)", border: "1px solid rgba(34, 211, 238, 0.2)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: "#22d3ee" }}>✓</span>
                <p className="text-sm font-semibold" style={{ color: "#22d3ee" }}>Resume Parsed</p>
              </div>
              <p className="text-sm mb-3" style={{ color: "#7acbd8" }}>{parsedResume.candidateSummary}</p>
              {parsedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parsedSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#67e8f9" }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-sm">
            Continue to Interview →
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetupPage;
