import React, { useState } from "react";
import NavigationMenuItem from "../NavigationMenuItem/NavigationMenuItem";
import styles from "./NavigationMenuItems.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export type MenuItem = {
  id: string;
  icon: string;
  label: string;
};

const menuItems: MenuItem[] = [
  { id: "dashboard", icon: "bi bi-house-door", label: "Dashboard" },
  { id: "lessons", icon: "bi bi-book", label: "Lessons" },
  { id: "vocabulary", icon: "bi bi-journal-text", label: "Vocabulary" },
];

interface NavigationMenuItemsProps {
  onMenuItemClick: (menuId: string) => void;
}

const NavigationMenuItems: React.FC<NavigationMenuItemsProps> = ({
  onMenuItemClick,
}) => {
  const [activeItem, setActiveItem] = useState("dashboard");

  const handleMenuItemClick = (menuId: string) => {
    setActiveItem(menuId);
    onMenuItemClick(menuId);
  };

  return (
    <nav className={styles.navigation}>
      {menuItems.map((item) => (
        <NavigationMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={activeItem === item.id}
          onClick={() => handleMenuItemClick(item.id)}
        />
      ))}
    </nav>
  );
};

export default NavigationMenuItems;
