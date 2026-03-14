import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { pcm16Base64ToWavUrl } from "../services/audioCodec";
import { speakVoice } from "../services/interviewApi";

function speakFallbackInBrowser(text, onEnd = () => {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return false;
  }

  const clean = String(text || "").trim();
  if (!clean) {
    return false;
  }

  const utterance = new window.SpeechSynthesisUtterance(clean);
  utterance.lang = "en-US";
  utterance.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

function FeedbackPage() {
  const navigate = useNavigate();
  const { latestFeedback, session } = useInterview();
  const playbackAudioRef = useRef(null);
  const playbackUrlRef = useRef("");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const latestQa = session.qaHistory[session.qaHistory.length - 1];

  useEffect(() => {
    return () => {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
      }
    };
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

    setIsSpeaking(false);
  }

  async function handleSpeakImprovedAnswer() {
    const text = String(latestFeedback?.improvedSampleAnswer || "").trim();
    if (!text) {
      setVoiceError("No improved sample answer is available to read.");
      return;
    }

    try {
      setVoiceError("");
      setIsVoiceLoading(true);
      stopPlaybackAudio();

      const result = await speakVoice({ text });
      if (!result?.audioBase64) {
        throw new Error("Nova Sonic did not return audio.");
      }

      const sampleRate = Number(result?.audioConfig?.sampleRateHertz || 24000);
      const audioUrl = pcm16Base64ToWavUrl(result.audioBase64, { sampleRate });
      playbackUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setVoiceError("Could not play Nova Sonic audio output.");
      };

      await audio.play();
    } catch (error) {
      const usedFallback = speakFallbackInBrowser(text, () => setIsSpeaking(false));
      if (usedFallback) {
        setIsSpeaking(true);
        setVoiceError("Nova Sonic audio output unavailable; using browser voice fallback.");
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
      <section className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 text-amber-100">
        <h2 className="mb-3 text-2xl font-semibold">Feedback</h2>
        <p className="mb-4">No evaluated answer found yet. Complete one interview question first.</p>
        <Link className="underline" to="/interview">
          Back to Interview
        </Link>
      </section>
    );
  }

  const strengths = Array.isArray(latestFeedback.strengths) ? latestFeedback.strengths : [];
  const weaknesses = Array.isArray(latestFeedback.weaknesses) ? latestFeedback.weaknesses : [];

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Answer Feedback</h2>
        <div className="rounded-lg bg-brand-600/20 px-4 py-2 text-sm text-brand-100">
          Score: <strong>{latestFeedback.score ?? "N/A"}</strong>/100
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Question</p>
        <p className="text-slate-100">{latestQa.question}</p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Your Answer</p>
        <p className="whitespace-pre-wrap text-slate-200">{latestQa.answer}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-4">
          <h3 className="mb-3 text-lg font-semibold text-emerald-100">Strengths</h3>
          {strengths.length ? (
            <ul className="list-disc space-y-2 pl-5 text-emerald-50">
              {strengths.map((item, index) => (
                <li key={`strength-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-100/80">No strengths were returned.</p>
          )}
        </div>

        <div className="rounded-lg border border-rose-600/40 bg-rose-500/10 p-4">
          <h3 className="mb-3 text-lg font-semibold text-rose-100">Weaknesses</h3>
          {weaknesses.length ? (
            <ul className="list-disc space-y-2 pl-5 text-rose-50">
              {weaknesses.map((item, index) => (
                <li key={`weakness-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-rose-100/80">No weaknesses were returned.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-brand-100">Improved Sample Answer</h3>
          <button
            type="button"
            onClick={isSpeaking ? stopPlaybackAudio : handleSpeakImprovedAnswer}
            disabled={isVoiceLoading}
            className="rounded-lg border border-brand-300/50 px-3 py-2 text-xs text-brand-50 transition hover:border-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVoiceLoading ? "Loading Voice..." : isSpeaking ? "Stop Voice" : "Read with Nova"}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-brand-50">
          {latestFeedback.improvedSampleAnswer || "No sample answer was returned."}
        </p>
        {voiceError ? <p className="mt-3 text-xs text-brand-100">{voiceError}</p> : null}
      </div>

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
          onClick={() => navigate("/summary")}
          className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
        >
          View Final Summary
        </button>
      </div>
    </section>
  );
}

export default FeedbackPage;
