import React, { useState } from "react";
import styles from "./ManageLanguages.module.css";
import CreateLanguage from "../CreateLanguage/CreateLanguage";
import DeleteConfirmation from "../DeleteConfirmation/DeleteConfirmation";
import { languageService, Language } from "../../services/languageService";
import { useLanguage } from "../../contexts/LanguageContext";

const ManageLanguages: React.FC = () => {
  const {
    languages,
    totalCount,
    isLoading,
    currentLanguage,
    setCurrentLanguage,
    loadMore,
    refreshLanguages,
  } = useLanguage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(
    null
  );
  const [createError, setCreateError] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string>("");

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setIsCreateModalOpen(true);
    setCreateError("");
  };

  const handleDelete = async () => {
    if (!deletingLanguage || languages.length <= 1) {
      setDeletingLanguage(null);
      return;
    }

    try {
      await languageService.deleteLanguage(deletingLanguage.id);
      // After selected lang is deleted, select new one
      if (currentLanguage?.id === deletingLanguage.id) {
        const remainingLanguages = languages.filter(
          (l) => l.id !== deletingLanguage.id
        );
        setCurrentLanguage(remainingLanguages[0]);
      }
      await refreshLanguages();
      setDeletingLanguage(null);
      setDeleteError("");
    } catch (error: any) {
      setDeleteError(
        error.response?.data || "Failed to delete language. Please try again."
      );
    }
  };

  const handleCreateOrUpdate = async (name: string) => {
    try {
      if (editingLanguage) {
        await languageService.updateLanguage(editingLanguage.id, name);
      } else {
        await languageService.createLanguage(name);
      }
      await refreshLanguages();
      setIsCreateModalOpen(false);
      setEditingLanguage(null);
      setCreateError("");
    } catch (error: any) {
      setCreateError(
        error.response?.data || "Failed to save language. Please try again."
      );
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingLanguage(null);
    setCreateError("");
  };

  const truncateName = (name: string): string => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };
  return (
    <div className={styles.container}>
      {(createError || deleteError) && (
        <div className={styles.errorNotification}>
          {createError || deleteError}
        </div>
      )}
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
                    checked={currentLanguage?.id === language.id}
                    onChange={() => setCurrentLanguage(language)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioControl}></span>
                  <span className={styles.languageName} title={language.name}>
                    {truncateName(language.name)}
                  </span>
                </label>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(language)}
                    title="Edit language"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => setDeletingLanguage(language)}
                    title="Delete language"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            ))
          )}
          {languages.length < totalCount && (
            <button
              className={styles.loadMoreButton}
              onClick={loadMore}
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
      <DeleteConfirmation
        isOpen={!!deletingLanguage}
        onClose={() => {
          setDeletingLanguage(null);
          setDeleteError("");
        }}
        onDelete={handleDelete}
        title="Do you really want to delete this language?"
        message="If you delete this language, all words and lessons will be lost. This action can't be taken back."
        isDeleteDisabled={languages.length <= 1}
        disabledMessage="Cannot delete your last language. At least one language must remain."
      />
    </div>
  );
};

export default ManageLanguages;
