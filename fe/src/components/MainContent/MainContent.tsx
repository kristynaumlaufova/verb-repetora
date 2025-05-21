import React from "react";
import styles from "./MainContent.module.css";

interface MainContentProps {
  currentPage: string;
}

const MainContent: React.FC<MainContentProps> = ({ currentPage }) => {
  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <div>Dashboard Content (Coming Soon)</div>;
      case "lessons":
        return <div>Lessons Content (Coming Soon)</div>;
      case "vocabulary":
        return <div>Vocabulary Content (Coming Soon)</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return <main className={styles.mainContent}>{renderContent()}</main>;
};

export default MainContent;
