import React, { useState, useEffect } from "react";
import styles from "./ManageWordTypes.module.css";
import DeleteConfirmation from "../DeleteConfirmation/DeleteConfirmation";
import CreateWordType from "../CreateWordType/CreateWordType";
import { WordType } from "../../services/wordTypeService";
import { useWordTypeManager } from "../../hooks/useWordTypeManager";
import { useLanguage } from "../../contexts/LanguageContext";

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

  const handleCreateOrUpdate = async (name: string, fields: string[]) => {
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
    <div className={styles.container}>
      {error && <div className={styles.errorNotification}>{error}</div>}
      <h1 className={styles.title}>Manage word types</h1>
      <div className={styles.wordTypesList}>
        <div className={styles.wordTypesWrapper}>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : wordTypes.length === 0 ? (
            <div className={styles.noWordTypes}>No word types found</div>
          ) : (
            wordTypes.map((wordType) => (
              <div key={wordType.id} className={styles.wordTypeItem}>
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
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(wordType)}
                    title="Edit word type"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => setDeletingWordType(wordType)}
                    title="Delete word type"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          className={styles.addButton}
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
