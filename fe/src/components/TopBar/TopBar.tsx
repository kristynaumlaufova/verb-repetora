import React, { useState, useRef, useEffect } from "react";
import styles from "./TopBar.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";

interface TopBarProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  userName: string;
  userEmail: string;
}

const TopBar: React.FC<TopBarProps> = ({
  currentLanguage,
  onLanguageChange,
  userName,
  userEmail,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={styles.topBar}>
      <div className={styles.languageSelector} ref={langMenuRef}>
        <button
          className={styles.langButton}
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        >
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
            <button className={`${styles.dropdownItem} ${styles.createNew}`}>
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
            </button>
            <button className={styles.dropdownItem}>
              <i className="bi bi-box-arrow-right"></i> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
