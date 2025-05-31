import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import styles from "./StateDistributionChart.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StateDistribution {
  new: number;
  learning: number;
  review: number;
  relearning: number;
}

interface StateDistributionChartProps {
  distribution: StateDistribution;
}

const StateDistributionChart: React.FC<StateDistributionChartProps> = ({
  distribution,
}) => {
  const hasData =
    distribution.new > 0 ||
    distribution.learning > 0 ||
    distribution.review > 0 ||
    distribution.relearning > 0;

  const data = {
    labels: ["New", "Learning", "Review", "Forgotten"],
    datasets: [
      {
        data: hasData
          ? [
              distribution.new,
              distribution.learning,
              distribution.review,
              distribution.relearning,
            ]
          : [1, 1, 1, 1], // Equal dummy values when no data
        backgroundColor: [
          "#9C27B0", // New - accent-1
          "#FF5722", // Learning - accent-2
          "#2fc0b1", // Review - accent-3
          "#2E96FF", // Relearning - main
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            if (!hasData) return "No data available";
            return context.label + ": " + context.raw;
          },
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Word Status Distribution</h3>
      <div className={styles.chartContent}>
        {hasData ? (
          <Pie data={data} options={options} />
        ) : (
          <div className={styles.noDataMessage}>No word data available</div>
        )}
      </div>
    </div>
  );
};

export default StateDistributionChart;
