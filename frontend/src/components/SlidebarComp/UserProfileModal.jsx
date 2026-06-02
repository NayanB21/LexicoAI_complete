import { X, Mail, BookOpen, CheckCircle2, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { formatStatDate } from '../../utils/vivaStats';

function StatCard({ icon: Icon, value, label, iconClass }) {
  return (
    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
      <Icon className={`mb-2 ${iconClass}`} size={22} />
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

export default function UserProfileModal({ ui, auth, vivaHistory }) {
  if (!ui.isProfileOpen) return null;

  const userName = auth?.user?.name || 'User';
  const userEmail = auth?.user?.email || '';
  const stats = vivaHistory?.stats || null;
  const isLoadingStats = !!vivaHistory?.isStatsLoading;

  const avgDisplay =
    stats?.average_score_percentage != null ? `${Math.round(stats.average_score_percentage)}%` : '--';
  const bestDisplay =
    stats?.best_score_percentage != null
      ? `${Math.round(stats.best_score_percentage)}%${stats?.best_score_context?.attempt_no ? ` • Attempt #${stats.best_score_context.attempt_no}` : stats?.best_score_context?.source_file_name ? ` • ${stats.best_score_context.source_file_name}` : ''}`
      : '--';
  const hasData = (stats?.total_vivas || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <button
            type="button"
            onClick={() => ui.setIsProfileOpen(false)}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 flex flex-col items-center relative">
          <div className="-mt-12 p-1 bg-gray-800 rounded-full z-10">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-800">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-white">{userName}</h2>
            {userEmail ? (
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <Mail size={14} />
                <span className="text-sm">{userEmail}</span>
              </div>
            ) : null}
          </div>
          <div className="w-full h-px bg-gray-700 my-6" />
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-left">
              Viva statistics
              {isLoadingStats ? (
                <span className="ml-2 text-xs font-normal normal-case text-gray-500">Updating…</span>
              ) : null}
            </h3>
            {!hasData ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Total Vivas: 0 · Completed: 0 · Average Score: -- · Best Score: -- · Last Attempt: Never
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={BookOpen} value={stats.total_vivas ?? 0} label="Total vivas" iconClass="text-blue-400" />
                <StatCard
                  icon={CheckCircle2}
                  value={stats.completed_vivas ?? 0}
                  label="Completed"
                  iconClass="text-emerald-400"
                />
                <StatCard icon={TrendingUp} value={avgDisplay} label="Average score" iconClass="text-purple-400" />
                <StatCard icon={Trophy} value={bestDisplay} label="Best score" iconClass="text-amber-400" />
                <div className="col-span-2 bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 flex items-center justify-center gap-2 text-center">
                  <Calendar className="text-cyan-400 shrink-0" size={18} />
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {formatStatDate(stats?.last_attempt_at ? new Date(stats.last_attempt_at) : null)}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">Last attempt</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
