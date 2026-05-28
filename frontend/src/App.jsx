import Sidebar from './components/Sidebar'
import MainScreen from './components/MainScreen'
import AuthScreen from './components/auth/AuthScreen' // Naya Import
import VivaSessionPage from './pages/VivaSessionPage'
import { Route, Routes } from 'react-router-dom'

import { useUI } from './hooks/useUI'
import { useViva } from './hooks/useViva'
import { useAuth } from './hooks/useAuth' // Naya Import
import { useVivaSession } from './hooks/useVivaSession'

function App() {
  const auth = useAuth(); // Auth hook call kiya
  const ui = useUI();
  const viva = useViva(ui.setIsConfigModalOpen, ui.setIsVivaStarted);
  const vivaSession = useVivaSession();

  // 🔥 THE GATEKEEPER: Agar token nahi hai, toh yahi rok do
  if (!auth.token) {
    return <AuthScreen auth={auth} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex h-screen min-h-dvh bg-gray-900 text-gray-100 font-sans overflow-hidden">
            {ui.isSidebarOpen && (
              <div
                className="absolute inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => ui.setIsSidebarOpen(false)}
              />
            )}

            <Sidebar ui={ui} auth={auth} />
            <MainScreen ui={ui} viva={viva} vivaSession={vivaSession} />
          </div>
        }
      />
      <Route path="/viva/session" element={<VivaSessionPage vivaSession={vivaSession} />} />
    </Routes>
  )
}

export default App