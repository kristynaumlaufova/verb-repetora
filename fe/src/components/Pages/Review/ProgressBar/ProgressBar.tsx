import React from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  currentIndex: number;
  totalWords: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalWords,
}) => {
  const progress = totalWords > 0 ? (currentIndex / totalWords) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressInfo}>
        <span>
          reviewed {currentIndex} of {totalWords}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
