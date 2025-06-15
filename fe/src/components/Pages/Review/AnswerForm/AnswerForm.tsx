import React from "react";
import styles from "./AnswerForm.module.css";
import { Word } from "../../../../services/wordService";
import { WordType } from "../../../../services/wordTypeService";

interface AnswerFormProps {
  currentWord: Word;
  currentWordType: WordType;
  fieldAnswers: { [fieldName: string]: string };
  onFieldChange: (fieldName: string, value: string) => void;
  onCheck: () => void;
  onGiveUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  areAllFieldsAnswered: boolean;
  getFieldNames: () => string[];
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  currentWord,
  currentWordType,
  fieldAnswers,
  onFieldChange,
  onCheck,
  onGiveUp,
  onKeyDown,
  areAllFieldsAnswered,
  getFieldNames,
}) => {
  return (
    <div className={styles.answerFormContainer}>
      <div className={styles.wordCard}>
        <div className={styles.wordType}>{currentWordType.name}</div>
        <div className={styles.wordKeyword}>{currentWord.keyword}</div>
      </div>

      <div className={styles.form}>
        {getFieldNames().map((fieldName, index) => (
          <div key={fieldName} className={styles.inputGroup}>
            <input
              id={`field-${fieldName}`}
              type="text"
              value={fieldAnswers[fieldName] || ""}
              onChange={(e) => onFieldChange(fieldName, e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={fieldName}
              autoFocus={index === 0}
            />
          </div>
        ))}
        <div className={styles.buttonGroup}>
          <button className={styles.giveUpButton} onClick={onGiveUp}>
            Give Up
          </button>
          <button
            className={styles.checkButton}
            onClick={onCheck}
            disabled={!areAllFieldsAnswered}
          >
            Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnswerForm;
