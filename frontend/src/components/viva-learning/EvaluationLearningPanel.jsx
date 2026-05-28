import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Loader2,
  Send,
  Wand2,
} from 'lucide-react';

function DoubtThread({ doubts, readOnly }) {
  if (!doubts?.length) return null;
  return (
    <div className="mt-3 space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
      {doubts.map((turn, i) => (
        <div key={i} className="space-y-2">
          <div className="rounded-lg bg-indigo-600/20 border border-indigo-500/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-indigo-300/80">Your doubt</p>
            <p className="mt-1 text-sm text-gray-100 whitespace-pre-wrap break-words">{turn.user}</p>
          </div>
          <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Tutor</p>
            <p className="mt-1 text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {turn.assistant}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EvaluationLearningPanel({
  historyIndex,
  learning,
  showNext = true,
  readOnly = false,
  loadingMode = null,
  onSubmitDoubt,
  onRequestExplanation,
  onNextQuestion,
  settings,
}) {
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');

  const doubts = learning?.doubts || [];
  const deepExplanation = learning?.deep_explanation;
  const explanationTitle = learning?.explanation_title;
  const isDoubtLoading = loadingMode === 'doubt';
  const isExplainLoading = loadingMode === 'explain';

  const handleSendDoubt = async () => {
    const text = doubtInput.trim();
    if (!text || readOnly || isDoubtLoading) return;
    setDoubtOpen(true);
    await onSubmitDoubt?.(historyIndex, text);
    setDoubtInput('');
  };

  const handleExplain = async () => {
    if (readOnly || isExplainLoading || deepExplanation) {
      setExplainOpen(true);
      return;
    }
    setExplainOpen(true);
    await onRequestExplanation?.(historyIndex);
  };

  if (readOnly && !doubts.length && !deepExplanation) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
        Learning assist
      </p>

      {!readOnly ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {showNext ? (
            <button
              type="button"
              onClick={() => onNextQuestion?.(settings)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:scale-[1.02] transition-transform"
            >
              Next Question <Wand2 size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDoubtOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            <HelpCircle size={14} />
            Ask Doubt
            {doubtOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={handleExplain}
            disabled={isExplainLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
          >
            {isExplainLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <BookOpen size={14} />
            )}
            Need More Explanation
            {explainOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      ) : null}

      {doubtOpen || (readOnly && doubts.length > 0) ? (
        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 sm:p-4">
          <p className="text-xs font-semibold text-cyan-300">Doubts & follow-ups</p>
          <DoubtThread doubts={doubts} readOnly={readOnly} />
          {!readOnly ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <textarea
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                rows={2}
                placeholder="e.g. Why was my answer wrong? Explain this concept simply…"
                className="flex-1 resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                disabled={isDoubtLoading}
              />
              <button
                type="button"
                onClick={handleSendDoubt}
                disabled={!doubtInput.trim() || isDoubtLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDoubtLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {(explainOpen || (readOnly && deepExplanation)) && (
        <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 sm:p-4">
          <p className="text-xs font-semibold text-purple-300">
            {explanationTitle || 'Deeper explanation'}
          </p>
          {isExplainLoading ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Generating explanation…
            </p>
          ) : deepExplanation ? (
            <div className="mt-2 max-h-80 overflow-y-auto text-sm leading-relaxed text-gray-200 whitespace-pre-wrap break-words scrollbar-hide">
              {deepExplanation}
            </div>
          ) : !readOnly ? (
            <p className="mt-2 text-sm text-gray-500">Click the button above to generate.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
