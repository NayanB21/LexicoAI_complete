import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';

export default function InputArea({ auth, viva, ui, vivaSession, vivaHistory }) {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
    fileInputRef.current.value = ''; 
  }
  fileInputRef.current.click();
  };


const handleConfirmUploadAndStart = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  setShowStartPrompt(false); // Upload ke time prompt hata do

  const formData = new FormData();
  formData.append('file', selectedFile);
  // formData.append('total_questions', 10);

  try {
    const res = await fetch(buildApiUrl('/api/viva/upload?reuse_if_ready=true'), {
      method: 'POST',
      headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      setIsUploadComplete(true);
      if (vivaSession?.setSessionFromUpload) {
        vivaSession.setSessionFromUpload(selectedFile.name || 'Untitled Document');
      }
      if (vivaHistory?.fetchStats) {
        vivaHistory.fetchStats();
      }
      // Upload success hone par seedha navigate kar do
      navigate('/viva/session'); 
    } else {
      setIsUploading(false);
      setShowStartPrompt(true);
      alert("Backend Error: " + (data.detail || "Upload failed"));
    }
  } catch (error) {
    setIsUploading(false);
    console.error("Upload error:", error);
    alert("Server error. Please try again.");
  }
};

const handleFileSelect = (file) => {
  if (file && file.type === "application/pdf") {
    // File ko locally store karo
    setSelectedFile(file);
    setUploadedFileName(file.name);
    // User ko prompt dikhao (Yes / Re-upload)
    setShowStartPrompt(true);
  } else {
    alert("Only PDF files are allowed!");
  }
};


  const handleFileChange = (e) => handleFileSelect(e.target.files[0]);
  
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); };

  const handleStartViva = () => {
    navigate('/viva/session');
  };


const handleReupload = () => {
  setSelectedFile(null);
  setUploadedFileName('');
  setShowStartPrompt(false);
  setIsUploadComplete(false);
  
  // Wapas file selection dialog khol do
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }

  alert('Please upload a new PDF.');
};

  return (
    <div className="p-4 w-full z-20">
      <div 
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          isUploading ? 'border-gray-500 bg-gray-800/80 cursor-wait' : 
          isDragging 
            ? 'border-blue-500 bg-blue-900/30 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer' 
            : 'border-gray-600 bg-gray-800/60 hover:bg-gray-800 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-pointer group'
        }`}
        onClick={!isUploading ? handleAttachmentClick : undefined}
        onDragOver={!isUploading ? handleDragOver : undefined}
        onDragLeave={!isUploading ? handleDragLeave : undefined}
        onDrop={!isUploading ? handleDrop : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
          isUploading ? 'bg-gray-700' :
          isDragging ? 'bg-blue-600 animate-bounce shadow-[0_0_20px_rgba(37,99,235,0.8)]' : 'bg-gray-700 group-hover:bg-blue-600 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]'
        }`}>
          {isUploading ? (
            <Loader2 size={40} className="text-blue-400 animate-spin" />
          ) : (
            <UploadCloud size={40} className="text-white" />
          )}
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2 relative z-10">
          {isUploading ? "Extracting Concepts via AI..." : isDragging ? "Drop your PDF here!" : "Upload your PDF Syllabus"}
        </h3>
        
        {!isUploading && (
          <p className="text-sm text-gray-400 text-center max-w-md mb-6 relative z-10">
            Drag and drop your document here, or click to browse. Lexico AI will instantly extract the context.
          </p>
        )}

        {!isUploading && (
          <div className="flex items-center gap-2 text-xs font-medium bg-gray-900/80 px-4 py-2 rounded-full text-blue-400 border border-gray-700 relative z-10">
            <FileText size={14} /> Only .PDF files up to 10MB
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-gray-500 mt-5 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
        End-to-End Encrypted. Processed strictly in-memory.
      </p>

      {selectedFile && !isUploading && showStartPrompt && (
        <div className="mt-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/70 p-4 md:p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm md:text-base font-semibold text-white">
            PDF ready: <span className="text-indigo-300">{uploadedFileName || 'Untitled Document'}</span>
          </p>
          <p className="mt-1 text-sm text-gray-300">Should we start viva?</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleConfirmUploadAndStart}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Yes
            </button>
  <button
    onClick={handleReupload}
    className="px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all"
  >
    Reupload PDF
  </button>
          </div>
        </div>
      )}
    </div>
  );
}