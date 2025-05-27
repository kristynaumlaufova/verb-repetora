import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LangMenu.module.css";
import useClickOutside from "../../../hooks/useClickOutside";

interface LangMenuProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { code: "ENGLISH", label: "English" },
  { code: "POLISH", label: "Polish" },
  { code: "GERMAN", label: "German" },
];

const LangMenu: React.FC<LangMenuProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(langMenuRef, () => setIsLangMenuOpen(false));

  const handleLanguageClick = useCallback(() => {
    setIsLangMenuOpen((prev) => !prev);
  }, []);

  const handleCreateNewClick = useCallback(() => {
    setIsLangMenuOpen(false);
    navigate("/manage-languages");
  }, [navigate]);

  return (
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
              {currentLanguage === lang.code && <i className="bi bi-check2" />}
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
  );
};

export default LangMenu;
