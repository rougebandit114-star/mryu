import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  return (
    <ModalContext.Provider value={{ isAddModalOpen, openAddModal, closeAddModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useTransactionModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useTransactionModal must be used within a ModalProvider');
  }
  return context;
}
