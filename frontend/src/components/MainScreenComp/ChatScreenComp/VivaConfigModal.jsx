import { useState } from 'react';

export default function VivaConfigModal({ ui, viva }) {
  const [settings, setSettings] = useState({
    difficulty: 'Static',
    questions: 10,
    voiceMode: false,
    counterQuestions: true
  });

  if (!ui.isConfigModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button onClick={() => ui.setIsConfigModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">✕</button>
        <h2 className="text-2xl font-bold text-white mb-6">Configure Your Viva</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={settings.difficulty === 'Static'} onChange={() => setSettings({...settings, difficulty: 'Static'})} className="text-blue-500 bg-gray-700 border-gray-600" />
                <span className="text-gray-200">Static</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={settings.difficulty === 'Dynamic'} onChange={() => setSettings({...settings, difficulty: 'Dynamic'})} className="text-blue-500 bg-gray-700 border-gray-600" />
                <span className="text-gray-200">Dynamic</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Questions</label>
            <input type="number" min="1" max="50" value={settings.questions} onChange={(e) => setSettings({...settings, questions: parseInt(e.target.value) || 10})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 outline-none focus:border-blue-500" />
          </div>
        </div>

        <button onClick={() => viva.handleStartViva(settings)} className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg">
          Start Viva Session ➤
        </button>
      </div>
    </div>
  );
}