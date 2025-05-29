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
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const { words, refreshWords } = useWordManager(currentLanguage?.id);
  const { wordTypes } = useWordTypeManager(currentLanguage?.id);

  useClickOutside(modalRef, onClose);
  // Refresh words when the modal opens
  useEffect(() => {
    if (isOpen && currentLanguage?.id) {
      refreshWords();
    }
  }, [isOpen, currentLanguage?.id, refreshWords]);  // Handle form initialization when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Set the lesson name
      setLessonName(initialValue?.name || "");
      inputRef.current?.focus();
      
      // Clear selection if not editing
      if (!initialValue) {
        setSelectedWords([]);
      }
    }
  }, [isOpen, initialValue]);
  // Handle selected words initialization/update when words load or initialValue changes
  useEffect(() => {
    if (isOpen && initialValue?.wordIds && words.length > 0) {
      // Find word objects for the selected wordIds
      const selectedWordObjects = words.filter(word => 
        initialValue.wordIds.includes(word.id)
      );

      console.log('Loading words for editing:', {
        wordIds: initialValue.wordIds,
        words: selectedWordObjects.map(w => ({
          id: w.id,
          keyword: w.keyword
        })),
        found: selectedWordObjects.length,
        total: words.length
      });

      setSelectedWords(selectedWordObjects);
    }
  }, [isOpen, initialValue?.wordIds, words]);

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

      console.log("Search results:", {
        searchTerm,
        totalWords: words.length,
        filteredCount: filteredWords.length,
        currentLanguageId: currentLanguage?.id,
      });

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
                ref={inputRef}
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
            {" "}
            <label>Add Words</label>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                placeholder="Search for words..."
              />
              {words.length === 0 && (
                <div className={styles.noResults}>
                  No words available for the current language. Please add words
                  first.
                </div>
              )}

              {searchTerm.trim() !== "" && words.length > 0 && (
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
              )}            </div>
            <div className={styles.selectedWordsContainer}>
              <div className={styles.selectedWordsHeader}>
                Selected Words ({selectedWords.length})
              </div>
              <div className={styles.selectedWordsList}>
                {selectedWords.map((word) => {
                  console.log('Rendering word:', word);
                  const wordType = getWordType(word.wordTypeId);
                  return (
                    <div key={word.id} className={styles.selectedWordItem}>
                      <span className={styles.wordKeyword}>
                        {word.keyword}
                      </span>
                      {wordType && (
                        <span className={styles.wordType}>
                          {wordType.name}
                        </span>
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
