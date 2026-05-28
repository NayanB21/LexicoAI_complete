import { ChevronDown, ChevronUp } from 'lucide-react';

function StatRow({ label, value, valueClassName = 'text-white' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  );
}

/**
 * Vertical viva stats — sidebar on desktop, collapsible strip on mobile.
 */
export default function VivaStatsPanel({
  stats,
  isEvaluating,
  onEndViva,
  className = '',
  showEndButton = true,
}) {
  if (!stats || stats.planned <= 0) return null;

  const lastQDisplay = stats.lastQuestionScore === null ? '—' : stats.lastQuestionScore;
  const progressPercent = Math.min(100, Math.round((stats.completedCount / stats.planned) * 100));

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
          Session progress
        </p>
        <p className="mt-2 text-3xl font-bold leading-none text-white tabular-nums">
          {stats.currentQuestion}
          <span className="text-lg font-medium text-gray-500"> / {stats.planned}</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">Current question</p>
        {isEvaluating ? (
          <p className="mt-2 text-xs text-amber-300 animate-pulse">Evaluating answer…</p>
        ) : null}
      </div>

      <div className="mt-4 shrink-0">
        <div className="mb-1.5 flex justify-between text-[11px] text-gray-400">
          <span>Completion</span>
          <span className="font-medium text-indigo-200">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500">
          {stats.completedCount} of {stats.planned} answered
        </p>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <StatRow label="This question" value={lastQDisplay} valueClassName="text-cyan-200" />
        <StatRow
          label="Cumulative score"
          value={stats.cumulativeScore}
          valueClassName="text-emerald-300"
        />
        <StatRow label="Completion" value={`${progressPercent}%`} valueClassName="text-purple-200" />
        <StatRow
          label="Answered"
          value={`${stats.completedCount} / ${stats.planned}`}
          valueClassName="text-indigo-200"
        />
      </div>

      {showEndButton && onEndViva ? (
        <button
          type="button"
          onClick={onEndViva}
          disabled={isEvaluating}
          className="mt-4 w-full shrink-0 rounded-xl border border-rose-500/40 bg-rose-600/85 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          End Viva
        </button>
      ) : null}
    </div>
  );
}

/** Mobile-only collapsible stats header */
export function VivaStatsMobileStrip({ stats, isEvaluating, onEndViva, isOpen, onToggle }) {
  if (!stats || stats.planned <= 0) return null;

  const progressPercent = Math.min(100, Math.round((stats.completedCount / stats.planned) * 100));

  return (
    <div className="shrink-0 border-b border-white/10 bg-[#050914]/95 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300/80">
            Q {stats.currentQuestion}/{stats.planned}
            {isEvaluating ? ' · Evaluating…' : ` · ${progressPercent}%`}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-gray-400" />
        )}
      </button>
      {isOpen ? (
        <div className="max-h-[min(40vh,280px)] overflow-y-auto border-t border-white/5 px-3 pb-3 scrollbar-hide">
          <VivaStatsPanel
            stats={stats}
            isEvaluating={isEvaluating}
            onEndViva={onEndViva}
            className="pt-2"
          />
        </div>
      ) : null}
    </div>
  );
}
