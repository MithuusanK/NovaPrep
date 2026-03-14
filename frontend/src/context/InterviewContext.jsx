import { createContext, useContext, useMemo, useState } from "react";
import {
  evaluateAnswer,
  generateFinalSummary,
  generateQuestion
} from "../services/interviewApi";

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [setup, setSetup] = useState({
    role: "",
    interviewType: "behavioral",
    difficulty: "entry"
  });

  const [session, setSession] = useState({
    qaHistory: [],
    evaluations: []
  });

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function resetSession() {
    setSession({
      qaHistory: [],
      evaluations: []
    });
    setCurrentQuestion(null);
    setLatestFeedback(null);
    setFinalSummary(null);
    setApiError("");
  }

  async function requestQuestion() {
    setIsLoading(true);
    setApiError("");

    try {
      const result = await generateQuestion({
        role: setup.role,
        interviewType: setup.interviewType,
        difficulty: setup.difficulty,
        previousQuestions: session.qaHistory.map((item) => item.question)
      });

      setCurrentQuestion(result);
      return result;
    } catch (error) {
      setApiError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function requestAnswerEvaluation({ question, answer }) {
    setIsLoading(true);
    setApiError("");

    try {
      const result = await evaluateAnswer({
        role: setup.role,
        interviewType: setup.interviewType,
        difficulty: setup.difficulty,
        question,
        answer
      });

      setLatestFeedback(result);
      return result;
    } catch (error) {
      setApiError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function requestFinalSummary() {
    setIsLoading(true);
    setApiError("");

    try {
      const result = await generateFinalSummary({
        role: setup.role,
        interviewType: setup.interviewType,
        difficulty: setup.difficulty,
        qaHistory: session.qaHistory,
        evaluations: session.evaluations
      });

      setFinalSummary(result);
      return result;
    } catch (error) {
      setApiError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function addCompletedAnswer({ question, answer, evaluation }) {
    setSession((prev) => ({
      qaHistory: [...prev.qaHistory, { question, answer }],
      evaluations: [...prev.evaluations, evaluation]
    }));
  }

  const value = useMemo(
    () => ({
      setup,
      setSetup,
      session,
      setSession,
      resetSession,
      currentQuestion,
      setCurrentQuestion,
      latestFeedback,
      setLatestFeedback,
      finalSummary,
      setFinalSummary,
      isLoading,
      apiError,
      requestQuestion,
      requestAnswerEvaluation,
      requestFinalSummary,
      addCompletedAnswer
    }),
    [
      setup,
      session,
      currentQuestion,
      latestFeedback,
      finalSummary,
      isLoading,
      apiError
    ]
  );

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error("useInterview must be used inside InterviewProvider");
  }

  return context;
}
