import React from "react";
import styles from "./ManageWordTypes.module.css";
import pageStyles from "../Pages.module.css";
import { WordType } from "../../../services/wordTypeService";

interface WordTypeItemProps {
  wordType: WordType;
  onEdit: (wordType: WordType) => void;
  onDelete: (wordType: WordType) => void;
}

const WordTypeItem: React.FC<WordTypeItemProps> = ({
  wordType,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={pageStyles.item}>
      <div className={styles.nameSection}>
        <span className={styles.wordTypeName} title={wordType.name}>
          {wordType.name}
        </span>
      </div>
      <div className={styles.fieldsSection}>
        <span className={styles.fields}>
          {wordType.fields?.split(";").join(", ") || ""}
        </span>
      </div>
      <div className={pageStyles.actionButtons}>
        <button
          className={pageStyles.editButton}
          onClick={() => onEdit(wordType)}
          title="Edit word type"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className={pageStyles.deleteButton}
          onClick={() => onDelete(wordType)}
          title="Delete word type"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default WordTypeItem;
