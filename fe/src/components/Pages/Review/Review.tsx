import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Review.module.css";
import pageStyles from "../Pages.module.css";
import { Word } from "../../../services/wordService";
import { WordType } from "../../../services/wordTypeService";
import {
  useReviewManager,
  ReviewSession,
} from "../../../hooks/useReviewManager";
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
  const reviewManager = useReviewManager();

  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(
    null
  );
  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [fieldAnswers, setFieldAnswers] = useState<{
    [fieldName: string]: string;
  }>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  useEffect(() => {
    const loadReviewData = async () => {
      if (!state?.lessonIds || state.lessonIds.length === 0) {
        navigate("/lessons");
        return;
      }
      try {
        setIsLoading(true);
        const reviewData = await reviewManager.getReviewData(
          state.lessonIds,
          state.type
        );

        // Initialize review session with the words
        const session = reviewManager.initReviewSession(reviewData.words);
        setReviewSession(session);
        setWordTypes(reviewData.wordTypes);
      } catch (error) {
        console.error("Error loading review data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate]);
  const getCurrentWord = (): Word | undefined => {
    if (!reviewSession) return undefined;

    return reviewSession.currentIndex < reviewSession.reviewQueue.length
      ? reviewSession.reviewQueue[reviewSession.currentIndex]
      : undefined;
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
    if (!currentWord || !areAllFieldsAnswered() || !reviewSession) return;

    setIsChecking(true);

    // Parse the actual fields from the word
    const wordFieldsData = currentWord.fields
      .split(";")
      .map((field) => field.trim());
    const fieldNames = getFieldNames();

    // Count how many fields were answered correctly
    let correctFieldsCount = 0;
    const totalFieldsCount = fieldNames.length;

    fieldNames.forEach((fieldName, index) => {
      const userValue = fieldAnswers[fieldName]?.toLowerCase().trim() || "";
      const expectedValue = wordFieldsData[index]?.toLowerCase().trim() || "";
      if (userValue === expectedValue) {
        correctFieldsCount++;
      }
    });

    // Store the calculated correctness values for processing in handleNext
    // This prevents the current card from changing before the user clicks Next
    const allCorrect = correctFieldsCount === totalFieldsCount;
    setIsCorrect(allCorrect);

    // Save the FSRS evaluation but don't update the session yet
    // We'll keep the current word for feedback, then apply changes on Next
    // Store the correctness data as a session attribute
    setReviewSession({
      ...reviewSession,
      _pendingAnswer: {
        correctFields: correctFieldsCount,
        totalFields: totalFieldsCount,
      },
    });
  };
  const handleNext = () => {
    if (!reviewSession) return;

    // Now we process the actual FSRS logic that we delayed in handleCheck
    if (reviewSession._pendingAnswer) {
      const { correctFields, totalFields } = reviewSession._pendingAnswer;

      // Apply FSRS logic and update session
      const updatedSession = reviewManager.processAnswer(
        reviewSession,
        correctFields,
        totalFields
      );

      // Clear the pending answer and reset for next card
      resetFieldAnswers();
      setIsChecking(false);
      setIsCorrect(null);

      // Check if we've reached the end of the queue
      if (updatedSession.currentIndex >= updatedSession.reviewQueue.length) {
        // Complete session and save results
        reviewManager
          .completeReviewSession(updatedSession)
          .then(() => {
            setIsSummaryOpen(true);
          })
          .catch((error: any) => {
            console.error("Error completing review session:", error);
          });
      } else {
        // Continue to the next card
        setReviewSession({
          ...updatedSession,
          _pendingAnswer: undefined,
        });
      }
    }
  };
  const handleGiveUp = () => {
    if (!reviewSession) return;

    setIsChecking(true);
    setIsCorrect(false);

    // Store zero correct fields as pending answer
    const fieldNames = getFieldNames();
    setReviewSession({
      ...reviewSession,
      _pendingAnswer: {
        correctFields: 0,
        totalFields: fieldNames.length,
      },
    });
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
      </div>
    );
  }

  return (
    <div className={pageStyles.container}>
      <div className={styles.reviewContainer}>
        <ProgressBar
          currentIndex={reviewSession.currentIndex}
          totalWords={reviewSession.reviewQueue.length}
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
              reviewSession.currentIndex >=
                reviewSession.reviewQueue.length - 1 &&
              // Check if the current word would be requeued
              !(
                isCorrect === false ||
                (reviewSession._pendingAnswer &&
                  reviewSession._pendingAnswer.correctFields <
                    reviewSession._pendingAnswer.totalFields * 0.5)
              )
            }
          />
        )}
      </div>

      <ReviewSummary
        isOpen={isSummaryOpen}
        onClose={handleFinish}
        correctCount={reviewSession.correctAnswers}
        incorrectCount={reviewSession.incorrectAnswers}
        totalWords={reviewSession.reviewQueue.length}
      />
    </div>
  );
};

export default Review;
