import React from "react";
import styles from "./ReviewLoading.module.css";
import pageStyles from "../../Pages.module.css";

const ReviewLoading: React.FC = () => {
  return (
    <div className={pageStyles.container}>
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading review session...</div>
      </div>
    </div>
  );
};

export default ReviewLoading;
