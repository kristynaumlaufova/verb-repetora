import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import styles from "./TopBar.module.css";
import LangMenu from "./LangMenu/LangMenu";
import ProfileMenu from "./ProfileMenu/ProfileMenu";

interface TopBarProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  userName: string;
  onCreateNewLanguage: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentLanguage,
  onLanguageChange,
  userName,
}) => {
  return (
    <div className={styles.topBar}>
      <LangMenu
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />
      <ProfileMenu userName={userName} />
    </div>
  );
};

export default TopBar;
