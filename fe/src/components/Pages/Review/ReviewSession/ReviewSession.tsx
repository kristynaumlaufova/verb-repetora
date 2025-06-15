import React from "react";
import styles from "./ReviewSession.module.css";
import pageStyles from "../../Pages.module.css";
import ProgressBar from "../ProgressBar/ProgressBar";
import AnswerForm from "../AnswerForm/AnswerForm";
import FeedbackCard from "../FeedbackCard/FeedbackCard";
import ReviewSummary from "../../../Dialogs/ReviewSummary/ReviewSummary";
import { Word } from "../../../../services/wordService";
import { WordType } from "../../../../services/wordTypeService";
import { ReviewSession as ReviewSessionType } from "../../../../hooks/useReviewManager";

interface ReviewSessionProps {
  reviewSession: ReviewSessionType;
  currentWord: Word;
  currentWordType: WordType;
  isChecking: boolean;
  isCorrect: boolean | null;
  isComplete: boolean;
  fieldAnswers: {
    [fieldName: string]: string;
  };
  reviewType: "all" | "recommended";
  onFieldChange: (fieldName: string, value: string) => void;
  onCheck: () => void;
  onGiveUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onNext: () => void;
  onBackClick: () => void;
  onFinish: () => void;
  getFieldNames: () => string[];
  areAllFieldsAnswered: boolean;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({
  reviewSession,
  currentWord,
  currentWordType,
  isChecking,
  isCorrect,
  isComplete,
  fieldAnswers,
  reviewType,
  onFieldChange,
  onCheck,
  onGiveUp,
  onKeyDown,
  onNext,
  onBackClick,
  onFinish,
  getFieldNames,
  areAllFieldsAnswered,
}) => {
  return (
    <div className={pageStyles.container}>
      <button
        className={styles.backButton}
        onClick={onBackClick}
        title="Cancel review"
      >
        <i className="bi bi-arrow-left"></i> Back
      </button>
      <div className={styles.reviewContainer}>
        <ProgressBar
          currentIndex={reviewSession.currentIndex}
          totalWords={reviewSession.totalWords}
        />
        {!isChecking ? (
          <AnswerForm
            currentWord={currentWord}
            currentWordType={currentWordType}
            fieldAnswers={fieldAnswers}
            onFieldChange={onFieldChange}
            onCheck={onCheck}
            onGiveUp={onGiveUp}
            onKeyDown={onKeyDown}
            areAllFieldsAnswered={areAllFieldsAnswered}
            getFieldNames={getFieldNames}
          />
        ) : (
          <FeedbackCard
            currentWord={currentWord}
            currentWordType={currentWordType}
            fieldAnswers={fieldAnswers}
            isCorrect={isCorrect}
            onNext={onNext}
            getFieldNames={getFieldNames}
            isLastWord={
              reviewSession.currentIndex >= reviewSession.totalWords - 1 ||
              reviewSession.reviewHeap.size() === 0
            }
          />
        )}
      </div>
      <ReviewSummary
        isOpen={isComplete}
        onClose={onFinish}
        correctCount={reviewSession.correctAnswers}
        incorrectCount={reviewSession.incorrectAnswers}
        totalWords={reviewSession.totalWords}
        reviewType={reviewType}
      />
    </div>
  );
};

export default ReviewSession;
