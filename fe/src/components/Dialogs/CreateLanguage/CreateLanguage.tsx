import React, { useState, useRef, useEffect } from "react";
import styles from "./CreateLanguage.module.css";
import dialogStyles from "../Dialog.module.css";
import useClickOutside from "../../../hooks/useClickOutside";

interface CreateLanguageProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLanguage: (name: string) => void;
  initialValue?: string;
}

const CreateLanguage: React.FC<CreateLanguageProps> = ({
  isOpen,
  onClose,
  onCreateLanguage,
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
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>
          {initialValue ? "Rename language" : "Create new language"}
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
          <div className={dialogStyles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={dialogStyles.closeButton}
            >
              CLOSE
            </button>
            <button
              type="submit"
              className={dialogStyles.createButton}
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
