export default function WelcomeScreen() {
  return (
    <div className="flex-1 p-4 pt-20 overflow-y-auto flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Hello there.
        </h1>
        <p className="text-lg md:text-xl text-gray-400 px-4">
          Upload a document to start your Viva Voce.
        </p>
      </div>
    </div>
  )
}