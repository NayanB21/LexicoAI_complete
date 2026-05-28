import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { buildApiUrl } from '../config/api';

const getNormalizedSettings = (config = {}) => ({
  questions: Number(config.questions) || 10,
  q_type: config.q_type || '',
  domain: config.domain || 'General',
  difficulty: config.difficulty || '',
  mode: config.mode || 'text',
});

const buildScoreStats = (
  cumulativeScore,
  completedCount,
  planned,
  activeQuestionNumber,
  lastQuestionScore,
  vivaState,
) => {
  const average = completedCount > 0 ? cumulativeScore / completedCount : 0;
  const currentQuestion =
    vivaState === 'SUMMARY'
      ? completedCount
      : Math.min(Math.max(activeQuestionNumber, completedCount + 1), planned);

  return {
    cumulativeScore,
    totalScore: cumulativeScore,
    completedCount,
    attempted: completedCount,
    planned,
    average,
    lastQuestionScore,
    currentQuestion,
    progressLabel: `${completedCount}/${planned}`,
  };
};

export const useVivaChat = (initialSetupConfig = null, options = {}) => {
  const { onSessionComplete } = options;
  const hasInitialConfig = Boolean(initialSetupConfig);
  const normalizedInitialSettings = hasInitialConfig ? getNormalizedSettings(initialSetupConfig) : null;

  const [messages, setMessages] = useState(() => {
    if (hasInitialConfig) {
      return [
        {
          sender: 'bot',
          type: 'text',
          content: 'Great setup. Your Viva session is ready. Generating your first question now...',
        },
      ];
    }
    return [
      {
        sender: 'bot',
        type: 'text',
        content: 'Document successfully processed! Let\'s setup your Viva. What type of questions do you want?',
      },
      { sender: 'bot', type: 'options', content: ['MCQ', 'Short Answer', 'True/False', 'Fill in the blanks'] },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [vivaState, setVivaState] = useState(hasInitialConfig ? 'QUESTION' : 'SETUP');
  const [setupStep, setSetupStep] = useState(0);
  const [settings, setSettings] = useState(
    hasInitialConfig ? normalizedInitialSettings : { questions: 10, q_type: '', domain: '', difficulty: '', mode: 'text' },
  );
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastQuestionScore, setLastQuestionScore] = useState(null);
  const [learningLoading, setLearningLoading] = useState(null);

  const messagesEndRef = useRef(null);
  const hasStartedFromSetupRef = useRef(false);
  const hasCompletedSessionRef = useRef(false);

  const cumulativeScoreRef = useRef(0);
  const historyRef = useRef([]);
  const questionCountRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => {
    cumulativeScoreRef.current = cumulativeScore;
  }, [cumulativeScore]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    questionCountRef.current = questionCount;
  }, [questionCount]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const scoreStats = useMemo(
    () =>
      buildScoreStats(
        cumulativeScore,
        questionCount,
        settings.questions,
        activeQuestionNumber || questionCount + 1,
        lastQuestionScore,
        vivaState,
      ),
    [cumulativeScore, questionCount, settings.questions, activeQuestionNumber, lastQuestionScore, vivaState],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, type, content) => {
    setMessages((prev) => [...prev, { sender, type, content }]);
  };

  const updateHistoryLearning = useCallback((index, updater) => {
    setHistory((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      const entry = { ...next[index] };
      const current = entry.learning || {
        doubts: [],
        deep_explanation: null,
        explanation_title: null,
      };
      entry.learning = updater({
        ...current,
        doubts: [...(current.doubts || [])],
      });
      next[index] = entry;
      historyRef.current = next;
      return next;
    });
  }, []);

  const submitDoubt = useCallback(
    async (historyIndex, doubtText) => {
      const entry = historyRef.current[historyIndex];
      if (!entry || !doubtText?.trim()) return;

      setLearningLoading({ index: historyIndex, mode: 'doubt' });
      try {
        const res = await fetch(buildApiUrl('/api/viva/learning/doubt'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: entry.q,
            user_answer: entry.a,
            evaluation_feedback: entry.e.feedback,
            evaluation_score: Number(entry.e.score) || 0,
            exact_reference: entry.e.exact_reference || '',
            hidden_context: entry.hidden_context || '',
            doubt_message: doubtText.trim(),
            prior_doubts: (entry.learning?.doubts || []).map((d) => ({
              user: d.user,
              assistant: d.assistant,
            })),
          }),
        });
        if (!res.ok) throw new Error('Doubt request failed');
        const data = await res.json();
        updateHistoryLearning(historyIndex, (learning) => ({
          ...learning,
          doubts: [
            ...learning.doubts,
            { user: doubtText.trim(), assistant: data.answer },
          ],
        }));
      } catch {
        addMessage('bot', 'text', 'Could not answer your doubt. Please try again.');
      } finally {
        setLearningLoading(null);
      }
    },
    [updateHistoryLearning],
  );

  const requestDeepExplanation = useCallback(
    async (historyIndex) => {
      const entry = historyRef.current[historyIndex];
      if (!entry) return;
      if (entry.learning?.deep_explanation) return;

      setLearningLoading({ index: historyIndex, mode: 'explain' });
      try {
        const res = await fetch(buildApiUrl('/api/viva/learning/explain'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: entry.q,
            user_answer: entry.a,
            evaluation_feedback: entry.e.feedback,
            evaluation_score: Number(entry.e.score) || 0,
            exact_reference: entry.e.exact_reference || '',
            hidden_context: entry.hidden_context || '',
          }),
        });
        if (!res.ok) throw new Error('Explanation request failed');
        const data = await res.json();
        updateHistoryLearning(historyIndex, (learning) => ({
          ...learning,
          deep_explanation: data.explanation,
          explanation_title: data.title,
        }));
      } catch {
        addMessage('bot', 'text', 'Could not generate explanation. Please try again.');
      } finally {
        setLearningLoading(null);
      }
    },
    [updateHistoryLearning],
  );

  const emitSessionComplete = useCallback(
    (stoppedEarly = false) => {
      if (hasCompletedSessionRef.current || typeof onSessionComplete !== 'function') return;
      hasCompletedSessionRef.current = true;

      const currentSettings = settingsRef.current;
      const attempted = historyRef.current.length;
      const totalScore = cumulativeScoreRef.current;
      const average = attempted > 0 ? totalScore / attempted : 0;

      onSessionComplete({
        settings: currentSettings,
        result: {
          score: totalScore,
          total: currentSettings.questions,
          attempted_questions: attempted,
          average_score: average,
        },
        history: historyRef.current,
        completion_status: stoppedEarly ? 'stopped_early' : 'completed',
      });
    },
    [onSessionComplete],
  );

  const showSummary = useCallback(
    (stoppedEarly = false) => {
      const currentSettings = settingsRef.current;
      const attempted = historyRef.current.length;
      const totalScore = cumulativeScoreRef.current;
      const average = attempted > 0 ? totalScore / attempted : 0;

      setVivaState('SUMMARY');
      setActiveQuestionNumber(attempted);
      addMessage('bot', 'summary', {
        score: totalScore,
        total: currentSettings.questions,
        attempted,
        average,
        stoppedEarly,
        history: historyRef.current,
      });
      emitSessionComplete(stoppedEarly);
    },
    [emitSessionComplete],
  );

  const handleOptionSelect = (option) => {
    addMessage('user', 'text', option);
    if (setupStep === 0) {
      setSettings({ ...settings, q_type: option });
      setSetupStep(1);
      addMessage('bot', 'text', 'Great! Which domain should I focus on?');
      addMessage('bot', 'options', ['Conceptual', 'Numerical', 'Reasoning', 'Assertion-Reason']);
    } else if (setupStep === 1) {
      setSettings({ ...settings, domain: option });
      setSetupStep(2);
      addMessage('bot', 'text', 'Noted. And what should be the difficulty level?');
      addMessage('bot', 'options', ['Easy', 'Medium', 'Hard']);
    } else if (setupStep === 2) {
      const finalSettings = { ...settings, difficulty: option };
      setSettings(finalSettings);
      setVivaState('QUESTION');
      fetchNextQuestion(finalSettings);
    }
  };

  const fetchNextQuestion = async (currentSettings) => {
    if (questionCountRef.current >= currentSettings.questions) {
      showSummary(false);
      return;
    }

    const nextQuestionNum = questionCountRef.current + 1;
    setActiveQuestionNumber(nextQuestionNum);
    setIsLoading(true);
    addMessage('bot', 'text', `Generating Question ${nextQuestionNum}...`);

    try {
      const payload = { ...currentSettings, current_q_no: questionCountRef.current };
      const res = await fetch(buildApiUrl('/api/viva/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('API Failed');
      const qData = await res.json();
      setCurrentQuestionData(qData);
      addMessage('bot', 'question', qData);
      setVivaState('QUESTION');
    } catch (error) {
      addMessage('bot', 'text', 'Failed to generate question. Is the backend running?');
    }
    setIsLoading(false);
  };

  const handleAnswerSubmit = async (userAnswer) => {
    if (!userAnswer.trim() || isEvaluating) return;
    addMessage('user', 'text', userAnswer);
    setVivaState('EVALUATION');
    setIsEvaluating(true);
    setIsLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/viva/evaluate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestionData.question,
          user_answer: userAnswer,
          hidden_context: currentQuestionData.hidden_context,
        }),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const evalData = await res.json();
      const qScore = Number(evalData.score) || 0;

      setLastQuestionScore(qScore);
      setCumulativeScore((prev) => {
        const next = prev + qScore;
        cumulativeScoreRef.current = next;
        return next;
      });

      const entry = {
        q: currentQuestionData.question,
        a: userAnswer,
        e: evalData,
        hidden_context: currentQuestionData.hidden_context || '',
      };

      setHistory((prev) => {
        const next = [...prev, entry];
        historyRef.current = next;
        return next;
      });

      const planned = Number(settingsRef.current.questions) || 10;
      const answeredCount = questionCountRef.current + 1;
      const historyIndex = answeredCount - 1;

      setQuestionCount(answeredCount);
      questionCountRef.current = answeredCount;

      addMessage('bot', 'evaluation', { ...evalData, historyIndex });

      // Final question: go straight to results — learning assist stays on evaluation card.
      if (answeredCount >= planned) {
        setTimeout(() => showSummary(false), 600);
      } else {
        setTimeout(() => {
          addMessage('bot', 'text', 'Use learning assist below or continue when ready.');
        }, 600);
      }
    } catch (error) {
      addMessage('bot', 'text', 'Evaluation failed. Please try again.');
    }
    setIsEvaluating(false);
    setIsLoading(false);
  };

  const endVivaEarly = useCallback(() => {
    if (vivaState === 'SUMMARY' || isEvaluating) return;
    if (historyRef.current.length === 0) {
      addMessage('bot', 'text', 'Answer at least one question before ending the viva.');
      return;
    }
    showSummary(true);
  }, [vivaState, isEvaluating, showSummary]);

  useEffect(() => {
    if (!hasInitialConfig || hasStartedFromSetupRef.current) return;
    hasStartedFromSetupRef.current = true;
    fetchNextQuestion(normalizedInitialSettings);
  }, [hasInitialConfig, normalizedInitialSettings]);

  const isVivaActive = !['SUMMARY', 'SETUP'].includes(vivaState);

  return {
    messages,
    isLoading,
    isEvaluating,
    settings,
    score: cumulativeScore,
    cumulativeScore,
    scoreStats,
    messagesEndRef,
    vivaState,
    isVivaActive,
    handleOptionSelect,
    fetchNextQuestion,
    handleAnswerSubmit,
    endVivaEarly,
    setSetupStep,
    setVivaState,
    addMessage,
    questionHistory: history,
    submitDoubt,
    requestDeepExplanation,
    learningLoading,
  };
};
