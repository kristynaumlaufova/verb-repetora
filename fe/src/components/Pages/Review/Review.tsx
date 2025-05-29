import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Review.module.css";
import pageStyles from "../Pages.module.css";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";
import { reviewService } from "../../../services/reviewService";
import { wordTypeService } from "../../../services/wordTypeService";
import ReviewSummary from "../../Dialogs/ReviewSummary/ReviewSummary";

interface ReviewLocationState {
  lessonIds: number[];
  type: "all" | "recommended";
}

const Review: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReviewLocationState;

  const [words, setWords] = useState<Word[]>([]);
  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldAnswers, setFieldAnswers] = useState<{
    [fieldName: string]: string;
  }>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Load words for review
  useEffect(() => {
    const loadReviewData = async () => {
      if (!state?.lessonIds || state.lessonIds.length === 0) {
        navigate("/lessons");
        return;
      }

      try {
        setIsLoading(true);
        const fetchedWords = await reviewService.getWordsForLessons(
          state.lessonIds
        );
        const shuffledWords = reviewService.shuffleWords(fetchedWords);
        setWords(shuffledWords);

        // Collect all wordTypeIds
        const wordTypeIds = Array.from(
          new Set(fetchedWords.map((word) => word.wordTypeId))
        );

        // Fetch word types
        const typesMap = new Map<number, WordType>();
        for (const typeId of wordTypeIds) {
          try {
            const wordType = await wordTypeService.getWordType(typeId);
            typesMap.set(typeId, wordType);
          } catch (error) {
            console.error(`Failed to fetch word type ${typeId}:`, error);
          }
        }

        setWordTypes(Array.from(typesMap.values()));
      } catch (error) {
        console.error("Error loading review data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewData();
  }, [state, navigate]);

  const getCurrentWord = (): Word | undefined => {
    return currentIndex < words.length ? words[currentIndex] : undefined;
  };

  const getCurrentWordType = (): WordType | undefined => {
    const word = getCurrentWord();
    if (!word) return undefined;

    return wordTypes.find((type) => type.id === word.wordTypeId);
  };

  // Get field names from the current word type
  const getFieldNames = (): string[] => {
    const wordType = getCurrentWordType();
    if (!wordType || !wordType.fields) return [];

    return wordType.fields.split(";").filter((field) => field.trim() !== "");
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldAnswers((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const resetFieldAnswers = () => {
    setFieldAnswers({});
  };

  const areAllFieldsAnswered = (): boolean => {
    const fieldNames = getFieldNames();
    return fieldNames.every(
      (field) =>
        fieldAnswers[field] !== undefined && fieldAnswers[field].trim() !== ""
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!isChecking && areAllFieldsAnswered()) {
        handleCheck();
      } else if (isChecking) {
        handleNext();
      } else if (isSummaryOpen) {
        handleFinish();
      }
    }
  };

  const handleCheck = () => {
    const currentWord = getCurrentWord();
    if (!currentWord || !areAllFieldsAnswered()) return;

    setIsChecking(true);

    // Parse the actual fields from the word
    const wordFieldsData = currentWord.fields
      .split(";")
      .map((field) => field.trim());
    const fieldNames = getFieldNames();

    // Check if all field answers match the expected values
    const allCorrect = fieldNames.every((fieldName, index) => {
      const userValue = fieldAnswers[fieldName]?.toLowerCase().trim() || "";
      const expectedValue = wordFieldsData[index]?.toLowerCase().trim() || "";
      return userValue === expectedValue;
    });

    if (allCorrect) {
      setCorrectCount((prevCount) => prevCount + 1);
      setIsCorrect(true);
    } else {
      setIncorrectCount((prevCount) => prevCount + 1);
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    resetFieldAnswers();
    setIsChecking(false);
    setIsCorrect(null);

    if (currentIndex + 1 >= words.length) {
      setIsSummaryOpen(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGiveUp = () => {
    setIsChecking(true);
    setIsCorrect(false);
    setIncorrectCount((prevCount) => prevCount + 1);
  };

  const handleFinish = () => {
    navigate("/lessons");
  };

  // Render the loading state
  if (isLoading) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading review session...</div>
        </div>
      </div>
    );
  }
  // The summary is now rendered as a modal dialog

  // Render the review session
  const currentWord = getCurrentWord();
  const currentWordType = getCurrentWordType();

  if (!currentWord || !currentWordType) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>
            No words available for review.
          </div>
          <button
            className={styles.finishButton}
            onClick={handleFinish}
            style={{ marginTop: "2rem" }}
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / words.length) * 100;
  return (
    <div className={pageStyles.container}>
      <div className={styles.reviewContainer}>
        {" "}
        <div className={styles.reviewHeader}>
          <div className={styles.progressInfo}>
            <span>
              {currentIndex + 1} of {words.length}
            </span>
          </div>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className={styles.wordCard}>
          <div className={styles.wordType}>{currentWordType.name}</div>
          <div className={styles.wordKeyword}>{currentWord.keyword}</div>{" "}
          {isChecking && (
            <div className={styles.wordDetails}>
              {getFieldNames().map((fieldName, index) => {
                const expectedValue = currentWord.fields.split(";")[index];
                const userValue = fieldAnswers[fieldName] || "";
                const isIncorrect =
                  userValue.toLowerCase().trim() !==
                  expectedValue.toLowerCase().trim();

                return (
                  <div key={fieldName} className={styles.fieldDetail}>
                    {fieldName}: {expectedValue}
                    {isIncorrect && (
                      <div className={styles.yourAnswer}>
                        Your answer: {userValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {isChecking && isCorrect !== null && (
            <div
              className={
                isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
              }
            >
              {isCorrect ? "Correct!" : "Incorrect!"}
            </div>
          )}
        </div>
        {!isChecking && (
          <div className={styles.form}>
            {getFieldNames().map((fieldName, index) => (
              <div key={fieldName} className={styles.inputGroup}>
                <input
                  id={`field-${fieldName}`}
                  type="text"
                  value={fieldAnswers[fieldName] || ""}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={fieldName}
                  autoFocus={index === 0}
                />
              </div>
            ))}{" "}
            <div className={styles.buttonGroup}>
              <button className={styles.giveUpButton} onClick={handleGiveUp}>
                Give Up
              </button>

              <button
                className={styles.checkButton}
                onClick={handleCheck}
                disabled={!areAllFieldsAnswered()}
              >
                Check
              </button>
            </div>
          </div>
        )}
        {isChecking && (
          <div className={styles.buttonGroup}>
            <button
              className={styles.nextButton}
              onClick={handleNext}
              onKeyDown={handleKeyDown}
            >
              {currentIndex + 1 >= words.length ? "Finish" : "Next Word"}
            </button>
          </div>
        )}
      </div>

      <ReviewSummary
        isOpen={isSummaryOpen}
        onClose={handleFinish}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        totalWords={words.length}
      />
    </div>
  );
};

export default Review;
