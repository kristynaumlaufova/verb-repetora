import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Pages.module.css";
import dashboardStyles from "./Dashboard.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useWordManager } from "../../../hooks/useWordManager";
import BasicStats from "./BasicStats/BasicStats";
import StateDistributionChart from "./StateDistributionChart/StateDistributionChart";
import DailyNewWordsChart from "./DailyNewWordsChart/DailyNewWordsChart";

interface DashboardData {
  dueWords: number;
  totalWords: number;
  stateDistribution: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  dailyNewWords: Array<{ date: string; count: number }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { loadDashboardData, error, isLoading } = useWordManager(
    currentLanguage?.id
  );
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    dueWords: 0,
    totalWords: 0,
    stateDistribution: {
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
    },
    dailyNewWords: [],
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await loadDashboardData();
      if (data) {
        setDashboardData(data);
      }
    };

    if (currentLanguage) {
      loadData();
    }
  }, [currentLanguage, loadDashboardData]);

  const handleReviewRecommended = () => {
    if (!currentLanguage) {
      return;
    }

    navigate("/review", {
      state: {
        type: "recommended",
        lessonIds: [],
        languageId: currentLanguage.id,
      },
    });
  };

  if (isLoading) {
    return (
      <main className={styles.pageContent}>
        <div className={dashboardStyles.loading}>Loading dashboard data...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageContent}>
        <div className={dashboardStyles.error}>{error}</div>
      </main>
    );
  }

  if (!currentLanguage) {
    return (
      <main className={styles.pageContent}>
        <div className={dashboardStyles.error}>
          Please select a language to view dashboard statistics.
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageContent}>
      <div className={dashboardStyles.dashboardContainer}>
        <BasicStats
          username={user?.username || "User"}
          dueWords={dashboardData.dueWords}
          totalWords={dashboardData.totalWords}
        />
        <button
          className={dashboardStyles.reviewButton}
          onClick={handleReviewRecommended}
        >
          Review Recommended Words
        </button>
        <div className={dashboardStyles.chartsRow}>
          <StateDistributionChart
            distribution={dashboardData.stateDistribution}
          />
          <DailyNewWordsChart dailyData={dashboardData.dailyNewWords} />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
