import SettingsModal from './SlidebarComp/SettingsModal'
import UserProfileModal from './SlidebarComp/UserProfileModal'
import VivaHistoryList from './sidebar/VivaHistoryList'

export default function Sidebar({ ui ,auth, vivaHistory }) {
    const userName = auth?.user?.name || "Loading...";

  return (
    <>
      <div className={`${ui.isSidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-40 h-full transition-all duration-300 bg-gray-800 overflow-hidden flex flex-col border-r border-gray-700`}>
        <div className="p-4 font-bold text-lg md:text-xl border-b border-gray-700 text-white">
          Lexico AI
        </div>
        
        <div className="flex-1 p-3 md:p-4 overflow-y-auto">
          <p className="text-sm text-gray-400 mb-2">Recent Vivas</p>
          <VivaHistoryList sessions={vivaHistory?.sessions} isLoading={vivaHistory?.isLoading} />
        </div>

        <div className="p-3 md:p-4 border-t border-gray-700 flex items-center justify-between gap-2">
          <button onClick={() => ui.setIsProfileOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 hover:bg-gray-700/50 p-2 rounded-xl transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold overflow-hidden border border-gray-600">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="U" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-sm text-gray-200 truncate">{userName}</span>
            </div>
          </button>

          <button onClick={() => ui.setIsSettingsOpen(true)} className="shrink-0 text-gray-400 hover:text-gray-200 text-xl transition-colors p-2">
            ⚙️
          </button>
        </div>
      </div>

      <SettingsModal ui={ui} auth={auth} />
      <UserProfileModal ui={ui} auth={auth} />
    </>
  )
}