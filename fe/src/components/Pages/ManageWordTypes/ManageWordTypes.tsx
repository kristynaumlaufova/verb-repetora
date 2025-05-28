import React, { useState, useEffect } from "react";
import pageStyles from "../Pages.module.css";
import DeleteConfirmation from "../../Dialogs/DeleteConfirmation/DeleteConfirmation";
import CreateWordType from "../../Dialogs/CreateWordType/CreateWordType";
import { WordType } from "../../../services/wordTypeService";
import { useWordTypeManager } from "../../../hooks/useWordTypeManager";
import { useLanguage } from "../../../contexts/LanguageContext";
import WordTypeItem from "./WordTypeItem";

const ManageWordTypes: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingWordType, setDeletingWordType] = useState<WordType | null>(
    null
  );
  const [editingWordType, setEditingWordType] = useState<WordType | null>(null);
  const {
    wordTypes,
    isLoading,
    error,
    totalCount,
    loadMore,
    deleteWordType,
    refreshWordTypes,
    createWordType,
    updateWordType,
    setError,
  } = useWordTypeManager(currentLanguage?.id);

  const handleDelete = async () => {
    if (!deletingWordType) {
      setDeletingWordType(null);
      return;
    }

    const success = await deleteWordType(deletingWordType.id);
    if (success) {
      setDeletingWordType(null);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingWordType(null);
    setError("");
  };

  const handleEdit = (wordType: WordType) => {
    setEditingWordType(wordType);
    setIsCreateModalOpen(true);
  };

  const handleCreateOrUpdate = async (name: string, fields: string) => {
    console.log(fields);
    const success = editingWordType
      ? await updateWordType(editingWordType.id, name, fields)
      : await createWordType(name, fields);

    if (success) {
      handleModalClose();
    }
  };

  useEffect(() => {
    refreshWordTypes();
  }, [refreshWordTypes]);

  return (
    <div className={pageStyles.container}>
      {error && <div className={pageStyles.errorNotification}>{error}</div>}
      <h1 className={pageStyles.title}>Manage word types</h1>
      <div className={pageStyles.list}>
        <div className={pageStyles.wrapper}>
          {isLoading ? (
            <div className={pageStyles.loading}>Loading...</div>
          ) : wordTypes.length === 0 ? (
            <div className={pageStyles.noContent}>No word types found</div>
          ) : (
            wordTypes.map((wordType) => (
              <WordTypeItem
                key={wordType.id}
                wordType={wordType}
                onEdit={handleEdit}
                onDelete={setDeletingWordType}
              />
            ))
          )}
          {wordTypes.length < totalCount && (
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
          title="Add new word type"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
      <CreateWordType
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onCreateWordType={handleCreateOrUpdate}
        initialWordType={editingWordType}
      />
      <DeleteConfirmation
        isOpen={!!deletingWordType}
        onClose={() => {
          setDeletingWordType(null);
          setError("");
        }}
        onDelete={handleDelete}
        title="Do you really want to delete this word type?"
        message="If you delete this word type, all related words will be lost. This action can't be taken back."
      />
    </div>
  );
};

export default ManageWordTypes;
