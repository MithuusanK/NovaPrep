import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { audioBlobToPcm16Base64, pcm16Base64ToWavUrl } from "../services/audioCodec";
import { speakVoice, transcribeVoice } from "../services/interviewApi";

function speakFallbackInBrowser(text, onEnd = () => {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return false;
  }

  const clean = String(text || "").trim();
  if (!clean) return false;

  const utterance = new window.SpeechSynthesisUtterance(clean);
  utterance.lang = "en-US";
  utterance.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

function WaveBars() {
  return (
    <div className="flex items-center gap-1 h-7">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="wave-bar" />
      ))}
    </div>
  );
}

function InterviewPage() {
  const navigate = useNavigate();
  const initialRequestDoneRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const playbackAudioRef = useRef(null);
  const playbackUrlRef = useRef("");
  const suppressNextAutoQuestionSpeechRef = useRef(false);

  const [answer, setAnswer] = useState("");
  const [localError, setLocalError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);

  const {
    setup,
    session,
    currentQuestion,
    latestFeedback,
    setLatestFeedback,
    isLoading,
    apiError,
    requestQuestion,
    requestConversationTurn
  } = useInterview();

  const mediaRecorderSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";

  const recentTurns = session.qaHistory
    .map((item, index) => ({
      question: item.question,
      answer: item.answer,
      interviewerResponse: item.interviewerResponse,
      score: session.evaluations[index]?.score
    }))
    .slice(-3);

  const stopPlaybackAudio = useCallback(() => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }

    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = "";
    }

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const stopMicCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!setup.role || currentQuestion || initialRequestDoneRef.current) return;
    initialRequestDoneRef.current = true;
    requestQuestion().catch(() => {});
  }, [setup.role, currentQuestion, requestQuestion]);

  useEffect(
    () => () => {
      stopMicCapture();
      stopPlaybackAudio();
    },
    [stopMicCapture, stopPlaybackAudio]
  );

  const speakTextWithNovaVoice = useCallback(async (text, fallbackMessage) => {
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return false;
    }

    try {
      setVoiceError("");
      setIsVoiceLoading(true);
      stopPlaybackAudio();

      const result = await speakVoice({ text: cleanText, voiceId: setup.voiceId });
      if (!result?.audioBase64) {
        throw new Error("Nova Sonic did not return audio for this message.");
      }

      const sampleRate = Number(result?.audioConfig?.sampleRateHertz || 24000);
      const audioUrl = pcm16Base64ToWavUrl(result.audioBase64, { sampleRate });
      playbackUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        setVoiceError("Could not play Nova audio.");
      };
      await audio.play();
      return true;
    } catch (error) {
      const usedFallback = speakFallbackInBrowser(cleanText, () => setIsSpeaking(false));
      if (usedFallback) {
        setIsSpeaking(true);
        setVoiceError(fallbackMessage || "Using browser voice fallback.");
        return true;
      } else {
        setIsSpeaking(false);
        setVoiceError(error.message || "Unable to speak this message.");
        return false;
      }
    } finally {
      setIsVoiceLoading(false);
    }
  }, [setup.voiceId, stopPlaybackAudio]);

  const handleSpeakQuestion = useCallback(async () => {
    if (!currentQuestion?.question) {
      setVoiceError("No question available to speak yet.");
      return;
    }

    await speakTextWithNovaVoice(
      currentQuestion.question,
      "Using browser voice fallback for this question."
    );
  }, [currentQuestion, speakTextWithNovaVoice]);

  useEffect(() => {
    if (!autoSpeakQuestion || !currentQuestion?.question) return;
    if (suppressNextAutoQuestionSpeechRef.current) {
      suppressNextAutoQuestionSpeechRef.current = false;
      return;
    }
    handleSpeakQuestion();
  }, [autoSpeakQuestion, currentQuestion?.question, handleSpeakQuestion]);

  if (!setup.role) {
    return (
      <div className="fade-up rounded-2xl p-8 text-center card-glow">
        <p className="mb-4" style={{ color: "#7ba3c8" }}>
          Set up your interview first.
        </p>
        <Link to="/setup" className="btn-ghost text-sm px-5 py-2 inline-block">
          Go to Setup
        </Link>
      </div>
    );
  }

  async function handleGenerateQuestion() {
    setLocalError("");
    setVoiceError("");
    setLatestFeedback(null);
    setAnswer("");
    stopMicCapture();
    stopPlaybackAudio();
    setIsRecording(false);

    try {
      await requestQuestion();
    } catch {
      // apiError already set in context
    }
  }

  async function handleSubmitAnswer(event) {
    event.preventDefault();
    setLocalError("");
    setVoiceError("");
    stopMicCapture();
    setIsRecording(false);

    const trimmedAnswer = answer.trim();

    if (!currentQuestion?.question) {
      setLocalError("No question loaded yet.");
      return;
    }

    if (!trimmedAnswer) {
      setLocalError("Please type or record an answer before submitting.");
      return;
    }

    try {
      suppressNextAutoQuestionSpeechRef.current = true;

      const result = await requestConversationTurn({
        question: currentQuestion.question,
        answer: trimmedAnswer
      });

      setAnswer("");

      if (autoSpeakQuestion) {
        const interviewerResponse = String(result?.interviewerResponse || "").trim();
        const nextQuestionText = String(result?.nextQuestion?.question || "").trim();
        const combinedVoiceScript = [interviewerResponse, nextQuestionText ? `Next question. ${nextQuestionText}` : ""]
          .filter(Boolean)
          .join(" ");

        if (combinedVoiceScript) {
          await speakTextWithNovaVoice(
            combinedVoiceScript,
            "Using browser voice fallback for the interviewer response."
          );
        } else {
          suppressNextAutoQuestionSpeechRef.current = false;
          await handleSpeakQuestion();
        }
      } else {
        suppressNextAutoQuestionSpeechRef.current = false;
      }
    } catch {
      suppressNextAutoQuestionSpeechRef.current = false;
      // apiError already set in context
    }
  }

  async function handleStartRecording() {
    if (!mediaRecorderSupported) {
      setVoiceError("Voice recording not supported in this browser.");
      return;
    }

    try {
      setVoiceError("");
      stopPlaybackAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const selectedMimeType = preferredMimeTypes.find((m) => window.MediaRecorder.isTypeSupported?.(m));

      const recorder = selectedMimeType
        ? new window.MediaRecorder(stream, { mimeType: selectedMimeType })
        : new window.MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsVoiceLoading(true);

        try {
          const recordedBlob = new Blob(audioChunksRef.current, { type: selectedMimeType || "audio/webm" });
          if (!recordedBlob.size) {
            throw new Error("No audio captured. Please try again.");
          }

          const audioBase64 = await audioBlobToPcm16Base64(recordedBlob, { targetSampleRate: 16000 });
          const result = await transcribeVoice({ audioBase64 });
          const transcript = String(result?.transcript || "").trim();

          if (!transcript) {
            throw new Error("No transcript returned. Please try again.");
          }

          setAnswer((prev) => `${prev.trim()} ${transcript}`.trim());
        } catch (error) {
          setVoiceError(error.message || "Could not transcribe audio.");
        } finally {
          setIsVoiceLoading(false);
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
        }
      };

      recorder.onerror = () => {
        setIsRecording(false);
        setVoiceError("Recording failed. Please try again.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      setIsRecording(false);
      setVoiceError(error.message || "Could not start recording.");
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }
  }

  function handleStopRecording() {
    stopMicCapture();
    setIsRecording(false);
  }

  return (
    <div className="fade-up space-y-4">
      <div
        className="rounded-2xl px-5 py-3 flex items-center gap-6 text-xs"
        style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(34,211,238,0.08)" }}
      >
        <span style={{ color: "#3d6080" }}>Role</span>
        <span className="font-medium text-white">{setup.role}</span>
        <span className="w-px h-4" style={{ background: "rgba(34,211,238,0.1)" }} />
        <span style={{ color: "#3d6080" }}>Type</span>
        <span className="font-medium capitalize" style={{ color: "#22d3ee" }}>
          {setup.interviewType}
        </span>
        <span className="w-px h-4" style={{ background: "rgba(34,211,238,0.1)" }} />
        <span style={{ color: "#3d6080" }}>Level</span>
        <span className="font-medium capitalize" style={{ color: "#67e8f9" }}>
          {setup.difficulty}
        </span>
      </div>

      {apiError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {apiError}
        </div>
      )}

      {localError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fde68a" }}
        >
          {localError}
        </div>
      )}

      {voiceError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)", color: "#67e8f9" }}
        >
          {voiceError}
        </div>
      )}

      {recentTurns.length > 0 && (
        <div
          className="rounded-3xl p-5 space-y-3"
          style={{ background: "rgba(10,22,40,0.85)", border: "1px solid rgba(34,211,238,0.08)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Conversation So Far</h3>
            <span className="text-xs" style={{ color: "#3d6080" }}>
              Last {recentTurns.length} turn{recentTurns.length === 1 ? "" : "s"}
            </span>
          </div>

          {recentTurns.map((turn, index) => (
            <div key={`${turn.question}-${index}`} className="space-y-2">
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)", color: "#cffafe" }}
              >
                <p className="text-xs mb-1" style={{ color: "#67e8f9" }}>
                  Interviewer Question
                </p>
                <p>{turn.question}</p>
              </div>

              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#dbeafe" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs" style={{ color: "#93c5fd" }}>
                    Your Answer
                  </p>
                  {typeof turn.score === "number" && (
                    <span className="text-xs" style={{ color: "#67e8f9" }}>
                      Score {turn.score}/100
                    </span>
                  )}
                </div>
                <p className="line-clamp-4">{turn.answer}</p>
              </div>

              {turn.interviewerResponse && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)", color: "#a5f3fc" }}
                >
                  <p className="text-xs mb-1" style={{ color: "#22d3ee" }}>
                    Interviewer Response
                  </p>
                  <p>{turn.interviewerResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(34,211,238,0.12)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white">Current Interviewer Question</h3>
            {isSpeaking && <WaveBars />}
          </div>

          <div className="flex items-center gap-2">
            <span className="nova-badge">Nova Voice</span>
            <button
              type="button"
              onClick={handleGenerateQuestion}
              disabled={isLoading || isVoiceLoading}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              {isLoading ? "Loading..." : "Manual Next Question"}
            </button>
            <button
              type="button"
              onClick={isSpeaking ? stopPlaybackAudio : handleSpeakQuestion}
              disabled={isVoiceLoading || !currentQuestion?.question}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: isSpeaking ? "rgba(239,68,68,0.1)" : "rgba(34,211,238,0.1)",
                border: isSpeaking ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,211,238,0.3)",
                color: isSpeaking ? "#fca5a5" : "#22d3ee",
                opacity: isVoiceLoading || !currentQuestion?.question ? 0.4 : 1,
                cursor: isVoiceLoading || !currentQuestion?.question ? "not-allowed" : "pointer"
              }}
            >
              {isVoiceLoading ? "Loading..." : isSpeaking ? "Stop Voice" : "Speak"}
            </button>
          </div>
        </div>

        {currentQuestion?.question ? (
          <div>
            <p className="text-base leading-relaxed text-white mb-3">{currentQuestion.question}</p>
            {currentQuestion.focusArea && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#3d6080" }}>
                  Focus:
                </span>
                <span className="nova-badge">{currentQuestion.focusArea}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#2d4a60" }}>
            {isLoading ? "Generating question..." : "Click Manual Next Question to begin."}
          </p>
        )}

        <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(34,211,238,0.06)" }}>
          <button
            type="button"
            onClick={() => setAutoSpeakQuestion((v) => !v)}
            className="flex items-center gap-2 text-xs"
            style={{ color: autoSpeakQuestion ? "#22d3ee" : "#3d6080", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span
              className="w-8 h-4 rounded-full relative inline-block transition-all"
              style={{ background: autoSpeakQuestion ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(34,211,238,0.2)" }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{ background: autoSpeakQuestion ? "#22d3ee" : "#2d4a60", left: autoSpeakQuestion ? "16px" : "2px" }}
              />
            </span>
            Auto-read new questions aloud
          </button>
        </div>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(34,211,238,0.08)", backdropFilter: "blur(8px)" }}
      >
        <form onSubmit={handleSubmitAnswer}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-white">Your Answer</label>
            <div className="flex items-center gap-2">
              {isRecording && <WaveBars />}
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isLoading || isVoiceLoading || !mediaRecorderSupported}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${isRecording ? "recording-pulse" : ""}`}
                style={{
                  background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(34,211,238,0.1)",
                  border: isRecording ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(34,211,238,0.25)",
                  color: isRecording ? "#fca5a5" : "#67e8f9",
                  opacity: isLoading || isVoiceLoading || !mediaRecorderSupported ? 0.4 : 1,
                  cursor: isLoading || isVoiceLoading || !mediaRecorderSupported ? "not-allowed" : "pointer"
                }}
              >
                {isRecording ? "Stop Recording" : "Record Voice"}
              </button>
            </div>
          </div>

          {isVoiceLoading && (
            <div className="mb-3 text-xs flex items-center gap-2" style={{ color: "#22d3ee" }}>
              <WaveBars />
              <span>Transcribing with Nova Sonic...</span>
            </div>
          )}

          <textarea
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={isRecording ? "Recording... click Stop when done." : "Type your answer, or use Record Voice above."}
            className="input-nova mb-4"
            style={{ resize: "vertical", minHeight: "120px" }}
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || isVoiceLoading || !currentQuestion?.question}
              className="btn-primary flex-1 py-3"
            >
              {isLoading ? "Thinking..." : "Send Answer"}
            </button>
          </div>
        </form>
      </div>

      {latestFeedback && typeof latestFeedback.score === "number" && (
        <div
          className="fade-up rounded-2xl p-5 flex items-center justify-between"
          style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#22d3ee" }}>
              Last answer evaluated
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#3d6080" }}>
              Score: <strong style={{ color: "#e2f0ff" }}>{latestFeedback.score}</strong>/100
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate("/feedback")} className="btn-primary text-sm px-4 py-2">
              View Detailed Feedback
            </button>
            <button type="button" onClick={() => navigate("/summary")} className="btn-ghost text-sm px-4 py-2">
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPage;
