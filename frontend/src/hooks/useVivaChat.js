import { useState, useRef, useEffect } from 'react';

export const useVivaChat = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      type: 'text',
      content: 'Document successfully processed! Let\'s setup your Viva. What type of questions do you want?'
    },
    { sender: 'bot', type: 'options', content: ['MCQ', 'Short Answer', 'True/False', 'Fill in the blanks'] }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [vivaState, setVivaState] = useState('SETUP'); 
  const [setupStep, setSetupStep] = useState(0); 
  const [settings, setSettings] = useState({ questions: 10, q_type: '', domain: '', difficulty: '' });
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [history, setHistory] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, type, content) => {
    setMessages((prev) => [...prev, { sender, type, content }]);
  };

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
      const finalSettings = { ...settings, difficulty: option };
      setSettings(finalSettings);
      setVivaState('QUESTION');
      fetchNextQuestion(finalSettings);
    }
  };

  const fetchNextQuestion = async (currentSettings) => {
    if (questionCount >= currentSettings.questions) {
      setVivaState('SUMMARY');
      addMessage('bot', 'summary', { score, total: currentSettings.questions, history });
      return;
    }
    setIsLoading(true);
    addMessage('bot', 'text', `Generating Question ${questionCount + 1}...`);
    try {
      const payload = { ...currentSettings, current_q_no: questionCount };
      const res = await fetch('http://localhost:8000/api/viva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("API Failed");
      const qData = await res.json();
      setCurrentQuestionData(qData);
      addMessage('bot', 'question', qData);
    } catch (error) {
      addMessage('bot', 'text', 'Failed to generate question. Is the backend running?');
    }
    setIsLoading(false);
  };

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
      setTimeout(() => {
        addMessage('bot', 'text', 'Ready for the next question?');
        addMessage('bot', 'action', 'NEXT_QUESTION');
      }, 1000);
    } catch (error) {
      addMessage('bot', 'text', 'Evaluation failed.');
    }
    setIsLoading(false);
  };

  return { 
    messages, isLoading, settings, score, messagesEndRef, 
    handleOptionSelect, fetchNextQuestion, handleAnswerSubmit, setSetupStep, setVivaState, addMessage 
  };
};