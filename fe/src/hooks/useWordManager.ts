import { useState, useCallback } from "react";
import {
  wordService,
  Word,
  CreateWordRequest,
  UpdateWordRequest,
  DashboardStats,
} from "../services/wordService";

/**
 * Hook for managing words in the application
 * Provides functionality for loading, creating, updating, and deleting words
 * as well as searching and pagination
 * 
 * @param langId - Optional language ID to filter words by
 * @returns An object containing word data and functions to manage words
 */
export const useWordManager = (langId: number | undefined) => {
  const [words, setWords] = useState<Word[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const pageSize = 10;

    /**
   * Refreshes the word list with optional search term
   * 
   * @param search - Optional search term to filter words
   */
  const refreshWords = useCallback(async (search?: string) => {
    if (!langId) return;

    setIsLoading(true);
    setError("");

    const searchQuery = search !== undefined ? search : searchTerm;

    try {
      const response = await wordService.getWords({
        langId,
        pageNumber: 1,
        pageSize,
        searchTerm: searchQuery,
      });

      setWords(response.items);
      setTotalCount(response.totalCount);
      setCurrentPage(1);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while fetching words"
      );
    } finally {
      setIsLoading(false);
    }
  }, [langId, searchTerm]);

  /**
   * Loads more words using pagination
   * Fetches the next page of words and appends them to the existing list
   */
  const loadMore = async () => {
    if (!langId || isLoading || words.length >= totalCount) {
       return;
    }

    setIsLoading(true);
    const nextPage = currentPage + 1;

    try {
      const response = await wordService.getWords({
        langId,
        pageNumber: nextPage,
        pageSize,
        searchTerm,
      });

      setWords((prev) => [...prev, ...response.items]);
      setCurrentPage(nextPage);
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while loading more words"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates a new word
   * 
   * @param wordTypeId - The ID of the word type for the new word
   * @param keyword - The keyword for the new word
   * @param fields - The fields for the new word (translations, definitions, etc.)
   * @returns Promise that resolves to true if creation was successful, false otherwise
   */
  const createWord = async (
    wordTypeId: number,
    keyword: string,
    fields: string
  ): Promise<boolean> => {
    if (!langId) return false;

    try {
      const wordData: CreateWordRequest = {
        languageId: langId,
        wordTypeId,
        keyword,
        fields,
      };

      await wordService.createWord(wordData);
      await refreshWords();
      return true;
    } catch (error: any) {
      setError(
        error.message || "An error occurred while creating the word"
      );
      return false;
    }
  };

  /**
   * Updates an existing word
   * 
   * @param id - The ID of the word to update
   * @param wordTypeId - The updated word type ID
   * @param keyword - The updated keyword
   * @param fields - The updated fields
   * @returns Promise that resolves to true if update was successful, false otherwise
   */
  const updateWord = async (
    id: number,
    wordTypeId: number,
    keyword: string,
    fields: string
  ): Promise<boolean> => {
    try {
      const wordData: UpdateWordRequest = {
        id,
        wordTypeId,
        keyword,
        fields,
      };

      await wordService.updateWord(id, wordData);
      await refreshWords();
      return true;
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while updating the word"
      );
      return false;
    }
  };

  /**
   * Deletes a word by its ID
   * 
   * @param id - The ID of the word to delete
   * @returns Promise that resolves to true if deletion was successful, false otherwise
   */
  const deleteWord = async (id: number): Promise<boolean> => {
    try {
      await wordService.deleteWord(id);
      await refreshWords();
      return true;
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while deleting the word"
      );      
      
      return false;
    }
  };

    /**
   * Retrieves multiple words by their IDs
   * 
   * @param wordIds - Array of word IDs to retrieve
   * @returns Promise with array of found words
   */
  const getWordsByIds = useCallback(async (wordIds: number[]): Promise<Word[]> => {
    if (!wordIds || wordIds.length === 0 || !langId) {
      return [];
    }
    
    try {
      return await wordService.getWordsByIds(wordIds, langId);
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while fetching words by IDs"
      );
      return [];
    }
  }, [langId]);
  
    /**
   * Loads dashboard statistics for the current language
   * 
   * @returns Promise with dashboard statistics or null if loading failed
   */
  const loadDashboardData = useCallback(async (): Promise<DashboardStats | null> => {
    if (!langId) {
      setError("Language ID is required to load dashboard data");
      return null;
    }
    
    try {
      setIsLoading(true);
      return await wordService.getDashboardStats(langId);
    } catch (error: any) {
      setError(
        error.response?.data || "Failed to load dashboard data"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [langId]);

  return {
    words,
    isLoading,
    error,
    totalCount,
    refreshWords,
    loadMore,
    createWord,
    updateWord,
    deleteWord,
    getWordsByIds,
    loadDashboardData,
    setError,
    searchTerm,
    setSearchTerm,
  };
};
