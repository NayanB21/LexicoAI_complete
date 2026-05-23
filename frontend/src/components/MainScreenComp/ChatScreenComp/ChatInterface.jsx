export default function ChatInterface() {
  return (
    <div className="flex-1 p-4 pt-20 overflow-y-auto flex flex-col w-full max-w-4xl mx-auto space-y-6">
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl shadow-lg shrink-0">
          🤖
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700 shadow-md max-w-[80%]">
          <p className="text-gray-200">
            Document received! I have processed the text. Are you ready for your first question?
          </p>
        </div>
      </div>
    </div>
  );
}