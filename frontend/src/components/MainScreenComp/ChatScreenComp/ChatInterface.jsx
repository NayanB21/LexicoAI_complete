import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, User, CheckCircle, XCircle, FileText } from 'lucide-react';

const ChatInterface = () => {
  // State Machine Variables
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      type: 'text',
      content: 'Welcome to Lexico AI Viva! Please upload your document to begin.'
    },
    { sender: 'bot', type: 'upload' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [vivaState, setVivaState] = useState('UPLOAD'); // UPLOAD, SETUP, QUESTION, EVALUATION, SUMMARY
  const [setupStep, setSetupStep] = useState(0); 
  
  // Viva Session Data
  const [settings, setSettings] = useState({ questions: 5, q_type: '', domain: '', difficulty: '' });
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [history, setHistory] = useState([]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to add messages
  const addMessage = (sender, type, content) => {
    setMessages((prev) => [...prev, { sender, type, content }]);
  };

  // ==========================================
  // API 1: Upload Document
  // ==========================================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addMessage('user', 'text', `Uploaded: ${file.name}`);
    setIsLoading(true);

    // Backend Upload API Call
    const formData = new FormData();
    formData.append('file', file);
    formData.append('total_questions', settings.questions); // Default

    try {
      const res = await fetch('http://localhost:8000/api/viva/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setVivaState('SETUP');
        addMessage('bot', 'text', 'Document processed! Let\'s setup your Viva. What type of questions do you want?');
        addMessage('bot', 'options', ['MCQ', 'Short Answer', 'True/False', 'Fill in the blanks']);
      }
    } catch (error) {
      addMessage('bot', 'text', 'Error uploading file. Is the backend running?');
    }
    setIsLoading(false);
  };

  // ==========================================
  // Setup Flow (Chips Click Handler)
  // ==========================================
  const handleOptionSelect = (option) => {
    addMessage('user', 'text', option);

    if (setupStep === 0) {
      setSettings({ ...settings, q_type: option });
      setSetupStep(1);
      addMessage('bot', 'text', 'Great! Which domain should I focus on?');
      addMessage('bot', 'options', ['Conceptual', 'Numerical', 'Reasoning', 'Assertion-Reason']);
    } else if (setupStep === 1) {
      setSettings({ ...settings, domain: option });
      setSetupStep(2);
      addMessage('bot', 'text', 'Noted. And what should be the difficulty level?');
      addMessage('bot', 'options', ['Easy', 'Medium', 'Hard']);
    } else if (setupStep === 2) {
      setSettings({ ...settings, difficulty: option });
      setVivaState('QUESTION');
      fetchNextQuestion({ ...settings, difficulty: option });
    }
  };

  // ==========================================
  // API 2: Generate Question
  // ==========================================
  const fetchNextQuestion = async (currentSettings) => {
    if (questionCount >= currentSettings.questions) {
      setVivaState('SUMMARY');
      addMessage('bot', 'summary', { score, total: currentSettings.questions, history });
      return;
    }

    setIsLoading(true);
    addMessage('bot', 'text', `Generating Question ${questionCount + 1}...`);

    try {
      const res = await fetch('http://localhost:8000/api/viva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSettings)
      });
      const qData = await res.json();
      
      setCurrentQuestionData(qData);
      addMessage('bot', 'question', qData);
    } catch (error) {
      addMessage('bot', 'text', 'Failed to generate question.');
    }
    setIsLoading(false);
  };

  // ==========================================
  // API 3: Evaluate Answer
  // ==========================================
  const handleAnswerSubmit = async (userAnswer) => {
    if (!userAnswer.trim()) return;

    addMessage('user', 'text', userAnswer);
    setVivaState('EVALUATION');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/viva/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestionData.question,
          user_answer: userAnswer,
          hidden_context: currentQuestionData.hidden_context
        })
      });
      const evalData = await res.json();
      
      if (evalData.score > 0) setScore((prev) => prev + evalData.score);
      setHistory((prev) => [...prev, { q: currentQuestionData.question, a: userAnswer, e: evalData }]);
      
      addMessage('bot', 'evaluation', evalData);
      setQuestionCount((prev) => prev + 1);

      // Ask to continue
      setTimeout(() => {
        addMessage('bot', 'text', 'Ready for the next question?');
        addMessage('bot', 'action', 'NEXT_QUESTION');
      }, 1000);

    } catch (error) {
      addMessage('bot', 'text', 'Evaluation failed.');
    }
    setIsLoading(false);
  };

  // ==========================================
  // RENDERERS (UI MAGIC)
  // ==========================================
  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-gray-100 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* Avatar */}
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 shrink-0 mt-1">
                <Bot size={18} />
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
            }`}>
              
              {/* Type 1: Normal Text */}
              {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

              {/* Type 2: Upload Zone */}
              {msg.type === 'upload' && (
                <div className="mt-2 border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:bg-gray-700/50 transition cursor-pointer relative">
                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf" />
                  <Upload className="mx-auto text-blue-400 mb-2" size={24} />
                  <p className="text-sm">Click or drop your PDF here</p>
                </div>
              )}

              {/* Type 3: Option Chips */}
              {msg.type === 'options' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.content.map((opt, i) => (
                    <button key={i} onClick={() => handleOptionSelect(opt)} className="px-4 py-2 bg-gray-700 hover:bg-blue-500 hover:text-white rounded-full text-sm font-medium transition border border-gray-600">
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Type 4: Render The Question */}
              {msg.type === 'question' && (
                <div className="space-y-4">
                  <p className="font-semibold text-lg text-white">{msg.content.question}</p>
                  
                  {/* If MCQ, show options as clickable buttons */}
                  {msg.content.options && msg.content.options.length > 0 ? (
                    <div className="space-y-2">
                      {msg.content.options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswerSubmit(opt)} className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-blue-600 transition border border-gray-600">
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* If Subjective, show text area */
                    <div className="flex flex-col gap-2">
                      <textarea 
                        id={`ans-${idx}`}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" 
                        rows="3" 
                        placeholder="Type your answer here..."
                      />
                      <button onClick={() => handleAnswerSubmit(document.getElementById(`ans-${idx}`).value)} className="self-end px-4 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700">
                        Submit Answer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Type 5: Evaluation Result */}
              {msg.type === 'evaluation' && (
                <div className={`p-4 rounded-xl border ${msg.content.score > 0 ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    {msg.content.score > 0 ? <CheckCircle className="text-green-500" size={20}/> : <XCircle className="text-red-500" size={20}/>}
                    <span className={msg.content.score > 0 ? 'text-green-400' : 'text-red-400'}>
                      {msg.content.score > 0 ? 'Correct / Good Attempt!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{msg.content.feedback}</p>
                  <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                      <FileText size={12}/> Exact Source Quote
                    </p>
                    <p className="text-gray-300 text-sm italic">"{msg.content.exact_reference}"</p>
                  </div>
                </div>
              )}

              {/* Type 6: Next Action */}
              {msg.type === 'action' && (
                 <div className="flex gap-2 mt-2">
                   <button onClick={() => fetchNextQuestion(settings)} className="px-4 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Continue Same Settings</button>
                   <button onClick={() => { setSetupStep(0); setVivaState('SETUP'); addMessage('bot', 'options', ['MCQ', 'Short Answer', 'True/False', 'Fill in the blanks']); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">Change Settings</button>
                 </div>
              )}

              {/* Type 7: Final Summary */}
              {msg.type === 'summary' && (
                <div className="text-center p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-white">Viva Completed! 🎉</h2>
                  <div className="text-5xl font-extrabold text-blue-500">{msg.content.score} / {msg.content.total}</div>
                  <p className="text-gray-400">Great effort! Check the sidebar history for your detailed review.</p>
                </div>
              )}

            </div>
            
            {/* User Avatar */}
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center ml-3 shrink-0 mt-1">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 mt-1"><Bot size={18} /></div>
             <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

    </div>
  );
};

export default ChatInterface;