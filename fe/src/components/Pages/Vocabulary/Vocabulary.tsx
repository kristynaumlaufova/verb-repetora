import React, { useState, useEffect, useRef } from "react";
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

const Vocabulary: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deletingWord, setDeletingWord] = useState<Word | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
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
    searchTerm,
    setSearchTerm,
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
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Only set searching state if there's actual content to search
    if (value.trim().length > 0) {
      setIsSearching(true);
    }

    searchTimeout.current = setTimeout(() => {
      refreshWords(value);
      setIsSearching(false);
    }, 600);
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (searchTerm.trim().length > 0) {
        setIsSearching(true);
      }
      refreshWords(searchTerm);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!areWordTypesLoading) {
      refreshWords();
    }
  }, [refreshWords, areWordTypesLoading]);

  // Cleanup the search timeout when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const getWordType = (wordTypeId: number): WordType | undefined => {
    return wordTypes.find((type) => type.id === wordTypeId);
  };
  return (
    <div className={pageStyles.container}>
      {error && <div className={pageStyles.errorNotification}>{error}</div>}
      <h1 className={pageStyles.title}>Vocabulary</h1>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search words..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleSearchKeyDown}
        />{" "}
        {searchTerm && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setSearchTerm("");
              setIsSearching(true);
              refreshWords("");
              setIsSearching(false);
            }}
            title="Clear search"
          >
            <i className="bi bi-x"></i>
          </button>
        )}{" "}
        <button
          className={styles.searchButton}
          onClick={() => {
            if (searchTerm.trim().length > 0) {
              setIsSearching(true);
            }
            refreshWords(searchTerm);
            setIsSearching(false);
          }}
          title="Search"
        >
          <i className="bi bi-search"></i>
        </button>
      </div>{" "}
      <div className={pageStyles.list}>
        <div className={pageStyles.wrapper}>
          {isLoading || isSearching ? (
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

export default Vocabulary;
