import React, { useState, useEffect } from "react";
import styles from "./ManageLanguages.module.css";
import CreateLanguage from "../CreateLanguage/CreateLanguage";
import { languageService, Language } from "../../services/languageService";

const ManageLanguages: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const data = await languageService.getLanguages();
      setLanguages(data);
      if (data.length > 0 && selectedLanguage === null) {
        setSelectedLanguage(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
      // TODO: Add error handling
    }
  };

  const handleEdit = async (language: Language) => {
    setEditingLanguage(language);
    setIsCreateModalOpen(true);
  };

  const handleCreateOrUpdate = async (name: string) => {
    try {
      if (editingLanguage) {
        const updated = await languageService.updateLanguage(
          editingLanguage.id,
          name
        );
        setLanguages(
          languages.map((lang) => (lang.id === updated.id ? updated : lang))
        );
      } else {
        const created = await languageService.createLanguage(name);
        setLanguages([...languages, created]);
      }
      setIsCreateModalOpen(false);
      setEditingLanguage(null);
    } catch (error) {
      console.error("Failed to save language:", error);
      // TODO: Add error handling
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingLanguage(null);
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
                onClick={() => handleEdit(language)}
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
        onClose={handleModalClose}
        onCreateLanguage={handleCreateOrUpdate}
        initialValue={editingLanguage?.name}
      />
    </div>
  );
};

export default ManageLanguages;
