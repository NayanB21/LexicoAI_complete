/**
 * Derive profile metrics from viva history list items (API /api/viva/history).
 */
export function computeVivaStatsFromSessions(sessions = []) {
  if (!sessions.length) {
    return {
      totalVivas: 0,
      completedVivas: 0,
      averageScore: null,
      bestScore: null,
      lastAttemptDate: null,
    };
  }

  const perSessionAverage = sessions.map((s) => {
    if (typeof s.average_score === 'number' && !Number.isNaN(s.average_score)) {
      return s.average_score;
    }
    const attempted = s.attempted_questions ?? s.total ?? 0;
    if (attempted <= 0) return 0;
    return (s.score ?? 0) / attempted;
  });

  const completedVivas = sessions.filter((s) => s.completion_status === 'completed').length;

  const bestScore =
    perSessionAverage.length > 0 ? Math.max(...perSessionAverage) : null;

  const averageScore =
    perSessionAverage.length > 0
      ? perSessionAverage.reduce((sum, v) => sum + v, 0) / perSessionAverage.length
      : null;

  let lastAttemptDate = null;
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const d = new Date(s.completed_at);
    if (!lastAttemptDate || d > lastAttemptDate) lastAttemptDate = d;
  }

  return {
    totalVivas: sessions.length,
    completedVivas,
    averageScore,
    bestScore,
    lastAttemptDate,
  };
}

export function formatStatDate(date) {
  if (!date) return '—';
  try {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
