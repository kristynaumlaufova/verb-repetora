import React from "react";
import Logo from "./Logo/Logo";
import NavigationMenuItems from "./NavigationMenuItems/NavigationMenuItems";
import styles from "./LeftSideBar.module.css";

interface LeftSideBarProps {
  onNavigate: (menuId: string) => void;
}

const LeftSideBar: React.FC<LeftSideBarProps> = ({ onNavigate }) => {
  return (
    <div className={styles.sidebar}>
      <Logo />
      <NavigationMenuItems onMenuItemClick={onNavigate} />
    </div>
  );
};

export default LeftSideBar;
