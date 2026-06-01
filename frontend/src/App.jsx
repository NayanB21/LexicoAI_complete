import Sidebar from './components/Sidebar'
import MainScreen from './components/MainScreen'
import AuthScreen from './components/auth/AuthScreen' // Naya Import
import VivaSessionPage from './pages/VivaSessionPage'
import VivaReviewPage from './pages/VivaReviewPage'
import { Route, Routes } from 'react-router-dom'

import { useUI } from './hooks/useUI'
import { useViva } from './hooks/useViva'
import { useAuth } from './hooks/useAuth' // Naya Import
import { useVivaSession } from './hooks/useVivaSession'
import { useVivaHistory } from './hooks/useVivaHistory'

function App() {
  const auth = useAuth(); // Auth hook call kiya
  const ui = useUI();
  const viva = useViva(ui.setIsConfigModalOpen, ui.setIsVivaStarted);
  const vivaSession = useVivaSession();
  const vivaHistory = useVivaHistory(auth.token);

  // 🔥 THE GATEKEEPER: Agar token nahi hai, toh yahi rok do
  if (!auth.token) {
    return <AuthScreen auth={auth} />;
  }

  const withSidebarLayout = (content) => (
    <div className="flex h-dvh max-h-dvh bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {ui.isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => ui.setIsSidebarOpen(false)}
        />
      )}

      <Sidebar ui={ui} auth={auth} vivaHistory={vivaHistory} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{content}</div>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={withSidebarLayout(<MainScreen ui={ui} viva={viva} vivaSession={vivaSession} />)}
      />
      <Route
        path="/viva/session"
        element={withSidebarLayout(<VivaSessionPage vivaSession={vivaSession} vivaHistory={vivaHistory} />)}
      />
      <Route
        path="/viva/history/:sessionId"
        element={withSidebarLayout(<VivaReviewPage vivaHistory={vivaHistory} />)}
      />
    </Routes>
  )
}

export default App