import React from "react";
import styles from "./ReviewSummary.module.css";

interface ReviewSummaryAllProps {
  correctCount: number;
  incorrectCount: number;
  totalWords: number;
}

const ReviewSummaryAll: React.FC<ReviewSummaryAllProps> = ({
  correctCount,
  incorrectCount,
  totalWords,
}) => {
  const percentCorrect =
    totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  return (
    <div className={styles.summaryContent}>
      <div className={styles.summaryStats}>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.correct}`}>
            {correctCount}
          </div>
          <div className={styles.statLabel}>Correct</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.incorrect}`}>
            {incorrectCount}
          </div>
          <div className={styles.statLabel}>Incorrect</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.total}`}>
            {totalWords}
          </div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statItem}>
          <div
            className={`${styles.statValue} ${
              percentCorrect >= 70 ? styles.correct : styles.incorrect
            }`}
          >
            {percentCorrect}%
          </div>
          <div className={styles.statLabel}>Score</div>
        </div>
      </div>
      <div className={styles.resultMessage}>
        {percentCorrect >= 70
          ? "Great job! You're doing well with these words."
          : "Keep practicing! You'll improve with time."}
      </div>
    </div>
  );
};

export default ReviewSummaryAll;
