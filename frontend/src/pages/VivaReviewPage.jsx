import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import VivaAnalysisSection from '../components/viva-analysis/VivaAnalysisSection';
import VivaPerformanceReport from '../components/viva-analysis/VivaPerformanceReport';
import ReviewAccordion from '../components/viva-review/ReviewAccordion';
import ReviewQuestionCard from '../components/viva-review/ReviewQuestionCard';

export default function VivaReviewPage({ vivaHistory }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState(['overview']);

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
      } catch {
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

  const toggleSection = (key) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGenerateAnalysis = async () => {
    const result = await vivaHistory.generateAnalysis(sessionId);
    setAnalysis(result);
    setSession((prev) =>
      prev ? { ...prev, has_analysis: true, performance_analysis: result } : prev,
    );
    setOpenSections((prev) => (prev.includes('report') ? prev : [...prev, 'report']));
    return result;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Loading review...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <p className="text-sm text-rose-300">{error || 'Session not found.'}</p>
      </div>
    );
  }

  const hasAnalysis = session.has_analysis || !!analysis;
  const attempted = session.result.attempted_questions ?? session.result.total;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
    <div className="mx-auto w-full max-w-4xl space-y-3 p-4 pb-8 md:p-6 md:pb-10">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10"
      >
        <ArrowLeft size={16} className="text-indigo-300" />
        Back to Dashboard
      </button>

      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Viva Review</p>
        <h1 className="mt-2 text-xl font-semibold text-white md:text-2xl">{session.title}</h1>
      </header>

      <div className="space-y-3">
        <ReviewAccordion
          id="overview"
          title="Overview"
          subtitle="Score, status, and session details"
          isOpen={openSections.includes('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
              Attempt {session.attempt_no ?? 1}
            </span>
            {session.completion_status === 'stopped_early' ? (
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                Stopped early
              </span>
            ) : (
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                Completed
              </span>
            )}
            {hasAnalysis ? (
              <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-xs text-purple-300">
                AI report
              </span>
            ) : null}
          </div>
          {session.source_file_name ? (
            <p className="mt-3 text-sm text-gray-400">
              Document: <span className="text-gray-200">{session.source_file_name}</span>
            </p>
          ) : null}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <dt className="text-xs text-gray-500">Score</dt>
              <dd className="font-semibold text-white">
                {session.result.score}/{attempted}
              </dd>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <dt className="text-xs text-gray-500">Average per question</dt>
              <dd className="font-semibold text-white">
                {(session.result.average_score ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <dt className="text-xs text-gray-500">Difficulty</dt>
              <dd className="text-gray-200">{session.setup.difficulty}</dd>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <dt className="text-xs text-gray-500">Question type</dt>
              <dd className="text-gray-200">{session.setup.question_type}</dd>
            </div>
          </dl>
          {session.attempts?.length > 1 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Other attempts</p>
              <ul className="mt-2 space-y-1.5">
                {session.attempts.map((attempt) => (
                  <li key={attempt.attempt_no} className="text-sm text-gray-400">
                    Attempt {attempt.attempt_no}: {attempt.score}/{attempt.attempted_questions}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </ReviewAccordion>

        <ReviewAccordion
          id="qa"
          title="Question & Answers"
          subtitle={`${session.history?.length ?? 0} questions — expand to review`}
          isOpen={openSections.includes('qa')}
          onToggle={() => toggleSection('qa')}
        >
          <div className="space-y-3">
            {(session.history || []).map((item, index) => (
              <ReviewQuestionCard key={index} item={item} index={index} />
            ))}
          </div>
        </ReviewAccordion>

        <ReviewAccordion
          id="ai"
          title="AI Analysis"
          subtitle={hasAnalysis ? 'Report generated' : 'Generate performance analysis'}
          isOpen={openSections.includes('ai')}
          onToggle={() => toggleSection('ai')}
        >
          <VivaAnalysisSection
            sessionId={sessionId}
            analysis={analysis}
            hasAnalysis={hasAnalysis}
            onGenerate={handleGenerateAnalysis}
            showViewHistoryLink={false}
            variant="cta"
          />
        </ReviewAccordion>

        <ReviewAccordion
          id="report"
          title="Performance Report"
          subtitle={hasAnalysis ? 'Saved AI report' : 'Available after analysis is generated'}
          isOpen={openSections.includes('report')}
          onToggle={() => toggleSection('report')}
        >
          {hasAnalysis && analysis ? (
            <VivaPerformanceReport analysis={analysis} />
          ) : (
            <p className="text-sm text-gray-500">
              Open AI Analysis above and generate a report to view it here.
            </p>
          )}
        </ReviewAccordion>
      </div>
    </div>
    </div>
  );
}
