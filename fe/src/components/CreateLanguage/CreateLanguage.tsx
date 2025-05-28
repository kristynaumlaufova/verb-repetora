import React, { useState, useRef, useEffect } from "react";
import styles from "./CreateLanguage.module.css";
import useClickOutside from "../../hooks/useClickOutside";

interface CreateLanguageProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLanguage: (name: string) => void;
  initialValue?: string;
}

const CreateLanguage: React.FC<CreateLanguageProps> = ({
  isOpen,
  onClose,  onCreateLanguage,
  initialValue,
}) => {
  const [languageName, setLanguageName] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(modalRef, onClose);

  useEffect(() => {
    if (isOpen) {
      setLanguageName(initialValue || "");
      inputRef.current?.focus();
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (languageName.trim()) {
      onCreateLanguage(languageName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>        <h2 className={styles.title}>
          {initialValue ? "Edit language" : "Create new language"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              ref={inputRef}
              type="text"
              id="languageName"
              value={languageName}
              onChange={(e) => setLanguageName(e.target.value)}
              placeholder="Language name"
              maxLength={20}
              required
            />
          </div>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
            >
              CLOSE
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={!languageName.trim()}
            >
              {initialValue ? "SAVE" : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLanguage;
