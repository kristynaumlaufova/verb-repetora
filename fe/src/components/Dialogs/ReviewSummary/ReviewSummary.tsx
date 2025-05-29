import React from "react";
import dialogStyles from "../Dialog.module.css";
import styles from "./ReviewSummary.module.css";
import useClickOutside from "../../../hooks/useClickOutside";

interface ReviewSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  incorrectCount: number;
  totalWords: number;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  isOpen,
  onClose,
  correctCount,
  incorrectCount,
  totalWords,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  if (!isOpen) return null;

  const percentCorrect =
    totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>Review Summary</h2>
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
        </div>{" "}
        <div className={styles.buttonGroup}>
          <button
            onClick={onClose}
            className={dialogStyles.createButton}
            onKeyDown={(e) => e.key === "Enter" && onClose()}
            autoFocus
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
