import { useNavigate, useParams } from 'react-router-dom';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const statusStyles = {
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  stopped_early: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

export default function VivaHistoryList({ sessions = [], isLoading }) {
  const navigate = useNavigate();
  const { sessionId: activeId } = useParams();

  if (isLoading) {
    return <p className="text-xs text-gray-500">Loading history...</p>;
  }

  if (!sessions.length) {
    return <p className="text-xs text-gray-500">No completed viva sessions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isActive = activeId === session.id;
        const status = session.completion_status || 'completed';
        const statusLabel = status === 'stopped_early' ? 'Stopped early' : 'Completed';
        const statusClass = statusStyles[status] || statusStyles.completed;
        const fileLabel =
          session.source_file_name ||
          session.title?.replace(/\s*·\s*Attempt\s*\d+$/i, '') ||
          'Viva session';

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => navigate(`/viva/history/${session.id}`)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
              isActive
                ? 'border-indigo-500/50 bg-indigo-500/15 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-bold text-indigo-200">
                Attempt {session.attempt_no ?? 1}
              </span>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-400" title={fileLabel}>
              {fileLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-300">
                {session.difficulty || '—'}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-300">
                {session.question_type || '—'}
              </span>
              {session.has_analysis ? (
                <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-300">
                  Report
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-gray-500">{formatDate(session.completed_at)}</span>
              <span className="font-medium text-gray-400">
                {session.score}/{session.attempted_questions ?? session.total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
