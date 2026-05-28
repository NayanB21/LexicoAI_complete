import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import VivaAnalysisSection from '../components/viva-analysis/VivaAnalysisSection';

export default function VivaReviewPage({ vivaHistory }) {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await vivaHistory.getSessionDetail(sessionId);
        if (isMounted) {
          setSession(data);
          setAnalysis(data?.performance_analysis ?? null);
        }
      } catch (err) {
        if (isMounted) setError('Unable to load this viva review session.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [sessionId, vivaHistory]);

  const handleGenerateAnalysis = async () => {
    const result = await vivaHistory.generateAnalysis(sessionId);
    setAnalysis(result);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            has_analysis: true,
            performance_analysis: result,
          }
        : prev,
    );
    return result;
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-400">Loading review...</div>;
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-300">{error || 'Session not found.'}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-indigo-300 hover:text-indigo-200">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const hasAnalysis = session.has_analysis || !!analysis;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Viva Review</p>
        <h1 className="mt-2 text-xl font-semibold text-white md:text-2xl">{session.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
            Attempt {session.attempt_no ?? 1}
          </span>
          {session.completion_status === 'stopped_early' ? (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Stopped early</span>
          ) : (
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">Completed</span>
          )}
          {hasAnalysis ? (
            <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-xs text-purple-300">
              AI report
            </span>
          ) : null}
        </div>
        {session.source_file_name ? (
          <p className="mt-1 text-xs text-gray-500">Document: {session.source_file_name}</p>
        ) : null}
        <p className="mt-2 text-sm text-gray-300">
          Score: {session.result.score}/{session.result.attempted_questions ?? session.result.total} · Avg{' '}
          {(session.result.average_score ?? 0).toFixed(2)} · {session.setup.difficulty} · {session.setup.question_type}
        </p>
      </header>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <VivaAnalysisSection
          sessionId={sessionId}
          analysis={analysis}
          hasAnalysis={hasAnalysis}
          onGenerate={handleGenerateAnalysis}
          showViewHistoryLink={false}
        />
      </div>

      {session.attempts?.length > 1 ? (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">All attempts</p>
          <div className="mt-2 space-y-2">
            {session.attempts.map((attempt) => (
              <div key={attempt.attempt_no} className="rounded-lg bg-black/30 px-3 py-2 text-sm text-gray-300">
                Attempt {attempt.attempt_no}: {attempt.score}/{attempt.attempted_questions} ·{' '}
                {attempt.completion_status === 'stopped_early' ? 'Stopped early' : 'Completed'}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Question & answer log</h2>
        {session.history.map((item, index) => (
          <article key={index} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Question {index + 1}</p>
            <p className="mt-2 text-sm text-gray-100">{item.q}</p>

            <div className="mt-3 rounded-xl bg-black/30 p-3">
              <p className="text-xs text-gray-400">Your answer</p>
              <p className="mt-1 text-sm text-gray-200">{item.a}</p>
            </div>

            <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
              <p className="text-xs text-indigo-300">
                Evaluation · Score: {item.e?.score ?? '—'}
              </p>
              <p className="mt-1 text-sm text-gray-200">{item.e?.feedback}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
