import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import styles from "./TopBar.module.css";
import LangMenu from "./LangMenu/LangMenu";
import ProfileMenu from "./ProfileMenu/ProfileMenu";

interface TopBarProps {
  userName: string;
}

const TopBar: React.FC<TopBarProps> = ({ userName }) => {
  return (
    <div className={styles.topBar}>
      <LangMenu />
      <ProfileMenu userName={userName} />
    </div>
  );
};

export default TopBar;
