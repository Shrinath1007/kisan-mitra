// src/components/common/Modal.jsx
import React, { useEffect } from "react";
import "./Modal.css";

const Modal = ({
  title,
  onClose,
  children,
  size = "medium",
  showCloseButton = true,
}) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Prevent background scroll

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      {/* Background Decoration */}
      <div className="modal-background">
        <div className="floating-leaf modal-leaf-1"></div>
        <div className="floating-leaf modal-leaf-2"></div>
        <div className="floating-leaf modal-leaf-3"></div>
      </div>

      <div className={`modal-content ${size}`}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 className="modal-title">{title}</h3>
          </div>

          {showCloseButton && (
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body">{children}</div>

        {/* Optional Modal Footer for actions */}
        <div className="modal-footer">
          <button
            className="btn btn-outline modal-cancel-btn"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
