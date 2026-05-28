import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  AlertTriangle,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

function TrendIcon({ direction }) {
  const d = (direction || '').toLowerCase();
  if (d === 'improved') return <TrendingUp className="text-emerald-400" size={20} />;
  if (d === 'declined') return <TrendingDown className="text-rose-400" size={20} />;
  return <Minus className="text-gray-400" size={20} />;
}

function TopicList({ title, items, variant }) {
  const isStrong = variant === 'strong';
  if (!items?.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">No specific topics identified.</p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border p-4 md:p-5 ${
        isStrong
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : 'border-amber-500/25 bg-amber-500/5'
      }`}
    >
      <h3
        className={`flex items-center gap-2 text-sm font-semibold ${
          isStrong ? 'text-emerald-300' : 'text-amber-300'
        }`}
      >
        {isStrong ? <Target size={16} /> : <AlertTriangle size={16} />}
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((topic, i) => (
          <li
            key={`${topic}-${i}`}
            className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm text-gray-200"
          >
            {topic}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreTrendChart({ scores }) {
  if (!scores?.length) return null;
  const max = Math.max(1, ...scores);

  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">Score by question</p>
      <div className="flex items-end gap-1.5 sm:gap-2 h-24">
        {scores.map((score, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full max-w-[2.5rem] rounded-t-md transition-all ${
                score > 0 ? 'bg-gradient-to-t from-indigo-600 to-cyan-400' : 'bg-rose-500/60'
              }`}
              style={{ height: `${Math.max(12, (score / max) * 100)}%` }}
              title={`Q${i + 1}: ${score}`}
            />
            <span className="text-[10px] text-gray-500">Q{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VivaPerformanceReport({ analysis }) {
  if (!analysis) return null;

  const comm = analysis.communication_analysis || {};
  const trends = analysis.performance_trends || {};
  const rating = analysis.overall_rating || 'Developing';

  const ratingColors = {
    Outstanding: 'from-emerald-400 to-cyan-300',
    Strong: 'from-blue-400 to-indigo-300',
    Satisfactory: 'from-indigo-300 to-purple-300',
    Developing: 'from-amber-300 to-orange-300',
    'Needs Improvement': 'from-rose-400 to-orange-400',
  };
  const ratingGradient = ratingColors[rating] || ratingColors.Developing;

  return (
    <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-[#0a0f1f] to-purple-950/30 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
            <Sparkles className="text-indigo-300" size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
              AI performance report
            </p>
            <p
              className={`mt-1 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${ratingGradient}`}
            >
              {rating}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-200 md:text-base">
              {analysis.overall_performance}
            </p>
            {analysis.examiner_notes ? (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                {analysis.examiner_notes}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopicList title="Strong topics" items={analysis.strong_topics} variant="strong" />
        <TopicList title="Weak topics" items={analysis.weak_topics} variant="weak" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <MessageSquare size={16} className="text-cyan-400" />
          Answer quality & communication
        </h3>
        <p className="mt-2 text-sm text-gray-300">{comm.summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['Clarity', comm.clarity],
            ['Confidence', comm.confidence],
            ['Explanation', comm.explanation_quality],
            ['Conceptual depth', comm.conceptual_depth],
            ['Consistency', comm.consistency],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-sm text-gray-200">{value || '—'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <TrendIcon direction={trends.trend_direction} />
          Performance trends
          <span className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-400">
            {trends.trend_direction?.replace(/_/g, ' ') || 'n/a'}
          </span>
        </h3>
        <p className="mt-2 text-sm text-gray-300">{trends.summary}</p>
        <p className="mt-3 text-sm text-gray-400">
          <span className="font-medium text-gray-300">Difficult questions: </span>
          {trends.difficult_question_handling}
        </p>
        {trends.mistake_patterns?.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {trends.mistake_patterns.map((pattern, i) => (
              <li key={i} className="text-sm text-rose-200/90">
                · {pattern}
              </li>
            ))}
          </ul>
        ) : null}
        <ScoreTrendChart scores={trends.score_by_question} />
      </section>

      <section className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4 md:p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200">
          <BookOpen size={16} />
          Improvement recommendations
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-200">
          {(analysis.improvement_suggestions || []).map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
