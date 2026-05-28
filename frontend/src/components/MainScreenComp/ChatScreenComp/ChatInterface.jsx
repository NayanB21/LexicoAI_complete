import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useVivaChat } from '../../../hooks/useVivaChat';
import ChatBackground from './ChatBackground';
import MessageBubble from './MessageBubble';
import VivaStatsPanel, { VivaStatsMobileStrip } from '../../viva-session/VivaStatsPanel';
import EndVivaModal from '../../viva-session/EndVivaModal';
import VivaAnalysisSection from '../../viva-analysis/VivaAnalysisSection';

const ChatInterface = ({
  initialSetupConfig = null,
  onSessionComplete = null,
  onReattempt = null,
  runtimeKey = 0,
  sessionId = null,
  performanceAnalysis = null,
  hasAnalysis = false,
  onGenerateAnalysis = null,
}) => {
  const {
    messages,
    isLoading,
    isEvaluating,
    settings,
    scoreStats,
    messagesEndRef,
    vivaState,
    isVivaActive,
    handleOptionSelect,
    fetchNextQuestion,
    handleAnswerSubmit,
    endVivaEarly,
    setSetupStep,
    setVivaState,
    addMessage,
    questionHistory,
    submitDoubt,
    requestDeepExplanation,
    learningLoading,
  } = useVivaChat(initialSetupConfig, { onSessionComplete });

  const [showEndModal, setShowEndModal] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);

  const handlers = {
    handleOptionSelect,
    fetchNextQuestion,
    handleAnswerSubmit,
    setSetupStep,
    setVivaState,
    addMessage,
    onReattempt,
    settings,
    vivaState,
    completedCount: scoreStats.completedCount,
    plannedCount: settings.questions,
    questionHistory,
    submitDoubt,
    requestDeepExplanation,
    learningLoading,
    readOnly: false,
  };

  const loadingLabel = isEvaluating ? 'EVALUATING' : 'ANALYZING';
  const openEndModal = () => setShowEndModal(true);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050914]/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] md:rounded-3xl lg:flex-row">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl md:rounded-3xl">
        <ChatBackground />
      </div>

      {isVivaActive && (
        <>
          <VivaStatsMobileStrip
            stats={scoreStats}
            isEvaluating={isEvaluating}
            onEndViva={openEndModal}
            isOpen={mobileStatsOpen}
            onToggle={() => setMobileStatsOpen((v) => !v)}
          />
          <aside className="relative z-20 hidden w-[220px] shrink-0 flex-col border-r border-white/10 bg-[#050914]/95 backdrop-blur-xl xl:w-[240px] lg:flex">
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <VivaStatsPanel
                stats={scoreStats}
                isEvaluating={isEvaluating}
                onEndViva={openEndModal}
              />
            </div>
          </aside>
        </>
      )}

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 md:px-8 md:py-6 scrollbar-hide">
          <div className="mx-auto w-full max-w-3xl space-y-5 sm:space-y-6 lg:max-w-4xl xl:max-w-5xl lg:space-y-7">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={`${runtimeKey}-${idx}`}
                msg={msg}
                idx={idx}
                settings={settings}
                handlers={handlers}
                immersive
              />
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in zoom-in duration-500">
                <div className="relative mr-2 mt-2 h-10 w-10 shrink-0 md:mr-3 md:h-12 md:w-12">
                  <div className="absolute inset-0 rounded-full bg-fuchsia-500 opacity-70 blur-xl animate-pulse" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-fuchsia-600 to-purple-600 shadow-[0_0_20px_rgba(192,132,252,0.8)]">
                    <Wand2 size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:rounded-3xl md:p-5">
                  <span className="text-xs font-semibold tracking-widest text-gray-300 sm:text-sm">
                    {loadingLabel}
                  </span>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400" />
                    <div
                      className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <div
                      className="h-2.5 w-2.5 animate-bounce rounded-full bg-fuchsia-400"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            {vivaState === 'SUMMARY' ? (
              <VivaAnalysisSection
                sessionId={sessionId}
                analysis={performanceAnalysis}
                hasAnalysis={hasAnalysis}
                onGenerate={onGenerateAnalysis}
              />
            ) : null}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      <EndVivaModal
        isOpen={showEndModal}
        attemptedCount={scoreStats.completedCount}
        onCancel={() => setShowEndModal(false)}
        onConfirm={() => {
          setShowEndModal(false);
          endVivaEarly();
        }}
      />
    </div>
  );
};

export default ChatInterface;
