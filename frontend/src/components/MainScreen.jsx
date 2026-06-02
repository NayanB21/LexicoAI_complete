
import Header from './MainScreenComp/Header'
import ChatScreen from './MainScreenComp/ChatScreen'
import React from 'react';

export default function MainScreen({ ui, auth, viva, vivaSession, vivaHistory }) {
  // isUploaded state puri tarah hata di, iski zaroorat hi nahi!
  return (
    <div className="flex-1 flex flex-col relative h-full">
      <Header ui={ui} />
      <ChatScreen ui={ui} auth={auth} viva={viva} vivaSession={vivaSession} vivaHistory={vivaHistory} />
    </div>
  )
}