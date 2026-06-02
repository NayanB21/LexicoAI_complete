import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ChatInterface from '../components/MainScreenComp/ChatScreenComp/ChatInterface';
import VivaSessionWelcome from '../components/viva-session/VivaSessionWelcome';
import VivaSetupWizard from '../components/viva-session/VivaSetupWizard';
import { buildApiUrl } from '../config/api';

const buildHistoryPayload = (sessionData, fileName, startedAtIso) => ({
  title: fileName,
  source_file_name: fileName,
  started_at: startedAtIso,
  completed_at: new Date().toISOString(),
  setup: {
    difficulty: sessionData.settings.difficulty || 'Medium',
    question_type: sessionData.settings.q_type || 'MCQ',
    total_questions: Number(sessionData.settings.questions) || 10,
    mode: sessionData.settings.mode || 'text',
  },
  result: {
    score: sessionData.result.score || 0,
    total: sessionData.result.total || Number(sessionData.settings.questions) || 10,
    attempted_questions: sessionData.result.attempted_questions || 0,
    average_score: sessionData.result.average_score || 0,
  },
  history: sessionData.history || [],
  completion_status: sessionData.completion_status || 'completed',
});

export default function VivaSessionPage({ vivaSession, vivaHistory }) {
  const location = useLocation();
  const runtimeBootstrap = location.state?.runtimeBootstrap || null;
  const reattemptSessionId = location.state?.reattemptSessionId || null;
  const fileName = location.state?.fileName || vivaSession?.uploadedFileName || 'Untitled Document';
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState({
    questions: null,
    mode: '',
    difficulty: '',
    questionType: '',
  });
  const [isRuntimeActive, setIsRuntimeActive] = useState(false);
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [isRuntimeReady, setIsRuntimeReady] = useState(!runtimeBootstrap);
  const [runtimeError, setRuntimeError] = useState('');
  const [sessionStartedAt, setSessionStartedAt] = useState(new Date().toISOString());

  useEffect(() => {
    let mounted = true;
    const bootstrapRuntime = async () => {
      if (!runtimeBootstrap) return;
      setIsRuntimeReady(false);
      setRuntimeError('');
      try {
        const res = await fetch(buildApiUrl('/api/viva/reattempt/bootstrap'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_file_name: runtimeBootstrap.source_file_name,
            important_topics: runtimeBootstrap.important_topics || [],
            important_chunks: runtimeBootstrap.important_chunks || [],
            previous_questions: runtimeBootstrap.previous_questions || [],
          }),
        });
        if (!res.ok) throw new Error('Failed to load reattempt knowledge base');
        if (mounted) {
          setSessionStartedAt(new Date().toISOString());
          setIsRuntimeReady(true);
        }
      } catch (err) {
        if (mounted) {
          setRuntimeError(err?.message || 'Failed to start reattempt.');
        }
      }
    };
    bootstrapRuntime();
    return () => {
      mounted = false;
    };
  }, [runtimeBootstrap]);

  const handleChange = (field, value) => {
    setSetup((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const runtimeConfig = {
    questions: setup.questions ?? 10,
    difficulty: setup.difficulty || 'Medium',
    q_type: setup.questionType || 'MCQ',
    mode: setup.mode || 'text',
    domain: 'General',
  };

  const handleStartRuntime = () => {
    setSessionStartedAt(new Date().toISOString());
    setIsRuntimeActive(true);
  };

  // Each completed run creates a new history entry linked by source_file_name.
  const handleSessionComplete = async (sessionData) => {
    if (!vivaHistory?.saveSession) return;

    const payload = buildHistoryPayload(sessionData, fileName, sessionStartedAt);

    try {
      const data = reattemptSessionId
        ? await vivaHistory.appendReattempt(reattemptSessionId, payload)
        : await vivaHistory.saveSession(payload);
      if (data?.session_id) {
        setSavedSessionId(data.session_id);
      }
    } catch (error) {
      console.error('Failed to persist viva session history:', error);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!savedSessionId || !vivaHistory?.generateAnalysis) return null;
    const analysis = await vivaHistory.generateAnalysis(savedSessionId);
    setPerformanceAnalysis(analysis);
    return analysis;
  };

  const handleReattempt = () => {
    if (!vivaSession?.isDocumentProcessed && !vivaSession?.isUploadReady) {
      alert('Document context is not available. Please upload the PDF again.');
      return;
    }
    setSavedSessionId(null);
    setPerformanceAnalysis(null);
    setRuntimeKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#050914] text-gray-100 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-12%] h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      <main
        className={`relative mx-auto flex w-full min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-5 ${
          isRuntimeActive ? 'max-w-[100rem]' : 'max-w-5xl md:py-6'
        }`}
      >
        <header className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">{fileName}</h1>
            <p className="text-[11px] text-gray-500 sm:text-xs">
              {isRuntimeActive ? 'Live viva session' : 'Setup your viva'}
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-white/10 sm:text-sm sm:px-4 sm:py-2"
          >
            Exit
          </Link>
        </header>

        {!isRuntimeActive ? (
          <div className="min-h-0 flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-8">
            <VivaSessionWelcome />

            <VivaSetupWizard
              currentStep={currentStep}
              setup={setup}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={handleStartRuntime}
            />

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Current Setup Selections</p>
              <div className="mt-3 grid gap-2 text-sm text-gray-200 md:grid-cols-2">
                <p>
                  Questions: <span className="text-indigo-300">{setup.questions ?? '-'}</span>
                </p>
                <p>
                  Mode: <span className="text-indigo-300">{setup.mode || '-'}</span>
                </p>
                <p>
                  Difficulty: <span className="text-indigo-300">{setup.difficulty || '-'}</span>
                </p>
                <p>
                  Question Type: <span className="text-indigo-300">{setup.questionType || '-'}</span>
                </p>
              </div>
            </section>
          </div>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!isRuntimeReady ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
                Preparing reattempt runtime...
              </div>
            ) : runtimeError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {runtimeError}
              </div>
            ) : (
            <ChatInterface
              key={runtimeKey}
              runtimeKey={runtimeKey}
              initialSetupConfig={runtimeConfig}
              onSessionComplete={handleSessionComplete}
              onReattempt={handleReattempt}
              sessionId={savedSessionId}
              performanceAnalysis={performanceAnalysis}
              hasAnalysis={!!performanceAnalysis}
              onGenerateAnalysis={handleGenerateAnalysis}
            />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
