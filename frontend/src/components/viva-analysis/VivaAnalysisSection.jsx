import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Loader2, Lock } from 'lucide-react';
import VivaPerformanceReport from './VivaPerformanceReport';

function GenerateAnalysisCta({
  sessionId,
  hasAnalysis,
  isGenerating,
  error,
  onGenerate,
  showViewHistoryLink,
}) {
  if (hasAnalysis) {
    return (
      <p className="text-sm text-emerald-300/90">
        Performance report generated. Open the Performance Report section to view it.
      </p>
    );
  }

  if (!sessionId) {
    return (
      <p className="text-xs text-gray-500">
        Saving session… analysis will be available shortly from history.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-purple-950/30 p-4 md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Brain className="text-indigo-300" size={20} />
            Deep performance analysis
          </h3>
          <p className="mt-1 max-w-xl text-sm text-gray-400">
            AI-powered report on strengths, weak topics, trends, and revision advice. Generated once
            and saved to history.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Brain size={16} />
              Generate report
            </>
          )}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {showViewHistoryLink ? (
        <Link
          to={`/viva/history/${sessionId}`}
          className="mt-3 inline-block text-xs text-indigo-300 hover:text-indigo-200"
        >
          View full session in history →
        </Link>
      ) : null}
    </div>
  );
}

export default function VivaAnalysisSection({
  sessionId,
  analysis,
  hasAnalysis,
  onGenerate,
  showViewHistoryLink = true,
  variant = 'full',
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!onGenerate || hasAnalysis || isGenerating) return;
    setError('');
    setIsGenerating(true);
    try {
      await onGenerate();
    } catch (err) {
      setError(err.message || 'Failed to generate analysis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const cta = (
    <GenerateAnalysisCta
      sessionId={sessionId}
      hasAnalysis={hasAnalysis}
      isGenerating={isGenerating}
      error={error}
      onGenerate={handleGenerate}
      showViewHistoryLink={showViewHistoryLink}
    />
  );

  if (variant === 'cta') {
    return cta;
  }

  if (variant === 'report') {
    if (!hasAnalysis || !analysis) {
      return <p className="text-sm text-gray-500">No performance report for this session yet.</p>;
    }
    return <VivaPerformanceReport analysis={analysis} />;
  }

  if (hasAnalysis && analysis) {
    return (
      <div className="mt-4 border-t border-white/10 pt-4">
        <VivaPerformanceReport analysis={analysis} />
        <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Lock size={12} />
          Report saved permanently with this viva attempt.
        </p>
      </div>
    );
  }

  return <div className="mt-4 border-t border-white/10 pt-4">{cta}</div>;
}
