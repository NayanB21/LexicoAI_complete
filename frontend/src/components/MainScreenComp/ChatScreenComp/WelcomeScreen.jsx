import InputArea from '../InputArea'

export default function WelcomeScreen({ ui, viva, vivaSession }) {
  return (
    <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col items-center justify-center space-y-6 sm:space-y-8">
      
      {/* Title Text */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Hello there.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 px-2 sm:px-4">
          Upload a document to start your Viva Voce.
        </p>
      </div>

      {/* Upload Box perfectly stacked below the text */}
      <div className="w-full max-w-3xl">
        <InputArea ui={ui} viva={viva} vivaSession={vivaSession} />
      </div>

    </div>
  )
}