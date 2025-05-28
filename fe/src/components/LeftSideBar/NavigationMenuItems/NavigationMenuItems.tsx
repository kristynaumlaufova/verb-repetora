import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavigationMenuItem from "../NavigationMenuItem/NavigationMenuItem";
import styles from "./NavigationMenuItems.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export type MenuItem = {
  id: string;
  icon: string;
  label: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { id: "dashboard", icon: "bi bi-house-door", label: "Dashboard", path: "/" },
  { id: "lessons", icon: "bi bi-book", label: "Lessons", path: "/lessons" },
  {
    id: "vocabulary",
    icon: "bi bi-journal-text",
    label: "Vocabulary",
    path: "/vocabulary",
  },
  {
    id: "wordTypes",
    icon: "bi bi-tags",
    label: "Word Types",
    path: "/word-types",
  },
];

interface NavigationMenuItemsProps {
  onMobileMenuClose?: () => void;
}

const NavigationMenuItems: React.FC<NavigationMenuItemsProps> = ({
  onMobileMenuClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <nav className={styles.navigation}>
      {menuItems.map((item) => (
        <NavigationMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={location.pathname === (item.path === "/" ? "/" : item.path)}
          onClick={() => handleMenuItemClick(item.path)}
        />
      ))}
    </nav>
  );
};

export default NavigationMenuItems;
