import { useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';
import StepQuestionCount from './steps/StepQuestionCount';
import StepDifficulty from './steps/StepDifficulty';
import StepQuestionType from './steps/StepQuestionType';
import VivaStepCard from './VivaStepCard';

const domainOptions = ['Conceptual', 'Numerical', 'Reasoning', 'Assertion-Reason', 'General'];

function toDraft(settings) {
  return {
    questions: settings?.questions ?? 10,
    difficulty: settings?.difficulty || 'Medium',
    questionType: settings?.q_type || 'MCQ',
    domain: settings?.domain || 'General',
    mode: settings?.mode || 'text',
  };
}

export default function VivaSessionSettingsModal({
  isOpen,
  settings,
  answeredCount = 0,
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(toDraft(settings));
      setError('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!draft.difficulty || !draft.questionType) {
      setError('Please select difficulty and question type.');
      return;
    }
    if (Number(draft.questions) < answeredCount) {
      setError(
        `You have already answered ${answeredCount} question(s). Total cannot be lower than ${answeredCount}.`,
      );
      return;
    }
    onSave({
      questions: Number(draft.questions),
      difficulty: draft.difficulty,
      q_type: draft.questionType,
      domain: draft.domain,
      mode: draft.mode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div
        className="flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050914] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="viva-settings-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Settings className="text-indigo-300" size={20} />
            <div>
              <h2 id="viva-settings-title" className="text-base font-semibold text-white sm:text-lg">
                Change viva settings
              </h2>
              <p className="text-xs text-gray-500">Applies to the next question onward</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 scrollbar-hide space-y-6">
          <StepQuestionCount
            value={draft.questions}
            onChange={(value) => setDraft((d) => ({ ...d, questions: value }))}
          />
          <StepDifficulty
            value={draft.difficulty}
            onChange={(value) => setDraft((d) => ({ ...d, difficulty: value }))}
          />
          <StepQuestionType
            value={draft.questionType}
            onChange={(value) => setDraft((d) => ({ ...d, questionType: value }))}
          />

          <section className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Focus domain</p>
              <p className="mt-1 text-xs text-gray-400">Guides how the AI frames upcoming questions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {domainOptions.map((domain) => (
                <VivaStepCard
                  key={domain}
                  title={domain}
                  selected={draft.domain === domain}
                  onClick={() => setDraft((d) => ({ ...d, domain }))}
                />
              ))}
            </div>
          </section>

          {answeredCount > 0 ? (
            <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
              {answeredCount} question(s) already completed — scoring is unchanged. New settings affect
              upcoming questions only.
            </p>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
