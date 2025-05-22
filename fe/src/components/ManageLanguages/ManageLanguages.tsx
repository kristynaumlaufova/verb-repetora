import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ManageLanguages.module.css";
import CreateLanguage from "../CreateLanguage/CreateLanguage";

interface Language {
  id: string;
  name: string;
}

const ManageLanguages: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([
    { id: "ENGLISH", name: "English" },
    { id: "POLISH", name: "Polish" },
    { id: "GERMAN", name: "German" },
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ENGLISH");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleEdit = (languageId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit language:", languageId);
  };

  const handleCreateLanguage = (name: string) => {
    const newLanguage: Language = {
      id: name.toUpperCase(),
      name: name,
    };
    setLanguages([...languages, newLanguage]);
  };

  const truncateName = (name: string): string => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manage languages</h1>

      <div className={styles.languagesList}>
        <div className={styles.languagesWrapper}>
          {languages.map((language) => (
            <div key={language.id} className={styles.languageItem}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="language"
                  checked={selectedLanguage === language.id}
                  onChange={() => setSelectedLanguage(language.id)}
                  className={styles.radioInput}
                />
                <span className={styles.radioControl}></span>
                <span className={styles.languageName} title={language.name}>
                  {truncateName(language.name)}
                </span>
              </label>
              <button
                className={styles.editButton}
                onClick={() => handleEdit(language.id)}
              >
                <i className="bi bi-pencil"></i>
              </button>
            </div>
          ))}
        </div>

        <button
          className={styles.addButton}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>

      <CreateLanguage
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLanguage={handleCreateLanguage}
      />
    </div>
  );
};

export default ManageLanguages;
