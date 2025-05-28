import React, { useState } from "react";
import pageStyles from "../Pages.module.css";
import CreateLanguage from "../../Dialogs/CreateLanguage/CreateLanguage";
import DeleteConfirmation from "../../Dialogs/DeleteConfirmation/DeleteConfirmation";
import { languageService, Language } from "../../../services/languageService";
import { useLanguage } from "../../../contexts/LanguageContext";
import LanguageItem from "./LanguageItem";

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

  return (
    <div className={pageStyles.container}>
      {(createError || deleteError) && (
        <div className={pageStyles.errorNotification}>
          {createError || deleteError}
        </div>
      )}
      <h1 className={pageStyles.title}>Manage languages</h1>
      <div className={pageStyles.list}>
        <div className={pageStyles.wrapper}>
          {isLoading && languages.length === 0 ? (
            <div className={pageStyles.loading}>Loading...</div>
          ) : languages.length === 0 ? (
            <div className={pageStyles.noContent}>No languages found</div>
          ) : (
            languages.map((language) => (
              <LanguageItem
                key={language.id}
                language={language}
                currentLanguageId={currentLanguage?.id}
                onSelect={setCurrentLanguage}
                onEdit={handleEdit}
                onDelete={setDeletingLanguage}
              />
            ))
          )}
          {languages.length < totalCount && (
            <button
              className={pageStyles.loadMoreButton}
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>

        <button
          className={pageStyles.addButton}
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
