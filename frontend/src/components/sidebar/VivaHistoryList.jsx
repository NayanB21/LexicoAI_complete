import { useNavigate } from 'react-router-dom';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '';
  }
};

export default function VivaHistoryList({ sessions = [], isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return <p className="text-xs text-gray-500">Loading history...</p>;
  }

  if (!sessions.length) {
    return <p className="text-xs text-gray-500">No completed viva sessions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => navigate(`/viva/history/${session.id}`)}
          className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:bg-white/[0.08]"
        >
          <p className="truncate text-sm font-medium text-gray-200">{session.title}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300">
              Attempt {session.attempt_no ?? 1}
            </span>
            {session.completion_status === 'stopped_early' ? (
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">Stopped early</span>
            ) : (
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">Completed</span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {session.score}/{session.attempted_questions ?? session.total} · {session.difficulty} ·{' '}
            {session.question_type}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">{formatDate(session.completed_at)}</p>
        </button>
      ))}
    </div>
  );
}
