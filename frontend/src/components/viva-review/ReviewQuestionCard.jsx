import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import EvaluationLearningPanel from '../viva-learning/EvaluationLearningPanel';

function ToggleBlock({ label, isOpen, onToggle, children, accent = 'gray' }) {
  const border =
    accent === 'indigo'
      ? 'border-indigo-500/20 bg-indigo-500/5'
      : 'border-white/10 bg-black/30';

  return (
    <div className={`mt-2 rounded-xl border ${border}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-gray-300 sm:text-sm"
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? <div className="border-t border-white/5 px-3 pb-3 pt-1">{children}</div> : null}
    </div>
  );
}

export default function ReviewQuestionCard({ item, index }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const hasLearning =
    item.learning?.doubts?.length > 0 || item.learning?.deep_explanation;

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300/90">
        Question {index + 1}
        {item.e?.score != null ? (
          <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-gray-300">
            Score {item.e.score}
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-100">{item.q}</p>

      <ToggleBlock label="Show your answer" isOpen={showAnswer} onToggle={() => setShowAnswer((v) => !v)}>
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{item.a || '—'}</p>
      </ToggleBlock>

      <ToggleBlock
        label="Show AI feedback"
        isOpen={showFeedback}
        onToggle={() => setShowFeedback((v) => !v)}
        accent="indigo"
      >
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
          {item.e?.feedback || 'No feedback recorded.'}
        </p>
        {item.e?.exact_reference ? (
          <p className="mt-2 border-l-2 border-indigo-500/40 pl-2 text-xs italic text-gray-400">
            {item.e.exact_reference}
          </p>
        ) : null}
      </ToggleBlock>

      {hasLearning ? (
        <EvaluationLearningPanel
          historyIndex={index}
          learning={item.learning}
          showNext={false}
          readOnly
        />
      ) : null}
    </article>
  );
}
