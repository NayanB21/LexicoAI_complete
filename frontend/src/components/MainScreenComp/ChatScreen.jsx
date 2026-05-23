import WelcomeScreen from './ChatScreenComp/WelcomeScreen'
import ChatInterface from './ChatScreenComp/ChatInterface'
import VivaConfigModal from './ChatScreenComp/VivaConfigModal'

export default function ChatScreen({ ui, viva }) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      
      {ui.isVivaStarted ? (
        <ChatInterface />
      ) : (
        <WelcomeScreen />
      )}

      <VivaConfigModal ui={ui} viva={viva} />
      
    </div>
  )
}