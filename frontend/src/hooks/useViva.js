import { useState } from 'react';

export const useViva = (setIsConfigModalOpen, setIsVivaStarted) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (file) => {
    setSelectedFile(file);
    setIsConfigModalOpen(true); 
  };

  const handleStartViva = async (userSettings) => {
    setIsConfigModalOpen(false); 

    if (!selectedFile) return alert("Please select a document first!");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("difficulty", userSettings.difficulty);
    formData.append("questions", userSettings.questions);
    formData.append("voiceMode", userSettings.voiceMode);
    formData.append("counterQuestions", userSettings.counterQuestions);

    try {
      console.log("Uploading to backend with settings...", userSettings);
      
      const response = await fetch("http://localhost:8000/api/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Backend Success Response:", data);
        setIsVivaStarted(true); // Start the chat UI!
      } else {
        alert("Upload failed: " + data.detail);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Failed to connect to backend. Is your FastAPI server running?");
    }
  };

  return { selectedFile, handleFileUpload, handleStartViva };
};