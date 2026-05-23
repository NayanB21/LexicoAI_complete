export default function TabAudio() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">AI Voice Output</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Examiner Voice</label>
            <select className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-blue-500">
              <option>Professor (Male - Deep)</option>
              <option>Instructor (Female - Professional)</option>
              <option>Assistant (Neutral)</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="block text-sm text-gray-400 mb-2">Speaking Rate (Speed)</label>
            <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}