import WelcomeScreen from './ChatScreenComp/WelcomeScreen'
import ChatInterface from './ChatScreenComp/ChatInterface'

export default function ChatScreen({ ui, auth, viva, vivaSession, vivaHistory }) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      
      {ui.isVivaStarted ? (
        <ChatInterface />
      ) : (
        <WelcomeScreen ui={ui} auth={auth} viva={viva} vivaSession={vivaSession} vivaHistory={vivaHistory} />
      )}

      
    </div>
  )
}