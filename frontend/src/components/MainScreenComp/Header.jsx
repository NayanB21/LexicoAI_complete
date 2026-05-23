export default function Header({ ui }) {
  return (
    <header className="p-4 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-transparent">
      <button
        onClick={() => ui.setIsSidebarOpen(!ui.isSidebarOpen)}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300"
        title="Toggle Sidebar"
      >
        ☰
      </button>
      <div className="font-semibold text-gray-200">New Viva Session</div>
      <div className="w-10"></div>
    </header>
  )
}