import React, { useState, useRef, useEffect } from "react";
import styles from "./CreateWordType.module.css";
import useClickOutside from "../../hooks/useClickOutside";
import { WordType } from "../../services/wordTypeService";

interface CreateWordTypeProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWordType: (name: string, fields: string[]) => void;
  initialWordType?: WordType | null;
}

const CreateWordType: React.FC<CreateWordTypeProps> = ({
  isOpen,
  onClose,
  onCreateWordType,
  initialWordType,
}) => {
  const [wordTypeName, setWordTypeName] = useState("");
  const [fields, setFields] = useState<string[]>([""]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(modalRef, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialWordType) {
        setWordTypeName(initialWordType.name);
        setFields(
          initialWordType.fields ? initialWordType.fields.split(";") : [""]
        );
      } else {
        setWordTypeName("");
        setFields([""]);
      }
      inputRef.current?.focus();
    }
  }, [isOpen, initialWordType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordTypeName.trim()) {
      const nonEmptyFields = fields.filter((field) => field.trim() !== "");
      onCreateWordType(wordTypeName.trim(), nonEmptyFields);
      onClose();
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    setFields((prev) => {
      const newFields = [...prev];
      newFields[index] = value;
      return newFields;
    });
  };

  const addField = () => {
    setFields((prev) => [...prev, ""]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <h2 className={styles.title}>
          {initialWordType ? "Edit word type" : "Create new word type"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="wordTypeName">Name</label>
            <input
              ref={inputRef}
              type="text"
              id="wordTypeName"
              value={wordTypeName}
              onChange={(e) => setWordTypeName(e.target.value)}
              placeholder="Word type name"
              maxLength={50}
              required
            />
          </div>
          <div className={styles.fieldsGroup}>
            <label>Fields</label>
            <div className={styles.fieldsContainer}>
              {fields.map((field, index) => (
                <div key={index} className={styles.fieldRow}>
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    placeholder={`Field ${index + 1}`}
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeFieldButton}
                      onClick={() => removeField(index)}
                      title="Remove field"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.addFieldButton}
              onClick={addField}
              title="Add new field"
            >
              <i className="bi bi-plus"></i>
              Add field
            </button>
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
              disabled={!wordTypeName.trim()}
            >
              {initialWordType ? "SAVE" : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWordType;
