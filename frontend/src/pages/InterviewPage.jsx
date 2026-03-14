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

function InterviewPage() {
  const navigate = useNavigate();
  const initialRequestDoneRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const playbackAudioRef = useRef(null);
  const playbackUrlRef = useRef("");

  const [answer, setAnswer] = useState("");
  const [localError, setLocalError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);

  const {
    setup,
    currentQuestion,
    latestFeedback,
    setLatestFeedback,
    isLoading,
    apiError,
    requestQuestion,
    requestAnswerEvaluation,
    addCompletedAnswer
  } = useInterview();

  const mediaRecorderSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";

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

    setIsSpeaking(false);
  }, []);

  const stopMicCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!setup.role || currentQuestion || initialRequestDoneRef.current) {
      return;
    }

    initialRequestDoneRef.current = true;
    requestQuestion().catch(() => {
      // API error state is already handled in context.
    });
  }, [setup.role, currentQuestion, requestQuestion]);

  useEffect(() => {
    return () => {
      stopMicCapture();
      stopPlaybackAudio();
    };
  }, [stopMicCapture, stopPlaybackAudio]);

  const handleSpeakQuestion = useCallback(async () => {
    if (!currentQuestion?.question) {
      setVoiceError("No question available to speak yet.");
      return;
    }

    try {
      setVoiceError("");
      setIsVoiceLoading(true);
      stopPlaybackAudio();

      const result = await speakVoice({
        text: currentQuestion.question
      });

      if (!result?.audioBase64) {
        throw new Error("Nova Sonic did not return audio for this question.");
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
      // Fallback for accounts where Nova Sonic endpoint does not emit pure TTS audio.
      const usedFallback = speakFallbackInBrowser(currentQuestion?.question, () => setIsSpeaking(false));
      if (usedFallback) {
        setIsSpeaking(true);
        setVoiceError("Nova Sonic audio output unavailable; using browser voice fallback for this question.");
      } else {
        setIsSpeaking(false);
        setVoiceError(error.message || "Unable to speak the question.");
      }
    } finally {
      setIsVoiceLoading(false);
    }
  }, [currentQuestion, stopPlaybackAudio]);

  useEffect(() => {
    if (!autoSpeakQuestion || !currentQuestion?.question) {
      return;
    }

    handleSpeakQuestion();
  }, [autoSpeakQuestion, currentQuestion?.question, handleSpeakQuestion]);

  if (!setup.role) {
    return (
      <section className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 text-amber-100">
        <p className="mb-4">Set up your interview first.</p>
        <Link className="underline" to="/setup">
          Go to Setup
        </Link>
      </section>
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
    } catch (error) {
      // API error state is already handled in context.
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
      setLocalError("No question is loaded yet. Generate a question first.");
      return;
    }

    if (!trimmedAnswer) {
      setLocalError("Please type an answer before submitting.");
      return;
    }

    try {
      const evaluation = await requestAnswerEvaluation({
        question: currentQuestion.question,
        answer: trimmedAnswer
      });

      addCompletedAnswer({
        question: currentQuestion.question,
        answer: trimmedAnswer,
        evaluation
      });
    } catch (error) {
      // API error state is already handled in context.
    }
  }

  async function handleStartRecording() {
    if (!mediaRecorderSupported) {
      setVoiceError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      setVoiceError("");
      stopPlaybackAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const selectedMimeType = preferredMimeTypes.find((mimeType) =>
        window.MediaRecorder.isTypeSupported?.(mimeType)
      );

      const recorder = selectedMimeType ? new window.MediaRecorder(stream, { mimeType: selectedMimeType }) : new window.MediaRecorder(stream);

      recorder.ondataavailable = (recordingEvent) => {
        if (recordingEvent.data && recordingEvent.data.size > 0) {
          audioChunksRef.current.push(recordingEvent.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsVoiceLoading(true);

        try {
          const recordedBlob = new Blob(audioChunksRef.current, {
            type: selectedMimeType || "audio/webm"
          });

          if (!recordedBlob.size) {
            throw new Error("No voice audio was captured. Please try again.");
          }

          const audioBase64 = await audioBlobToPcm16Base64(recordedBlob, {
            targetSampleRate: 16000
          });

          const result = await transcribeVoice({ audioBase64 });
          const transcript = String(result?.transcript || "").trim();

          if (!transcript) {
            throw new Error("Nova Sonic returned an empty transcript. Please try speaking again.");
          }

          setAnswer((previousAnswer) =>
            `${previousAnswer.trim()} ${transcript}`.trim()
          );
        } catch (error) {
          setVoiceError(error.message || "Could not transcribe audio.");
        } finally {
          setIsVoiceLoading(false);
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
        }
      };

      recorder.onerror = () => {
        setIsRecording(false);
        setVoiceError("Voice recording failed. Please try again.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      setIsRecording(false);
      setVoiceError(error.message || "Could not start voice recording.");
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }

  function handleStopRecording() {
    stopMicCapture();
    setIsRecording(false);
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h2 className="mb-3 text-2xl font-semibold text-white">Interview</h2>
      <p className="mb-6 text-slate-300">Answer the current question, then submit for AI evaluation.</p>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
        <p>
          <strong className="text-slate-100">Role:</strong> {setup.role}
        </p>
        <p>
          <strong className="text-slate-100">Interview Type:</strong> {setup.interviewType}
        </p>
        <p>
          <strong className="text-slate-100">Difficulty:</strong> {setup.difficulty}
        </p>
      </div>

      {apiError ? (
        <div className="mb-4 rounded-lg border border-rose-600/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {apiError}
        </div>
      ) : null}

      {localError ? (
        <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          {localError}
        </div>
      ) : null}

      {voiceError ? (
        <div className="mb-4 rounded-lg border border-sky-600/40 bg-sky-500/10 p-3 text-sm text-sky-100">{voiceError}</div>
      ) : null}

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-950 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Current Question</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-sky-700/30 px-2 py-1 text-xs text-sky-100">Nova Sonic Voice</span>
            <button
              type="button"
              onClick={handleGenerateQuestion}
              disabled={isLoading || isVoiceLoading}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "New Question"}
            </button>
            <button
              type="button"
              onClick={isSpeaking ? stopPlaybackAudio : handleSpeakQuestion}
              disabled={isVoiceLoading || !currentQuestion?.question}
              className="rounded-lg border border-sky-600/60 px-3 py-2 text-sm text-sky-100 transition hover:border-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSpeaking ? "Stop Voice" : "Speak with Nova"}
            </button>
          </div>
        </div>

        {currentQuestion?.question ? (
          <div className="space-y-2">
            <p className="text-slate-100">{currentQuestion.question}</p>
            {currentQuestion.focusArea ? (
              <p className="text-sm text-slate-400">Focus area: {currentQuestion.focusArea}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-slate-400">No question loaded yet. Click "New Question".</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoSpeakQuestion}
              onChange={(event) => setAutoSpeakQuestion(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            />
            Auto-play Nova voice for new questions
          </label>
          {!mediaRecorderSupported ? (
            <span className="text-xs text-slate-400">Voice recording not supported in this browser.</span>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmitAnswer} className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="candidate-answer" className="block text-sm font-medium text-slate-200">
              Your Answer
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isLoading || isVoiceLoading || !mediaRecorderSupported}
                className="rounded-lg border border-sky-600/60 px-3 py-2 text-xs text-sky-100 transition hover:border-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRecording ? "Stop Recording" : "Record Voice Answer"}
              </button>
            </div>
          </div>
          <textarea
            id="candidate-answer"
            rows={7}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer here, or use Record Voice Answer."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-brand-500 focus:ring-2"
          />
          {isRecording ? <p className="mt-2 text-xs text-sky-300">Recording... click Stop Recording when finished.</p> : null}
          {isVoiceLoading ? <p className="mt-2 text-xs text-sky-300">Processing voice with Nova Sonic...</p> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading || isVoiceLoading || !currentQuestion?.question}
          className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Submitting..." : "Submit Answer"}
        </button>
      </form>

      {latestFeedback && typeof latestFeedback.score === "number" ? (
        <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-4">
          <p className="text-emerald-100">
            Answer evaluated. Score: <strong>{latestFeedback.score}</strong>/100
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/feedback")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              View Feedback
            </button>
            <button
              type="button"
              onClick={handleGenerateQuestion}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500"
            >
              Next Question
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default InterviewPage;
