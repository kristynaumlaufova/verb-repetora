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
  const progress = ((currentIndex + 1) / totalWords) * 100;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressInfo}>
        <span>
          {currentIndex + 1} of {totalWords}
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
