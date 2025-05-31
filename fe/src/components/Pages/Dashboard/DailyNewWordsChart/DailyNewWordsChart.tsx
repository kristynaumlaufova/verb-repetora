import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import styles from "./DailyNewWordsChart.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyNewWordsChartProps {
  dailyData: Array<{ date: string; count: number }>;
}

const DailyNewWordsChart: React.FC<DailyNewWordsChartProps> = ({
  dailyData,
}) => {
  const hasData = dailyData && dailyData.length > 0;

  // Sort data by date
  const sortedData = hasData
    ? [...dailyData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    : [];

  // Format dates to be more readable
  const formattedDates = sortedData.map((item) => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const data = {
    labels: formattedDates,
    datasets: [
      {
        label: "Newly Learned Words",
        data: sortedData.map((item) => item.count),
        borderColor: "#9C27B0", //accent-1
        backgroundColor: "rgba(156, 39, 176, 0.05)", //accent-1-light
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Words",
        },
      },
      x: {
        title: {
          display: true,
          text: "Days",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Newly Learned Words</h3>
      <div className={styles.chartContent}>
        {hasData ? (
          <Line data={data} options={options} />
        ) : (
          <div className={styles.noDataMessage}>
            No word history data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyNewWordsChart;
