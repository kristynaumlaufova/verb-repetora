import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Review.module.css";
import pageStyles from "../Pages.module.css";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";
import { reviewService } from "../../../services/reviewService";
import { wordTypeService } from "../../../services/wordTypeService";
import ReviewSummary from "../../Dialogs/ReviewSummary/ReviewSummary";
import ProgressBar from "./ProgressBar/ProgressBar";
import AnswerForm from "./AnswerForm/AnswerForm";
import FeedbackCard from "./FeedbackCard/FeedbackCard";

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
  return (
    <div className={pageStyles.container}>
      <div className={styles.reviewContainer}>
        <ProgressBar currentIndex={currentIndex} totalWords={words.length} />

        {!isChecking ? (
          <AnswerForm
            currentWord={currentWord}
            currentWordType={currentWordType}
            fieldAnswers={fieldAnswers}
            onFieldChange={handleFieldChange}
            onCheck={handleCheck}
            onGiveUp={handleGiveUp}
            onKeyDown={handleKeyDown}
            areAllFieldsAnswered={areAllFieldsAnswered()}
            getFieldNames={getFieldNames}
          />
        ) : (
          <FeedbackCard
            currentWord={currentWord}
            currentWordType={currentWordType}
            fieldAnswers={fieldAnswers}
            isCorrect={isCorrect}
            onNext={handleNext}
            getFieldNames={getFieldNames}
            isLastWord={currentIndex + 1 >= words.length}
          />
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
