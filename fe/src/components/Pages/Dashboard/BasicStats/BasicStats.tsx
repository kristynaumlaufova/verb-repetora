import React from "react";
import styles from "./BasicStats.module.css";

interface BasicStatsProps {
  username: string;
  dueWords: number;
  totalWords: number;
}

const BasicStats: React.FC<BasicStatsProps> = ({ username, dueWords, totalWords }) => {
  return (
    <div className={styles.statsSection}>
      <div className={styles.welcomeHeader}>
        <h1 className={styles.greeting}>Welcome back, {username}!</h1>
      </div>
      <p className={styles.subText}>Let's go back to study!</p>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Words to repeat</div>
          <div className={styles.statValue}>{dueWords}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>All words</div>
          <div className={styles.statValue}>{totalWords}</div>
        </div>
      </div>
    </div>
  );
};

export default BasicStats;
