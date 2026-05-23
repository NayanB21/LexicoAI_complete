import { X, Mail, Edit2, Award, BookOpen, Clock, Activity } from 'lucide-react';

export default function UserProfileModal({ ui, auth }) {
  if (!ui.isProfileOpen) return null;
  // Agar data load ho raha hai, toh fallback text dikhao
  const userName = auth?.user?.name || "Loading...";
  const userEmail = auth?.user?.email || "Loading...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <button onClick={() => ui.setIsProfileOpen(false)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 flex flex-col items-center relative">
          <div className="-mt-12 p-1 bg-gray-800 rounded-full z-10">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-4 border-gray-800">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Profile" className="w-full h-full object-cover" />            </div>

          </div>
          <div className="mt-3 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-white">{userName}</h2>
            <div className="flex items-center gap-2 text-gray-400 mt-1">
              <Mail size={14} />
              <span className="text-sm">{userEmail}</span>
            </div>
          </div>
          <div className="w-full h-px bg-gray-700 my-6"></div>
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-left">Viva Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
                <BookOpen className="text-blue-400 mb-2" size={24} /><span className="text-2xl font-bold text-white">12</span><span className="text-xs text-gray-500 mt-1">Vivas Completed</span>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
                <Activity className="text-purple-400 mb-2" size={24} /><span className="text-2xl font-bold text-white">85%</span><span className="text-xs text-gray-500 mt-1">Avg. Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}