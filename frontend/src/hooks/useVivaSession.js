import { useState } from 'react';

export const useVivaSession = () => {
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadReady, setIsUploadReady] = useState(false);
  const [isDocumentProcessed, setIsDocumentProcessed] = useState(false);

  const setSessionFromUpload = (fileName) => {
    setUploadedFileName(fileName || 'Untitled Document');
    setIsUploadReady(true);
    setIsDocumentProcessed(true);
  };

  const resetSession = () => {
    setUploadedFileName('');
    setIsUploadReady(false);
    setIsDocumentProcessed(false);
  };

  return {
    uploadedFileName,
    isUploadReady,
    isDocumentProcessed,
    setSessionFromUpload,
    resetSession,
  };
};
