import React from "react";
import styles from "./ManageWords.module.css";
import pageStyles from "../Pages.module.css";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";

interface WordItemProps {
  word: Word;
  wordType: WordType;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}

const WordItem: React.FC<WordItemProps> = ({
  word,
  wordType,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={pageStyles.item}>
      <div className={styles.wordSection}>
        <span className={styles.wordKeyword} title={word.keyword}>
          {word.keyword}
        </span>
      </div>
      <div className={styles.typeSection}>
        <span className={styles.wordType} title={wordType.name}>
          {wordType.name}
        </span>
      </div>
      <div className={styles.fieldsSection}>
        <span className={styles.fields}>
          {word.fields?.split(";").join(", ") || ""}
        </span>
      </div>
      <div className={pageStyles.actionButtons}>
        <button
          className={pageStyles.editButton}
          onClick={() => onEdit(word)}
          title="Edit word"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className={pageStyles.deleteButton}
          onClick={() => onDelete(word)}
          title="Delete word"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default WordItem;
