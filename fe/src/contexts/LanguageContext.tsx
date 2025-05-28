import React, { createContext, useContext, useState, useEffect } from "react";
import {
  languageService,
  Language,
  LanguageQueryParameters,
} from "../services/languageService";

interface LanguageState {
  currentLanguage: Language | null;
  languages: Language[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

interface LanguageContextType {
  currentLanguage: Language | null;
  setCurrentLanguage: (language: Language | null) => void;
  languages: Language[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  refreshLanguages: (params?: LanguageQueryParameters) => Promise<void>;
  loadMore: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<LanguageState>({
    currentLanguage: null,
    languages: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    isLoading: false,
    error: null,
  });

  const refreshLanguages = async (params?: LanguageQueryParameters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await languageService.getLanguages(params);
      setState((prev) => ({
        ...prev,
        languages: response.items,
        totalCount: response.totalCount,
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        isLoading: false,

        // If there is no current language selected but languages exist, select the first one
        currentLanguage:
          !prev.currentLanguage && response.items.length > 0
            ? response.items[0]
            : prev.currentLanguage,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching languages",
      }));
      console.error("Failed to fetch languages:", error);
    }
  };

  const loadMore = async () => {
    if (state.isLoading || state.languages.length >= state.totalCount) return;

    const nextPage = state.pageNumber + 1;
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await languageService.getLanguages({
        pageNumber: nextPage,
        pageSize: state.pageSize,
      });

      setState((prev) => ({
        ...prev,
        languages: [...prev.languages, ...response.items],
        pageNumber: response.pageNumber,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while loading more languages",
      }));
    }
  };

  const setCurrentLanguage = (language: Language | null) => {
    setState((prev) => ({ ...prev, currentLanguage: language }));
  };

  useEffect(() => {
    refreshLanguages();
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: state.currentLanguage,
        setCurrentLanguage,
        languages: state.languages,
        totalCount: state.totalCount,
        pageNumber: state.pageNumber,
        pageSize: state.pageSize,
        isLoading: state.isLoading,
        error: state.error,
        refreshLanguages,
        loadMore,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
