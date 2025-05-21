import React, { useState, useEffect } from "react";
import Logo from "./Logo/Logo";
import NavigationMenuItems from "./NavigationMenuItems/NavigationMenuItems";
import styles from "./LeftSideBar.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";

interface LeftSideBarProps {
  onNavigate: (menuId: string) => void;
}

const LeftSideBar: React.FC<LeftSideBarProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {isMobile && !isMobileMenuOpen && (
        <button
          className={styles.menuToggle}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>
      )}

      {isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}
      >
        <Logo />
        <NavigationMenuItems
          onMenuItemClick={(menuId) => {
            onNavigate(menuId);
            if (isMobile) {
              setIsMobileMenuOpen(false);
            }
          }}
        />
      </div>
    </>
  );
};

export default LeftSideBar;
