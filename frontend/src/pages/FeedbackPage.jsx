import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { pcm16Base64ToWavUrl } from "../services/audioCodec";
import { speakVoice } from "../services/interviewApi";

function speakFallbackInBrowser(text, onEnd = () => {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
  const clean = String(text || "").trim();
  if (!clean) return false;
  const utterance = new window.SpeechSynthesisUtterance(clean);
  utterance.lang = "en-US";
  utterance.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

function RubricBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#4a6a80" }}>
        <span>{label}</span>
        <span style={{ color: "#e2f0ff" }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: value >= 80 ? "#22d3ee" : value >= 60 ? "#67e8f9" : "#4a6a80"
          }}
        />
      </div>
    </div>
  );
}

function FeedbackPage() {
  const navigate = useNavigate();
  const { latestFeedback, session, setup } = useInterview();
  const playbackAudioRef = useRef(null);
  const playbackUrlRef   = useRef("");

  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceError, setVoiceError]       = useState("");

  const latestQa = session.qaHistory[session.qaHistory.length - 1];

  useEffect(() => () => {
    if (playbackAudioRef.current) playbackAudioRef.current.pause();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  function stopPlaybackAudio() {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = "";
    }
    // Also stop browser TTS fallback
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }

  async function handleSpeakImprovedAnswer() {
    const text = String(latestFeedback?.improvedSampleAnswer || "").trim();
    if (!text) { setVoiceError("No improved answer available to read."); return; }
    try {
      setVoiceError("");
      setIsVoiceLoading(true);
      stopPlaybackAudio();
      const result = await speakVoice({ text, voiceId: setup.voiceId });
      if (!result?.audioBase64) throw new Error("No audio returned.");
      const sampleRate = Number(result?.audioConfig?.sampleRateHertz || 24000);
      const audioUrl = pcm16Base64ToWavUrl(result.audioBase64, { sampleRate });
      playbackUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => { setIsSpeaking(false); setVoiceError("Could not play audio."); };
      await audio.play();
    } catch (error) {
      const usedFallback = speakFallbackInBrowser(text, () => setIsSpeaking(false));
      if (usedFallback) {
        setIsSpeaking(true);
        setVoiceError("Using browser voice fallback.");
      } else {
        setIsSpeaking(false);
        setVoiceError(error.message || "Unable to play audio.");
      }
    } finally {
      setIsVoiceLoading(false);
    }
  }

  if (!latestFeedback || !latestQa) {
    return (
      <div className="fade-up rounded-2xl p-8 text-center card-glow">
        <p className="mb-4" style={{ color: "#7ba3c8" }}>No evaluated answer yet. Complete a question first.</p>
        <Link to="/interview" className="btn-ghost text-sm px-5 py-2 inline-block">Back to Interview</Link>
      </div>
    );
  }

  const strengths  = Array.isArray(latestFeedback.strengths)  ? latestFeedback.strengths  : [];
  const weaknesses = Array.isArray(latestFeedback.weaknesses) ? latestFeedback.weaknesses : [];
  const rubric     = latestFeedback.rubric || {};
  const score      = latestFeedback.score ?? 0;

  const scoreColor = score >= 80 ? "#22d3ee" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="fade-up space-y-4">

      {/* Score header */}
      <div
        className="rounded-3xl p-6 flex items-center justify-between"
        style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(34,211,238,0.12)" }}
      >
        <div>
          <div className="nova-badge mb-2 inline-block">ANSWER FEEDBACK</div>
          <h2 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.01em" }}>Your Results</h2>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold" style={{ color: scoreColor, letterSpacing: "-0.03em" }}>
            {score}
          </div>
          <div className="text-xs mt-1" style={{ color: "#3d6080" }}>out of 100</div>
        </div>
      </div>

      {/* Q&A recap */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(34,211,238,0.07)" }}>
          <p className="nova-badge inline-block mb-2">QUESTION</p>
          <p className="text-sm leading-relaxed" style={{ color: "#c8dff0" }}>{latestQa.question}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(34,211,238,0.07)" }}>
          <p className="nova-badge inline-block mb-2">YOUR ANSWER</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c8dff0" }}>{latestQa.answer}</p>
        </div>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#34d399" }}>✓ Strengths</h3>
          {strengths.length ? (
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: "#a7f3d0" }}>
                  <span style={{ color: "#34d399", flexShrink: 0 }}>•</span>{s}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs" style={{ color: "#2d4a60" }}>None returned.</p>}
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#f87171" }}>△ Areas to Improve</h3>
          {weaknesses.length ? (
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: "#fecaca" }}>
                  <span style={{ color: "#f87171", flexShrink: 0 }}>•</span>{w}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs" style={{ color: "#2d4a60" }}>None returned.</p>}
        </div>
      </div>

      {/* Rubric */}
      {Object.keys(rubric).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(34,211,238,0.07)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Rubric Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(rubric).filter(([, v]) => typeof v === "number").map(([key, val]) => (
              <RubricBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} value={val} />
            ))}
          </div>
        </div>
      )}

      {/* Improved sample answer */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.12)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "#22d3ee" }}>Model Answer</h3>
          <button
            type="button"
            onClick={isSpeaking ? stopPlaybackAudio : handleSpeakImprovedAnswer}
            disabled={isVoiceLoading}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: isSpeaking ? "rgba(239,68,68,0.1)" : "rgba(34,211,238,0.1)",
              border: isSpeaking ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,211,238,0.25)",
              color: isSpeaking ? "#fca5a5" : "#22d3ee",
              opacity: isVoiceLoading ? 0.5 : 1,
              cursor: isVoiceLoading ? "not-allowed" : "pointer"
            }}
          >
            {isVoiceLoading ? "Loading…" : isSpeaking ? "■ Stop" : "▶ Read Aloud"}
          </button>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#a5d8e8" }}>
          {latestFeedback.improvedSampleAnswer || "No sample answer returned."}
        </p>
        {voiceError && <p className="mt-2 text-xs" style={{ color: "#67e8f9" }}>{voiceError}</p>}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => navigate("/interview")} className="btn-primary flex-1 py-3 text-sm">
          Continue Interview
        </button>
        <button type="button" onClick={() => navigate("/summary")} className="btn-ghost py-3 text-sm px-6">
          Final Summary
        </button>
      </div>
    </div>
  );
}

export default FeedbackPage;
