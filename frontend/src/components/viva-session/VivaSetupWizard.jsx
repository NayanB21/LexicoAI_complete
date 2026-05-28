import StepIntro from './steps/StepIntro';
import StepQuestionCount from './steps/StepQuestionCount';
import StepMode from './steps/StepMode';
import StepDifficulty from './steps/StepDifficulty';
import StepQuestionType from './steps/StepQuestionType';

const steps = [
  { id: 'intro', label: 'Welcome' },
  { id: 'questions', label: 'Questions' },
  { id: 'mode', label: 'Mode' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'type', label: 'Type' },
];

export default function VivaSetupWizard({ currentStep, setup, onChange, onNext, onBack }) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const modeIsVoice = setup.mode === 'voice';

  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return Boolean(setup.questions);
    if (currentStep === 2) return setup.mode === 'text';
    if (currentStep === 3) return Boolean(setup.difficulty);
    if (currentStep === 4) return Boolean(setup.questionType);
    return false;
  };

  const stepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepIntro />;
      case 1:
        return <StepQuestionCount value={setup.questions} onChange={(value) => onChange('questions', value)} />;
      case 2:
        return <StepMode value={setup.mode} onChange={(value) => onChange('mode', value)} />;
      case 3:
        return <StepDifficulty value={setup.difficulty} onChange={(value) => onChange('difficulty', value)} />;
      case 4:
        return <StepQuestionType value={setup.questionType} onChange={(value) => onChange('questionType', value)} />;
      default:
        return null;
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/90">Setup Progress</p>
          <h3 className="mt-1 text-sm font-semibold text-white md:text-base">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
          </h3>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 w-10 rounded-full transition-colors ${
                index <= currentStep ? 'bg-indigo-400' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>

      {stepContent()}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        <div className="text-right">
          {modeIsVoice && currentStep === 2 ? (
            <p className="mb-2 text-xs text-fuchsia-300">Voice mode cannot continue yet. Please switch to Text Based.</p>
          ) : null}

          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast ? 'Finish Setup UI' : 'Continue'}
          </button>
        </div>
      </div>
    </section>
  );
}
