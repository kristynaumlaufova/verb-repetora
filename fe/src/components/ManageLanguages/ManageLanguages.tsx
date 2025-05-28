import React, { useState, useEffect, useCallback } from "react";
import styles from "./ManageLanguages.module.css";
import CreateLanguage from "../CreateLanguage/CreateLanguage";
import { languageService, Language } from "../../services/languageService";

const ManageLanguages: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const loadLanguages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await languageService.getLanguages({
        pageNumber,
        pageSize,
      });
      setLanguages(data.items);
      setTotalCount(data.totalCount);
      if (data.items.length > 0 && selectedLanguage === null) {
        setSelectedLanguage(data.items[0].id);
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, selectedLanguage]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages, pageNumber, pageSize]);

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
        await languageService.createLanguage(name);
        await loadLanguages();
      }
      setIsCreateModalOpen(false);
      setEditingLanguage(null);
    } catch (error) {
      console.error("Failed to save language:", error);
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
          {isLoading && languages.length === 0 ? (
            <div className={styles.loading}>Loading...</div>
          ) : languages.length === 0 ? (
            <div className={styles.noLanguages}>No languages found</div>
          ) : (
            languages.map((language) => (
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
            ))
          )}
          {languages.length < totalCount && (
            <button
              className={styles.loadMoreButton}
              onClick={() => setPageNumber((prev) => prev + 1)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more"}
            </button>
          )}
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
