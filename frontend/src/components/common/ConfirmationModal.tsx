import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  message,
  title = "CONFIRM ACTION",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="relative w-full max-w-md mx-4 transform transition-all duration-300 scale-100"
        style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors duration-200 w-6 h-6 flex items-center justify-center"
        >
          <X size={20} />
        </button>

        {/* Modal Content */}
        <div className="p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-3 tracking-wide">
              {title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 text-gray-400 border border-gray-600 rounded-md hover:bg-gray-800 hover:text-white transition-all duration-200 text-sm font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 text-white rounded-md font-medium text-sm transition-all duration-200 hover:transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;