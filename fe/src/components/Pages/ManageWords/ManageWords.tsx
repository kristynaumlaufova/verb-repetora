import React, { useState, useEffect } from "react";
import styles from "./ManageWords.module.css";
import pageStyles from "../Pages.module.css";
import CreateWord from "../../Dialogs/CreateWord/CreateWord";
import WordItem from "./WordItem";
import DeleteConfirmation from "../../Dialogs/DeleteConfirmation/DeleteConfirmation";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";
import { useWordManager } from "../../../hooks/useWordManager";
import { useWordTypeManager } from "../../../hooks/useWordTypeManager";
import { useLanguage } from "../../../contexts/LanguageContext";

const ManageWords: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deletingWord, setDeletingWord] = useState<Word | null>(null);

  const {
    words,
    isLoading,
    error,
    totalCount,
    loadMore,
    deleteWord,
    refreshWords,
    createWord,
    updateWord,
    setError,
  } = useWordManager(currentLanguage?.id);

  const { wordTypes, isLoading: areWordTypesLoading } = useWordTypeManager(
    currentLanguage?.id
  );

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingWord(null);
    setError("");
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingWord) {
      setDeletingWord(null);
      return;
    }

    const success = await deleteWord(deletingWord.id);
    if (success) {
      setDeletingWord(null);
    }
  };

  const handleCreateOrUpdate = async (
    wordTypeId: number,
    keyword: string,
    fields: string
  ) => {
    const success = editingWord
      ? await updateWord(editingWord.id, wordTypeId, keyword, fields)
      : await createWord(wordTypeId, keyword, fields);

    if (success) {
      handleModalClose();
    }
  };

  useEffect(() => {
    if (!areWordTypesLoading) {
      refreshWords();
    }
  }, [refreshWords, areWordTypesLoading]);

  const getWordType = (wordTypeId: number): WordType | undefined => {
    return wordTypes.find((type) => type.id === wordTypeId);
  };

  return (
    <div className={pageStyles.container}>
      {error && <div className={pageStyles.errorNotification}>{error}</div>}
      <h1 className={pageStyles.title}>Manage words</h1>
      <div className={pageStyles.list}>
        <div className={pageStyles.wrapper}>
          {" "}
          {isLoading ? (
            <div className={pageStyles.loading}>Loading...</div>
          ) : !words || words.length === 0 ? (
            <div className={pageStyles.noContent}>No words found</div>
          ) : (
            words.map((word) => {
              const wordType = getWordType(word.wordTypeId);
              if (!wordType) return null;

              return (
                <WordItem
                  key={word.id}
                  word={word}
                  wordType={wordType}
                  onEdit={handleEdit}
                  onDelete={setDeletingWord}
                />
              );
            })
          )}{" "}
          {words && words.length < totalCount && (
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
          title="Add new word"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
      <CreateWord
        isOpen={isCreateModalOpen}
        wordTypes={wordTypes}
        onClose={handleModalClose}
        onCreateWord={handleCreateOrUpdate}
        initialWord={
          editingWord
            ? {
                wordTypeId: editingWord.wordTypeId,
                keyword: editingWord.keyword,
                fields: editingWord.fields,
              }
            : undefined
        }
      />
      <DeleteConfirmation
        isOpen={!!deletingWord}
        onClose={() => {
          setDeletingWord(null);
          setError("");
        }}
        onDelete={handleDelete}
        title="Do you really want to delete this word?"
        message="This action can't be taken back."
      />
    </div>
  );
};

export default ManageWords;
