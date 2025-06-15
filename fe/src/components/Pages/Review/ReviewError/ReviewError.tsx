import React from "react";
import styles from "./ReviewError.module.css";
import pageStyles from "../../Pages.module.css";

interface ReviewErrorProps {
  error: string;
  onBackClick: () => void;
}

const ReviewError: React.FC<ReviewErrorProps> = ({ error, onBackClick }) => {
  return (
    <div className={pageStyles.container}>
      <button
        className={styles.backButton}
        onClick={onBackClick}
        title="Cancel review"
      >
        <i className="bi bi-arrow-left"></i>
        Back
      </button>
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>{error}</div>
        <button
          className={styles.finishButton}
          onClick={onBackClick}
          style={{ marginTop: "2rem" }}
        >
          Back to Lessons
        </button>
      </div>
    </div>
  );
};

export default ReviewError;
