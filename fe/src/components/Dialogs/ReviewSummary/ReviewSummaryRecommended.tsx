import React from "react";
import styles from "./ReviewSummary.module.css";

interface ReviewSummaryRecommendedProps {
  reviewedWords: number;
}

const ReviewSummaryRecommended: React.FC<ReviewSummaryRecommendedProps> = ({
  reviewedWords,
}) => {
  return (
    <div className={styles.summaryContent}>
      <div className={styles.summaryStatsRecommended}>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.reviewed}`}>
            {reviewedWords}
          </div>
          <div className={styles.statLabel}>Words Reviewed</div>
        </div>
      </div>
      <div className={styles.resultMessage}>
        Great job! You've completed your recommended reviews for today.
      </div>
    </div>
  );
};

export default ReviewSummaryRecommended;
