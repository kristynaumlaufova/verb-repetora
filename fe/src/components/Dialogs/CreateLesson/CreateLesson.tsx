import React, { useState, useRef, useEffect } from "react";
import dialogStyles from "../Dialog.module.css";
import styles from "./CreateLesson.module.css";
import useClickOutside from "../../../hooks/useClickOutside";
import { Lesson } from "../../../services/lessonService";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";
import { useWordManager } from "../../../hooks/useWordManager";
import { useWordTypeManager } from "../../../hooks/useWordTypeManager";
import { useLanguage } from "../../../contexts/LanguageContext";

interface CreateLessonProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLesson: (name: string, selectedWordIds?: number[]) => Promise<void>;
  initialValue: Lesson | null;
}

const CreateLesson: React.FC<CreateLessonProps> = ({
  isOpen,
  onClose,
  initialValue,
  onCreateLesson,
}) => {
  const { currentLanguage } = useLanguage();
  const [lessonName, setLessonName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const { words, refreshWords, getWordsByIds } = useWordManager(
    currentLanguage?.id
  );
  const { wordTypes } = useWordTypeManager(currentLanguage?.id);

  useClickOutside(modalRef, onClose);

  const resetDialogState = () => {
    setLessonName("");
    setSearchTerm("");
    setSearchResults([]);
    setSelectedWords([]);
  };

  // Dialog initialization
  useEffect(() => {
    if (isOpen) {
      setLessonName(initialValue?.name || "");
      refreshWords();
    } else {
      resetDialogState();
    }
  }, [isOpen, initialValue, refreshWords]);
  // Load words of current lesson
  useEffect(() => {
    const fetchSelectedWords = async () => {
      if (
        isOpen &&
        initialValue &&
        initialValue.wordIds &&
        initialValue.wordIds.length > 0
      ) {
        try {
          const fetchedWords = await getWordsByIds(initialValue.wordIds);
          if (fetchedWords && fetchedWords.length > 0) {
            setSelectedWords(fetchedWords);
          }
        } catch (error) {
          console.error("Error fetching words by IDs:", error);
        }
      }
    };

    fetchSelectedWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValue]);

  // Search logic
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      // Filter words based on current language and search term
      const filteredWords = words.filter(
        (word) =>
          word.languageId === currentLanguage?.id &&
          word.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchResults(filteredWords);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, words, currentLanguage?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonName.trim()) return;

    const selectedWordIds = selectedWords.map((word) => word.id);
    await onCreateLesson(lessonName.trim(), selectedWordIds);
  };
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    refreshWords(e.target.value);
  };

  const handleWordSelect = (word: Word) => {
    if (selectedWords.some((w) => w.id === word.id)) {
      setSelectedWords(selectedWords.filter((w) => w.id !== word.id));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const getWordType = (wordTypeId: number): WordType | undefined => {
    return wordTypes.find((type) => type.id === wordTypeId);
  };

  if (!isOpen) return null;

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>
          {initialValue ? "Edit Lesson" : "Create New Lesson"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.formGroup}>
              <label htmlFor="lessonName">Name</label>
              <input
                id="lessonName"
                type="text"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                className={dialogStyles.input}
                placeholder="Enter lesson name"
                required
              />
            </div>
          </div>

          <div className={styles.wordsSection}>
            <label>Add Words</label>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className={styles.searchInput}
                placeholder="Search for words..."
              />{" "}
              {!currentLanguage?.id && (
                <div className={styles.noResults}>
                  Please select a language first.
                </div>
              )}
              {searchTerm.trim() !== "" && (
                <div className={styles.searchResults}>
                  {isSearching ? (
                    <div className={styles.loadingIndicator}>Loading...</div>
                  ) : searchResults.length === 0 ? (
                    <div className={styles.noResults}>No words found</div>
                  ) : (
                    searchResults.map((word) => {
                      const wordType = getWordType(word.wordTypeId);
                      return (
                        <div
                          key={word.id}
                          className={styles.wordItem}
                          onClick={() => handleWordSelect(word)}
                        >
                          <span className={styles.wordKeyword}>
                            {word.keyword}
                          </span>
                          {wordType && (
                            <span className={styles.wordType}>
                              {wordType.name}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}{" "}
            </div>
            <div className={styles.selectedWordsContainer}>
              <div className={styles.selectedWordsHeader}>
                Selected Words ({selectedWords.length})
              </div>
              <div className={styles.selectedWordsList}>
                {selectedWords.map((word) => {
                  const wordType = getWordType(word.wordTypeId);
                  return (
                    <div key={word.id} className={styles.selectedWordItem}>
                      <span className={styles.wordKeyword}>{word.keyword}</span>
                      {wordType && (
                        <span className={styles.wordType}>{wordType.name}</span>
                      )}
                      <button
                        type="button"
                        className={styles.removeWordButton}
                        onClick={() => handleWordSelect(word)}
                        title="Remove word"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  );
                })}
                {selectedWords.length === 0 && (
                  <div className={styles.noResults}>No words selected</div>
                )}
              </div>
            </div>
          </div>

          <div className={dialogStyles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={dialogStyles.closeButton}
            >
              Cancel
            </button>
            <button type="submit" className={dialogStyles.createButton}>
              {initialValue ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;
