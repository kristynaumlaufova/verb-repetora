import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TopBar.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { authService } from "../../services/authService";

interface TopBarProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  userName: string;
  userEmail: string;
  onCreateNewLanguage: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentLanguage,
  onLanguageChange,
  userName,
  userEmail,
  onCreateNewLanguage,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "ENGLISH", label: "English" },
    { code: "POLISH", label: "Polish" },
    { code: "GERMAN", label: "German" },
  ];

  const handleLanguageClick = () => {
    setIsLangMenuOpen(!isLangMenuOpen);
  };

  const handleCreateNewClick = () => {
    setIsLangMenuOpen(false);
    navigate("/manage-languages");
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.languageSelector} ref={langMenuRef}>
        <button className={styles.langButton} onClick={handleLanguageClick}>
          {currentLanguage}
        </button>
        {isLangMenuOpen && (
          <div className={styles.dropdown}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`${styles.dropdownItem} ${
                  currentLanguage === lang.code ? styles.selected : ""
                }`}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsLangMenuOpen(false);
                }}
              >
                <span>{lang.label}</span>
                {currentLanguage === lang.code && (
                  <i className="bi bi-check2" />
                )}
              </button>
            ))}
            <div className={styles.divider}></div>
            <button
              className={`${styles.dropdownItem} ${styles.createNew}`}
              onClick={handleCreateNewClick}
            >
              <span className={styles.createNewContent}>
                <i className="bi bi-plus-lg"></i>
                <span>Create new</span>
              </span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.userProfile} ref={profileMenuRef}>
        <button
          className={styles.avatar}
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          {userName.charAt(0).toUpperCase()}
        </button>
        {isProfileMenuOpen && (
          <div className={`${styles.dropdown} ${styles.profileDropdown}`}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userEmail}>{userEmail}</span>
            </div>
            <div className={styles.divider}></div>
            <button className={styles.dropdownItem}>
              <i className="bi bi-person"></i> Profile
            </button>{" "}
            <button
              className={styles.dropdownItem}
              onClick={async () => {
                try {
                  await authService.logout();
                  navigate("/login");
                } catch (error) {
                  console.error("Error during logout:", error);
                  navigate("/login");
                }
              }}
            >
              <i className="bi bi-box-arrow-right"></i> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
