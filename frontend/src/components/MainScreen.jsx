import Header from './MainScreenComp/Header'
import ChatScreen from './MainScreenComp/ChatScreen'
import InputArea from './MainScreenComp/InputArea'

export default function MainScreen({ ui, viva }) {
  return (
    <div className="flex-1 flex flex-col relative h-full">
      <Header ui={ui} />
      <ChatScreen ui={ui} viva={viva} />
      <InputArea viva={viva} />
    </div>
  )
}