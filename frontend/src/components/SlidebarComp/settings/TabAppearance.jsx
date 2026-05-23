export default function TabAppearance() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Theme Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button className="flex flex-col items-center gap-3 p-4 border border-gray-700 rounded-xl bg-gray-900 hover:border-blue-500 transition-colors">
            <div className="w-full h-20 bg-gray-100 rounded-md border border-gray-300 flex items-center justify-center">
              <span className="text-2xl">☀️</span>
            </div>
            <span className="text-gray-300 font-medium">Light Mode</span>
          </button>

          <button className="flex flex-col items-center gap-3 p-4 border border-blue-500 rounded-xl bg-gray-900 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <div className="w-full h-20 bg-gray-800 rounded-md border border-gray-600 flex items-center justify-center">
              <span className="text-2xl">🌙</span>
            </div>
            <span className="text-white font-medium">Dark Mode (Active)</span>
          </button>

        </div>
      </div>
    </div>
  );
}