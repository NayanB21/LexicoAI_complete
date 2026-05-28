import { useState } from 'react';

export const useVivaSession = () => {
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadReady, setIsUploadReady] = useState(false);

  const setSessionFromUpload = (fileName) => {
    setUploadedFileName(fileName || 'Untitled Document');
    setIsUploadReady(true);
  };

  const resetSession = () => {
    setUploadedFileName('');
    setIsUploadReady(false);
  };

  return {
    uploadedFileName,
    isUploadReady,
    setSessionFromUpload,
    resetSession,
  };
};
