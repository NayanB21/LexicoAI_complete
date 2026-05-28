import React from 'react';
import { User, CheckCircle, XCircle, FileText, ChevronRight, Sparkles, Zap, Wand2 } from 'lucide-react';

export default function MessageBubble({ msg, idx, settings, handlers, immersive = false }) {
  const {
    handleOptionSelect,
    handleAnswerSubmit,
    fetchNextQuestion,
    setSetupStep,
    setVivaState,
    addMessage,
    vivaState,
    completedCount = 0,
    plannedCount = 0,
  } = handlers;

  const isVivaFinished = vivaState === 'SUMMARY';
  const hasReachedQuestionLimit = completedCount >= plannedCount && plannedCount > 0;
  const isPrimaryContent = ['question', 'evaluation', 'summary'].includes(msg.type);
  const useWideLayout = immersive && isPrimaryContent;

  return (
    <div
      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${
        useWideLayout ? 'w-full' : ''
      } animate-in slide-in-from-bottom-5 fade-in duration-700 ease-out`}
    >
      
      {/* Bot Avatar */}
      {msg.sender === 'bot' && (
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4 shrink-0 mt-2">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-400 flex items-center justify-center border-2 border-white/30 shadow-[0_0_20px_rgba(59,130,246,0.6)]">
            <Sparkles size={18} className="text-white drop-shadow-md md:w-[22px] md:h-[22px]" />
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`relative overflow-hidden rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 ${
          useWideLayout
            ? 'w-full max-w-none'
            : 'max-w-[92%] sm:max-w-[88%] md:max-w-[75%]'
        } ${
          msg.sender === 'user'
            ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-br-sm shadow-[0_10px_30px_rgba(99,102,241,0.4)] border border-white/20'
            : 'bg-white/5 backdrop-blur-2xl text-gray-100 rounded-bl-sm border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
        } ${msg.type === 'question' && immersive ? 'border-indigo-500/20 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 sm:p-6 md:p-8' : ''}`}
      >
        
        {/* Type 1: Text */}
        {msg.type === 'text' && <p className="leading-relaxed text-sm sm:text-base md:text-lg font-light tracking-wide drop-shadow-sm break-words">{msg.content}</p>}

        {/* Type 2: Options */}
        {msg.type === 'options' && (
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
            {msg.content.map((opt, i) => (
              <button key={i} onClick={() => handleOptionSelect(opt)} className="group relative px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 bg-black/40 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 border border-white/10 hover:border-transparent rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] overflow-hidden flex items-center gap-2">
                <span className="relative z-10">{opt}</span>
                <ChevronRight size={16} className="relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-4 group-hover:ml-0" />
              </button>
            ))}
          </div>
        )}

        {/* Type 3: Question */}
        {msg.type === 'question' && (
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            <p
              className={`font-bold leading-snug text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-white drop-shadow-lg break-words ${
                immersive
                  ? 'text-xl sm:text-2xl md:text-3xl lg:text-[1.75rem] lg:leading-tight'
                  : 'text-lg sm:text-xl md:text-2xl'
              }`}
            >
              {msg.content.question}
            </p>
            {(() => {
              if (settings.q_type === 'True/False') {
                return (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-5 mt-4 sm:mt-5 md:mt-6">
                    <button onClick={() => handleAnswerSubmit("True")} className="relative overflow-hidden group py-3 sm:py-4 px-3 sm:px-4 md:px-6 rounded-xl md:rounded-2xl bg-black/40 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-400 font-black text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1">TRUE</button>
                    <button onClick={() => handleAnswerSubmit("False")} className="relative overflow-hidden group py-3 sm:py-4 px-3 sm:px-4 md:px-6 rounded-xl md:rounded-2xl bg-black/40 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/20 text-rose-400 font-black text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:-translate-y-1">FALSE</button>
                  </div>
                );
              }
              if (msg.content.options && msg.content.options.length > 0) {
                return (
                  <div className={`space-y-3 sm:space-y-4 mt-4 sm:mt-5 md:mt-6 ${immersive ? 'sm:space-y-3.5' : ''}`}>
                    {msg.content.options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswerSubmit(opt)} className={`w-full text-left rounded-xl md:rounded-2xl bg-black/40 hover:bg-gradient-to-r hover:from-blue-900/50 hover:to-indigo-900/50 border border-white/10 hover:border-blue-500/50 transition-all duration-300 flex items-center gap-2 sm:gap-3 md:gap-4 group hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 ${immersive ? 'p-4 sm:p-5 md:p-6' : 'p-3 sm:p-4 md:p-5'}`}>
                        <span className="flex items-center justify-center min-w-[28px] h-7 sm:min-w-[36px] sm:h-9 rounded-lg bg-white/10 text-xs sm:text-sm font-black group-hover:bg-blue-500 group-hover:text-white transition-colors border border-white/20">{String.fromCharCode(65 + i)}</span>
                        <span className={`flex-1 font-medium text-gray-200 group-hover:text-white transition-colors break-words ${immersive ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'}`}>{opt}</span>
                      </button>
                    ))}
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
                  <textarea id={`ans-${idx}`} className="w-full bg-black/50 border border-white/20 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-sm sm:text-base md:text-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-500 resize-none shadow-inner backdrop-blur-md" rows="4" placeholder="Type your detailed answer here..." />
                  <button onClick={() => handleAnswerSubmit(document.getElementById(`ans-${idx}`).value)} className="self-end px-5 sm:px-6 md:px-8 py-2.5 md:py-3 bg-white text-black font-black tracking-wide rounded-xl hover:bg-indigo-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center gap-2 text-sm md:text-base">Submit <Zap size={16} className="md:w-[18px] md:h-[18px]" /></button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Type 4: Evaluation */}
        {msg.type === 'evaluation' && (
          <div className={`p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border-t-4 backdrop-blur-2xl relative overflow-hidden ${msg.content.score > 0 ? 'bg-gradient-to-b from-emerald-950/40 to-black/40 border-t-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-b from-rose-950/40 to-black/40 border-t-rose-500 shadow-[0_20px_50px_rgba(244,63,94,0.15)]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4 font-black text-lg sm:text-xl md:text-2xl">
              {msg.content.score > 0 ? <CheckCircle className="text-emerald-400" size={28}/> : <XCircle className="text-rose-400" size={28}/>}
              <span className={msg.content.score > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {msg.content.score > 0 ? 'Excellent Answer!' : 'Needs Improvement'}
              </span>
              <span className="ml-auto rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                +{msg.content.score} this question
              </span>
            </div>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-4 md:mb-6 leading-relaxed font-medium break-words">{msg.content.feedback}</p>
            <div className="bg-black/60 p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-indigo-500/30">
              <p className="text-xs md:text-sm text-indigo-400 uppercase tracking-[0.2em] mb-3 font-bold flex items-center gap-2"><FileText size={16}/> Extracted Context</p>
              <p className="text-gray-300 text-sm md:text-base font-serif italic border-l-2 border-indigo-500/50 pl-3 md:pl-4 break-words">"{msg.content.exact_reference}"</p>
            </div>
          </div>
        )}

        {/* Type 5: Action — hidden when viva is done or all questions answered */}
        {msg.type === 'action' && !isVivaFinished && !hasReachedQuestionLimit && (
           <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 md:mt-6">
             <button onClick={() => fetchNextQuestion(settings)} className="relative px-4 sm:px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl font-bold text-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center gap-2 text-sm md:text-base">Next Question <Wand2 size={16} className="md:w-[18px] md:h-[18px]"/></button>
           </div>
        )}

        {/* Type 6: Summary */}
        {msg.type === 'summary' && (
          <div className="text-center p-5 sm:p-8 md:p-10 space-y-5 md:space-y-8 rounded-2xl bg-gradient-to-b from-indigo-900/40 to-black/60 border border-indigo-500/30">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-xl">
              {msg.content.stoppedEarly ? 'Viva Ended Early' : 'Viva Concluded!'}
            </h2>
            <p className="text-sm text-gray-400">
              {msg.content.attempted ?? 0} of {msg.content.total} questions attempted
              {typeof msg.content.average === 'number' ? ` · Avg ${msg.content.average.toFixed(2)}` : ''}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl sm:text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">{msg.content.score}</span>
              <span className="text-2xl sm:text-3xl md:text-4xl text-gray-500 font-black mt-4 sm:mt-8 md:mt-10">/ {msg.content.attempted ?? msg.content.total}</span>
            </div>
            {handlers.onReattempt ? (
              <button
                type="button"
                onClick={handlers.onReattempt}
                className="mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500"
              >
                Reattempt Viva
              </button>
            ) : null}
          </div>
        )}
      </div>
      
      {/* User Avatar */}
      {msg.sender === 'user' && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center ml-2 sm:ml-3 md:ml-4 shrink-0 mt-2 border-2 border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <User size={16} className="text-white drop-shadow-md md:w-[20px] md:h-[20px]" />
        </div>
      )}
    </div>
  );
}