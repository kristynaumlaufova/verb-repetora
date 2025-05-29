import React, { useState, useRef, useEffect } from "react";
import dialogStyles from "../Dialog.module.css";
import styles from "./CreateLesson.module.css";
import useClickOutside from "../../../hooks/useClickOutside";
import { Lesson } from "../../../services/lessonService";

interface CreateLessonProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLesson: (name: string) => Promise<void>;
  initialValue: Lesson | null;
}

const CreateLesson: React.FC<CreateLessonProps> = ({
  isOpen,
  onClose,
  initialValue,
  onCreateLesson,
}) => {
  const [lessonName, setLessonName] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(modalRef, onClose);

  useEffect(() => {
    if (isOpen) {
      setLessonName(initialValue?.name || "");
      inputRef.current?.focus();
    }
  }, [isOpen, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonName.trim()) return;

    await onCreateLesson(lessonName.trim());
  };

  if (!isOpen) return null;

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>
          {initialValue ? "Edit Lesson" : "Create New Lesson"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.formGroup}>
              <label htmlFor="lessonName">Name</label>
              <input
                id="lessonName"
                ref={inputRef}
                type="text"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                className={dialogStyles.input}
                placeholder="Enter lesson name"
                required
              />
            </div>
          </div>
          <div className={dialogStyles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={dialogStyles.closeButton}
            >
              Cancel
            </button>
            <button type="submit" className={dialogStyles.createButton}>
              {initialValue ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;
