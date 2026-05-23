import { useState } from 'react';
import TabAccount from './settings/TabAccount';
import TabAppearance from './settings/TabAppearance';
import TabAudio from './settings/TabAudio';

export default function SettingsModal({ ui, auth }) {
  const [activeTab, setActiveTab] = useState('account');

  // Naye tree architecture ke hisaab se ui.isSettingsOpen check kar rahe hain
  if (!ui.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl h-[80vh] md:h-[600px] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-gray-900/50 border-b md:border-b-0 md:border-r border-gray-700 p-4 flex flex-col overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-6 px-2 hidden md:block">Settings</h2>
          
          <nav className="space-y-1 flex-1 flex md:flex-col gap-2 md:gap-0">
            <button 
              onClick={() => setActiveTab('account')}
              className={`whitespace-nowrap md:w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'account' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              👤 Account
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`whitespace-nowrap md:w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'appearance' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              🎨 Appearance
            </button>
            <button 
              onClick={() => setActiveTab('audio')}
              className={`whitespace-nowrap md:w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'audio' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              🎙️ Audio & Voice
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
          {/* Close Button */}
          <button 
            onClick={() => ui.setIsSettingsOpen(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>

          {/* Render Active Tab */}
          <div className="mt-8 md:mt-4">
            {activeTab === 'account' && <TabAccount />}
            {activeTab === 'appearance' && <TabAppearance />}
            {activeTab === 'audio' && <TabAudio />}
          </div>
        </div>

      </div>
    </div>
  );
}