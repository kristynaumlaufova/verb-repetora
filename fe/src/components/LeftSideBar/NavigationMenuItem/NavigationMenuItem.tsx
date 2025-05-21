import React from "react";
import styles from "./NavigationMenuItem.module.css";

interface NavigationMenuItemProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <div
      className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <i className={`${icon} ${styles.icon}`} />
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default NavigationMenuItem;
