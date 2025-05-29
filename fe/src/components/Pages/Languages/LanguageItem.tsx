import React from "react";
import styles from "./ManageLanguages.module.css";
import pageStyles from "../Pages.module.css";
import { Language } from "../../../services/languageService";

interface LanguageItemProps {
  language: Language;
  currentLanguageId: number | undefined;
  onSelect: (language: Language) => void;
  onEdit: (language: Language) => void;
  onDelete: (language: Language) => void;
}

const LanguageItem: React.FC<LanguageItemProps> = ({
  language,
  currentLanguageId,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const truncateName = (name: string): string => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  return (
    <div className={pageStyles.item}>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="language"
          checked={currentLanguageId === language.id}
          onChange={() => onSelect(language)}
          className={styles.radioInput}
        />
        <span className={styles.radioControl}></span>
        <span className={styles.languageName} title={language.name}>
          {truncateName(language.name)}
        </span>
      </label>
      <div className={pageStyles.actionButtons}>
        <button
          className={pageStyles.editButton}
          onClick={() => onEdit(language)}
          title="Edit language"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className={pageStyles.deleteButton}
          onClick={() => onDelete(language)}
          title="Delete language"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default LanguageItem;
