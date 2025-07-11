import React, { useState, useRef, useEffect } from "react";
import styles from "./CreateWordType.module.css";
import dialogStyles from "../Dialog.module.css";
import useClickOutside from "../../../hooks/useClickOutside";
import { WordType } from "../../../services/wordTypeService";

interface CreateWordTypeProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWordType: (name: string, fields: string) => void;
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
      const fieldsString = fields.filter((field) => field.trim()).join(";");
      onCreateWordType(wordTypeName.trim(), fieldsString);
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
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>
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
            <div className={dialogStyles.fieldsContainer}>
              {fields.map((field, index) => (
                <div key={index} className={styles.fieldRow}>
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    placeholder={`Field ${index + 1}`}
                  />
                  {fields.length > 1 && !initialWordType && (
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
            {!initialWordType && (
              <button
                type="button"
                className={styles.addFieldButton}
                onClick={addField}
                title="Add new field"
              >
                <i className="bi bi-plus"></i>
                Add field
              </button>
            )}
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
