
import Header from './MainScreenComp/Header'
import ChatScreen from './MainScreenComp/ChatScreen'
import React from 'react';

export default function MainScreen({ ui, viva, vivaSession }) {
  // isUploaded state puri tarah hata di, iski zaroorat hi nahi!
  return (
    <div className="flex-1 flex flex-col relative h-full">
      <Header ui={ui} />
      <ChatScreen ui={ui} viva={viva} vivaSession={vivaSession} />
    </div>
  )
}