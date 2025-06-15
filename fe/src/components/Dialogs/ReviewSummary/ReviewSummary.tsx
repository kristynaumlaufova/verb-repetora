import React from "react";
import dialogStyles from "../Dialog.module.css";
import styles from "./ReviewSummary.module.css";
import useClickOutside from "../../../hooks/useClickOutside";
import ReviewSummaryAll from "./ReviewSummaryAll";
import ReviewSummaryRecommended from "./ReviewSummaryRecommended";

interface ReviewSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  incorrectCount: number;
  totalWords: number;
  reviewType?: "all" | "recommended";
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  isOpen,
  onClose,
  correctCount,
  incorrectCount,
  totalWords,
  reviewType = "all",
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  if (!isOpen) return null;

  return (
    <div className={dialogStyles.modalOverlay}>
      <div className={dialogStyles.modal} ref={modalRef}>
        <h2 className={dialogStyles.title}>Review Summary</h2>
        {reviewType === "all" ? (
          <ReviewSummaryAll
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            totalWords={totalWords}
          />
        ) : (
          <ReviewSummaryRecommended
            reviewedWords={correctCount + incorrectCount}
          />
        )}
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
