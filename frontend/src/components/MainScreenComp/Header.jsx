export default function Header({ ui }) {
  return (
    <header className="px-3 py-3 md:p-4 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-transparent">
      <button
        onClick={() => ui.setIsSidebarOpen(!ui.isSidebarOpen)}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300 shrink-0"
        title="Toggle Sidebar"
      >
        ☰
      </button>
      <div className="font-semibold text-gray-200 text-sm sm:text-base text-center truncate px-2">New Viva Session</div>
      <div className="w-9 md:w-10 shrink-0"></div>
    </header>
  )
}