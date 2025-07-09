import { useState } from 'react';

export type ModalType = 'pizza' | 'threshold' | null;

export default function useModals() {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalProps, setModalProps] = useState<any>({});

  const isModalVisible = modalType !== null;

  function showModal(type: ModalType, props = {}) {
    setModalType(type);
    setModalProps(props);
  }

  function hideModal() {
    setModalType(null);
    setModalProps({});
  }

  return {
    showModal,
    hideModal,
    isModalVisible,
    modalType,
    modalProps,
  };
}
