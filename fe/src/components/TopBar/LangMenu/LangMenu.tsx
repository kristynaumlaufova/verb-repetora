import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LangMenu.module.css";
import useClickOutside from "../../../hooks/useClickOutside";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Language } from "../../../services/languageService";

const LangMenu: React.FC = () => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { languages, currentLanguage, setCurrentLanguage } = useLanguage();

  useClickOutside(langMenuRef, () => setIsLangMenuOpen(false));

  const handleLanguageClick = useCallback(() => {
    setIsLangMenuOpen((prev) => !prev);
  }, []);

  const handleLanguageChange = useCallback(
    (language: Language) => {
      setCurrentLanguage(language);
      setIsLangMenuOpen(false);
    },
    [setCurrentLanguage]
  );

  const handleCreateNewClick = useCallback(() => {
    setIsLangMenuOpen(false);
    navigate("/manage-languages");
  }, [navigate]);

  // Memoize the first 5 languages
  const displayLanguages = useMemo(() => languages.slice(0, 5), [languages]);

  return (
    <div className={styles.languageSelector} ref={langMenuRef}>
      <button className={styles.langButton} onClick={handleLanguageClick}>
        {currentLanguage?.name || "Select Language"}
      </button>
      {isLangMenuOpen && (
        <div className={styles.dropdown}>
          {displayLanguages.map((lang) => (
            <button
              key={lang.id}
              className={`${styles.dropdownItem} ${
                currentLanguage?.id === lang.id ? styles.selected : ""
              }`}
              onClick={() => handleLanguageChange(lang)}
            >
              <span>{lang.name}</span>
              {currentLanguage?.id === lang.id && (
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
  );
};

export default LangMenu;
