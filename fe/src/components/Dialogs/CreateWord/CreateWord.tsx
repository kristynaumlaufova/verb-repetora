import React, { useState, useRef, useEffect } from "react";
import styles from "./CreateWord.module.css";
import dialogStyles from "../Dialog.module.css";
import { WordType } from "../../../services/wordTypeService";
import useClickOutside from "../../../hooks/useClickOutside";

interface CreateWordProps {
  isOpen: boolean;
  wordTypes: WordType[];
  onClose: () => void;
  onCreateWord: (wordTypeId: number, keyword: string, fields: string) => void;
  initialWord?: {
    wordTypeId: number;
    keyword: string;
    fields: string;
  };
}

const CreateWord: React.FC<CreateWordProps> = ({
  isOpen,
  wordTypes,
  onClose,
  onCreateWord,
  initialWord,
}) => {
  const [wordTypeId, setWordTypeId] = useState<number>(wordTypes[0]?.id || 0);
  const [keyword, setKeyword] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  useClickOutside(modalRef, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialWord) {
        setWordTypeId(initialWord.wordTypeId);
        setKeyword(initialWord.keyword);
        setFields(initialWord.fields ? initialWord.fields.split(";") : []);
      } else {
        setWordTypeId(wordTypes[0]?.id || 0);
        setKeyword("");
        setFields([]);
      }
      keywordInputRef.current?.focus();
    }
  }, [isOpen, initialWord, wordTypes]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = wordTypes.find(
      (t: WordType) => t.id === parseInt(e.target.value)
    );
    setWordTypeId(parseInt(e.target.value));
    setFields(
      selectedType?.fields
        ? Array(selectedType.fields.split(";").length).fill("")
        : []
    );
  };

  const handleFieldChange = (index: number, value: string) => {
    setFields((prev) => {
      const newFields = [...prev];
      newFields[index] = value;
      return newFields;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordTypeId && keyword.trim()) {
      onCreateWord(wordTypeId, keyword.trim(), fields.join(";"));
    }
  };

  if (!isOpen) return null;

  const selectedWordType = wordTypes.find((t: WordType) => t.id === wordTypeId);
  const fieldPlaceholders: string[] =
    selectedWordType?.fields?.split(";") || [];

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>
          {initialWord ? "Edit word" : "Create new word"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="keyword">Keyword</label>
            <input
              ref={keywordInputRef}
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword"
              maxLength={100}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="wordType">Word Type</label>
            <select
              id="wordType"
              value={wordTypeId}
              onChange={handleTypeChange}
              required
            >
              {wordTypes.map((type: WordType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {fieldPlaceholders.length > 0 && (
            <div className={dialogStyles.fieldsContainer}>
              <label>Fields</label>
              {fieldPlaceholders.map((placeholder: string, index: number) => (
                <div key={index} className={styles.fieldRow}>
                  <label htmlFor={`field-${index}`}>{placeholder}:</label>
                  <input
                    id={`field-${index}`}
                    type="text"
                    value={fields[index] || ""}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    maxLength={200}
                  />
                </div>
              ))}
            </div>
          )}
          <div className={dialogStyles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={dialogStyles.closeButton}
            >
              Close
            </button>
            <button
              type="submit"
              className={dialogStyles.createButton}
              disabled={!wordTypeId || !keyword.trim()}
            >
              {initialWord ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWord;
