import React from 'react';
import { Wand2 } from 'lucide-react';
import { useVivaChat } from '../../../hooks/useVivaChat';
import ChatBackground from './ChatBackground';
import MessageBubble from './MessageBubble';

const ChatInterface = ({ initialSetupConfig = null }) => {
  // Saara logic aur states Hook se aa gaya!
  const { 
    messages, isLoading, settings, score, messagesEndRef, 
    handleOptionSelect, fetchNextQuestion, handleAnswerSubmit, setSetupStep, setVivaState, addMessage 
  } = useVivaChat(initialSetupConfig);

  const handlers = { handleOptionSelect, fetchNextQuestion, handleAnswerSubmit, setSetupStep, setVivaState, addMessage };

  return (
    <div className="flex flex-col h-full rounded-2xl md:rounded-3xl overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      
      {/* Background Component */}
      <ChatBackground />

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 pt-16 sm:pt-20 md:pt-28 space-y-5 sm:space-y-6 md:space-y-8 z-10 scrollbar-hide">
        
        {/* Messages Loop */}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} idx={idx} settings={settings} handlers={handlers} />
        ))}
        
        {/* Magical Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in zoom-in duration-500">
             <div className="relative w-10 h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4 mt-2">
                <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-xl opacity-70 animate-pulse"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center border-2 border-white/30 shadow-[0_0_20px_rgba(192,132,252,0.8)] animate-spin-slow">
                  <Wand2 size={20} className="text-white" />
                </div>
              </div>
             <div className="bg-white/5 backdrop-blur-2xl p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl rounded-bl-sm border border-white/10 flex items-center gap-3 md:gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <span className="text-gray-300 font-semibold tracking-widest text-xs sm:text-sm">ANALYZING</span>
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(129,140,248,0.8)]" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-fuchsia-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(232,121,249,0.8)]" style={{animationDelay: '0.3s'}}></div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-10" />
      </div>

    </div>
  );
};

export default ChatInterface;