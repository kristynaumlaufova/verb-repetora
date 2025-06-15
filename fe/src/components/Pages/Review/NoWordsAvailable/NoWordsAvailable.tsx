import React from "react";
import styles from "./NoWordsAvailable.module.css";
import pageStyles from "../../Pages.module.css";
import ReviewSummary from "../../../Dialogs/ReviewSummary/ReviewSummary";
import { ReviewSession } from "../../../../hooks/useReviewManager";

interface NoWordsAvailableProps {
  isComplete: boolean;
  onBackClick: () => void;
  reviewSession?: ReviewSession | null;
  reviewType: "all" | "recommended";
}

const NoWordsAvailable: React.FC<NoWordsAvailableProps> = ({
  isComplete,
  onBackClick,
  reviewSession,
  reviewType,
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
      <div className={styles.noWordsContainer}>
        <div className={styles.noWordsText}>No words available for review.</div>
        <button
          className={styles.finishButton}
          onClick={onBackClick}
          style={{ marginTop: "2rem" }}
        >
          Back to Lessons
        </button>
      </div>
      <ReviewSummary
        isOpen={isComplete}
        onClose={onBackClick}
        correctCount={reviewSession?.correctAnswers || 0}
        incorrectCount={reviewSession?.incorrectAnswers || 0}
        totalWords={reviewSession?.totalWords || 0}
        reviewType={reviewType}
      />
    </div>
  );
};

export default NoWordsAvailable;
