import React from 'react';

export default function ChatBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[#050B14]"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{animationDelay: '4s'}}></div>
    </>
  );
}