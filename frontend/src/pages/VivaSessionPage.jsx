import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatInterface from '../components/MainScreenComp/ChatScreenComp/ChatInterface';
import VivaSessionWelcome from '../components/viva-session/VivaSessionWelcome';
import VivaSetupWizard from '../components/viva-session/VivaSetupWizard';

export default function VivaSessionPage({ vivaSession, vivaHistory }) {
  const fileName = vivaSession?.uploadedFileName || 'Untitled Document';
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState({
    questions: null,
    mode: '',
    difficulty: '',
    questionType: '',
  });
  const [isRuntimeActive, setIsRuntimeActive] = useState(false);

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
    setIsRuntimeActive(true);
  };

  const handleSessionComplete = async (sessionData) => {
    if (!vivaHistory?.saveSession) return;

    // Map runtime payload to backend persistence schema.
    const payload = {
      title: fileName,
      source_file_name: fileName,
      setup: {
        difficulty: sessionData.settings.difficulty || 'Medium',
        question_type: sessionData.settings.q_type || 'MCQ',
        total_questions: Number(sessionData.settings.questions) || 10,
        mode: sessionData.settings.mode || 'text',
      },
      result: {
        score: sessionData.result.score || 0,
        total: sessionData.result.total || Number(sessionData.settings.questions) || 10,
      },
      history: sessionData.history || [],
    };

    try {
      await vivaHistory.saveSession(payload);
    } catch (error) {
      console.error('Failed to persist viva session history:', error);
    }
  };

  return (
    <div className="min-h-dvh bg-[#050914] text-gray-100">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-12%] h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 md:px-6 md:py-5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/90">Viva Session</p>
              <h1 className="mt-1 truncate text-xl font-semibold text-white md:text-2xl">
                {fileName}
              </h1>
            </div>

            <Link
              to="/"
              className="inline-flex w-fit items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {!isRuntimeActive ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
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
                <p>Questions: <span className="text-indigo-300">{setup.questions ?? '-'}</span></p>
                <p>Mode: <span className="text-indigo-300">{setup.mode || '-'}</span></p>
                <p>Difficulty: <span className="text-indigo-300">{setup.difficulty || '-'}</span></p>
                <p>Question Type: <span className="text-indigo-300">{setup.questionType || '-'}</span></p>
              </div>
            </section>
          </div>
        ) : (
          <section className="h-[calc(100dvh-180px)] min-h-[540px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <ChatInterface initialSetupConfig={runtimeConfig} onSessionComplete={handleSessionComplete} />
          </section>
        )}
      </main>
    </div>
  );
}
