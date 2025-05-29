import { useState, useCallback } from "react";
import {
  wordService,
  Word,
  CreateWordRequest,
  UpdateWordRequest,
} from "../services/wordService";

export const useWordManager = (langId: number | undefined) => {
  const [words, setWords] = useState<Word[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const refreshWords = useCallback(async () => {
    if (!langId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await wordService.getWords({
        langId,
        pageNumber: 1,
        pageSize,
      });

      setWords(response.items);
      setTotalCount(response.totalCount);
      setCurrentPage(1);
    } catch (error: any) {
      setError(
        error.response?.data || "An error occurred while fetching words"
      );
      console.error("Failed to fetch words:", error);
    } finally {
      setIsLoading(false);
    }
  }, [langId]);

  const loadMore = async () => {
    if (!langId || isLoading || words.length >= totalCount) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;

    try {
      const response = await wordService.getWords({
        langId,
        pageNumber: nextPage,
        pageSize,
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
        error.response?.data || "An error occurred while creating the word"
      );
      return false;
    }
  };

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
    setError,
  };
};
