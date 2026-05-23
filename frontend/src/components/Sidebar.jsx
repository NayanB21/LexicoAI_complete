import SettingsModal from './SlidebarComp/SettingsModal'
import UserProfileModal from './SlidebarComp/UserProfileModal'

export default function Sidebar({ ui ,auth}) {
    const userName = auth?.user?.name || "Loading...";

  return (
    <>
      <div className={`${ui.isSidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-40 h-full transition-all duration-300 bg-gray-800 overflow-hidden flex flex-col border-r border-gray-700`}>
        <div className="p-4 font-bold text-xl border-b border-gray-700 text-white">
          Lexico AI
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-sm text-gray-400 mb-2">Recent Vivas</p>
        </div>

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <button onClick={() => ui.setIsProfileOpen(true)} className="flex items-center gap-3 hover:bg-gray-700/50 p-2 rounded-xl transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold overflow-hidden border border-gray-600">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="U" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm text-gray-200">{userName}</span>
            </div>
          </button>

          <button onClick={() => ui.setIsSettingsOpen(true)} className="text-gray-400 hover:text-gray-200 text-xl transition-colors p-2">
            ⚙️
          </button>
        </div>
      </div>

      <SettingsModal ui={ui} auth={auth} />
      <UserProfileModal ui={ui} auth={auth} />
    </>
  )
}