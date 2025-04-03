import React from 'react';

interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Magic Link Sent</h2>
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
