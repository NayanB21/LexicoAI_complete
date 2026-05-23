import Sidebar from './components/Sidebar'
import MainScreen from './components/MainScreen'
import AuthScreen from './components/auth/AuthScreen' // Naya Import

import { useUI } from './hooks/useUI'
import { useViva } from './hooks/useViva'
import { useAuth } from './hooks/useAuth' // Naya Import

function App() {
  const auth = useAuth(); // Auth hook call kiya
  const ui = useUI();
  const viva = useViva(ui.setIsConfigModalOpen, ui.setIsVivaStarted);

  // 🔥 THE GATEKEEPER: Agar token nahi hai, toh yahi rok do
  if (!auth.token) {
    return <AuthScreen auth={auth} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      
      {ui.isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => ui.setIsSidebarOpen(false)}
        />
      )}

      {/* Humne Sidebar ko auth function pass kiya taaki hum Logout kar sakein */}
      <Sidebar ui={ui} auth={auth} />
      <MainScreen ui={ui} viva={viva} />
      
    </div>
  )
}

export default App