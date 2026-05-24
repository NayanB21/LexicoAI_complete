// import Header from './MainScreenComp/Header'
// import ChatScreen from './MainScreenComp/ChatScreen'
// import InputArea from './MainScreenComp/InputArea'
// import React, { useState } from 'react';

// export default function MainScreen({ ui, viva }) {
//   const [isUploaded, setIsUploaded] = useState(false);
//   return (
//     <div className="flex-1 flex flex-col relative h-full">
//       <Header ui={ui} />
//       <ChatScreen ui={ui} viva={viva} />
//       { !isUploaded && (
//         <InputArea viva={viva} setIsUploaded={setIsUploaded} />
//       ) }
//     </div>
//   )
// }


// import Header from './MainScreenComp/Header'
// import ChatScreen from './MainScreenComp/ChatScreen'
// import InputArea from './MainScreenComp/InputArea'
// import React, { useState } from 'react';

// export default function MainScreen({ ui, viva }) {
//   const [isUploaded, setIsUploaded] = useState(false);
  
//   return (
//     <div className="flex-1 flex flex-col relative h-full">
//       <Header ui={ui} />
//       <ChatScreen ui={ui} viva={viva} />
//       { !isUploaded && (
//         <InputArea viva={viva} ui={ui} setIsUploaded={setIsUploaded} />
//       ) }
//     </div>
//   )
// }

import Header from './MainScreenComp/Header'
import ChatScreen from './MainScreenComp/ChatScreen'
import React from 'react';

export default function MainScreen({ ui, viva }) {
  // isUploaded state puri tarah hata di, iski zaroorat hi nahi!
  return (
    <div className="flex-1 flex flex-col relative h-full">
      <Header ui={ui} />
      <ChatScreen ui={ui} viva={viva} />
    </div>
  )
}