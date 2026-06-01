import WelcomeScreen from './ChatScreenComp/WelcomeScreen'
import ChatInterface from './ChatScreenComp/ChatInterface'

export default function ChatScreen({ ui, viva, vivaSession }) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      
      {ui.isVivaStarted ? (
        <ChatInterface />
      ) : (
        <WelcomeScreen ui={ui} viva={viva} vivaSession={vivaSession} />
      )}

      
    </div>
  )
}