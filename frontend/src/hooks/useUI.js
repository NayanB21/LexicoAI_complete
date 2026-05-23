import { useState } from 'react';

export const useUI = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isVivaStarted, setIsVivaStarted] = useState(false);

  return {
    isSidebarOpen, setIsSidebarOpen,
    isSettingsOpen, setIsSettingsOpen,
    isProfileOpen, setIsProfileOpen,
    isConfigModalOpen, setIsConfigModalOpen,
    isVivaStarted, setIsVivaStarted
  };
};