export default function TabAccount() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Account Profile</h3>
        <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-bold text-2xl overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="U" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Student User</p>
            <p className="text-sm text-gray-400">student@lexico.ai</p>
          </div>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
            Edit
          </button>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-white mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-gray-200 transition-colors">
            🔄 Switch Profile
          </button>
          <button className="w-full text-left px-4 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded-xl text-red-400 transition-colors">
            🚪 Log Out
          </button>
        </div>
      </div>
    </div>
  );
}