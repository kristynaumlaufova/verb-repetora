import React, { useRef } from "react";
import styles from "./DeleteConfirmation.module.css";
import dialogStyles from "../Dialog.module.css";
import useClickOutside from "../../../hooks/useClickOutside";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  title: string;
  message: string;
  isDeleteDisabled?: boolean;
  disabledMessage?: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onDelete,
  title,
  message,
  isDeleteDisabled = false,
  disabledMessage,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  if (!isOpen) return null;

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={dialogStyles.buttonGroup}>
          <button className={dialogStyles.closeButton} onClick={onClose}>
            CLOSE
          </button>
          <button
            className={dialogStyles.deleteButton}
            onClick={onDelete}
            disabled={isDeleteDisabled}
            title={isDeleteDisabled ? disabledMessage : undefined}
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
