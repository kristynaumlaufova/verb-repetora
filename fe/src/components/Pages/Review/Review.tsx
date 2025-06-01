import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Review.module.css";
import pageStyles from "../Pages.module.css";
import { useReviewManager } from "../../../hooks/useReviewManager";
import ReviewSummary from "../../Dialogs/ReviewSummary/ReviewSummary";
import ProgressBar from "./ProgressBar/ProgressBar";
import AnswerForm from "./AnswerForm/AnswerForm";
import FeedbackCard from "./FeedbackCard/FeedbackCard";

interface ReviewLocationState {
  lessonIds: number[];
  type: "all" | "recommended";
  languageId?: number;
}

const Review: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReviewLocationState;
  const [fieldAnswers, setFieldAnswers] = useState<{
    [fieldName: string]: string;
  }>({});

  const {
    isLoading,
    error,
    loadReviewData,
    reviewSession,
    initReviewSession,
    isChecking,
    isCorrect,
    isComplete,
    getCurrentWord,
    getCurrentWordType,
    checkAnswer,
    nextQuestion,
  } = useReviewManager(state.type);

  // Initialize review session when component mounts
  useEffect(() => {
    if (!state || !state.lessonIds || state.lessonIds.length === 0) {
      navigate("/lessons", { replace: true });
      return;
    }

    const initializeReview = async () => {
      try {
        const data = await loadReviewData(state.lessonIds);

        if (data) {
          initReviewSession(data);
        }
      } catch (error) {
        console.error("Failed to initialize review session:", error);
      }
    };

    initializeReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldAnswers((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const getFieldNames = (): string[] => {
    const wordType = getCurrentWordType();
    if (!wordType || !wordType.fields) return [];

    return wordType.fields.split(";").filter((field) => field.trim() !== "");
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
      e.preventDefault();
      if (!isChecking && areAllFieldsAnswered()) {
        handleCheck();
      }
    }
  };

  const handleGiveUp = () => {
    // Fill in all answers with correct values
    const currentWord = getCurrentWord();
    const fieldNames = getFieldNames();

    if (currentWord) {
      const correctFields = currentWord.fields.split(";");
      const newFieldAnswers: { [key: string]: string } = {};

      fieldNames.forEach((field, index) => {
        newFieldAnswers[field] = correctFields[index] || "";
      });

      setFieldAnswers(newFieldAnswers);

      // Mark this as incorrect
      checkAnswer("", state.type);
    }
  };

  const handleFinish = () => {
    navigate("/lessons");
  };

  // Handle form submission to check the answer
  const handleCheck = () => {
    // Convert field answers to semicolon-separated string
    const fieldNames = getFieldNames();
    const answersArray = fieldNames.map((field) => fieldAnswers[field] || "");
    const answersString = answersArray.join(";");

    // Call the hook's check function
    checkAnswer(answersString, state.type);
  };

  // Move to next question
  const handleNext = () => {
    nextQuestion(state.type);
    resetFieldAnswers();
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

  // Display an error message if something went wrong
  if (error) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.errorText}>{error}</div>
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

  // Render the review session
  const currentWord = getCurrentWord();
  const currentWordType = getCurrentWordType();

  if (!currentWord || !currentWordType || !reviewSession) {
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
        <ReviewSummary
          isOpen={isComplete}
          onClose={handleFinish}
          correctCount={reviewSession?.correctAnswers || 0}
          incorrectCount={reviewSession?.incorrectAnswers || 0}
          totalWords={reviewSession?.reviewHeap.size() || 0}
        />
      </div>
    );
  }

  return (
    <div className={pageStyles.container}>
      <div className={styles.reviewContainer}>
        <ProgressBar
          currentIndex={reviewSession.currentIndex}
          totalWords={reviewSession.reviewHeap.size()}
        />

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
            isLastWord={
              reviewSession.currentIndex === reviewSession.reviewHeap.size() - 1
            }
          />
        )}
      </div>
    </div>
  );
};

export default Review;
