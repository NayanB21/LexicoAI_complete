import { useRef } from 'react';

export default function InputArea({ viva }) {
  const fileInputRef = useRef(null);

  const handleAttachmentClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      viva.handleFileUpload(file); 
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl mx-auto z-20">
      <div className="border border-gray-700 rounded-3xl p-2 bg-gray-800 flex items-center gap-3 shadow-lg transition-shadow">
        
        <input 
          type="file" 
          accept=".pdf,.txt,.docx" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />

        <button 
          onClick={handleAttachmentClick}
          className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 text-gray-300 transition-colors"
          title="Upload Document"
        >
          📎
        </button>
        
        <input
          type="text"
          placeholder="Upload a PDF or Paste content to configure your Viva..."
          className="flex-1 p-2 outline-none bg-transparent text-gray-100 placeholder-gray-500"
        />
        
        <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center shadow-md">
          ➤
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-3">
        Lexico can make mistakes. Always verify the source document.
      </p>
    </div>
  )
}