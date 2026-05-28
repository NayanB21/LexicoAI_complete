import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function VivaReviewPage({ vivaHistory }) {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await vivaHistory.getSessionDetail(sessionId);
        if (isMounted) setSession(data);
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

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Viva Review</p>
        <h1 className="mt-2 text-xl font-semibold text-white md:text-2xl">{session.title}</h1>
        <p className="mt-2 text-sm text-gray-300">
          Score: {session.result.score}/{session.result.total} · {session.setup.difficulty} · {session.setup.question_type}
        </p>
      </header>

      <section className="mt-4 space-y-3">
        {session.history.map((item, index) => (
          <article key={index} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Question {index + 1}</p>
            <p className="mt-2 text-sm text-gray-100">{item.q}</p>

            <div className="mt-3 rounded-xl bg-black/30 p-3">
              <p className="text-xs text-gray-400">Your answer</p>
              <p className="mt-1 text-sm text-gray-200">{item.a}</p>
            </div>

            <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
              <p className="text-xs text-indigo-300">Evaluation feedback</p>
              <p className="mt-1 text-sm text-gray-200">{item.e.feedback}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
