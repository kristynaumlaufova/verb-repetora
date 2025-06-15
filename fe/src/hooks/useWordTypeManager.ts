import { useState, useCallback, useRef, useEffect } from 'react';
import { wordTypeService, WordType, WordTypeQueryParameters } from '../services/wordTypeService';

/**
 * Hook for managing word types in the application
 * Provides functionality for loading, creating, updating, and deleting word types
 * as well as searching and pagination
 * 
 * @param langId - Optional language ID to filter word types by
 * @returns An object containing word type data and functions to manage word types
 */
export const useWordTypeManager = (langId: number | undefined) => {
  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string>("");

  const lastLangIdRef = useRef<number | undefined>(langId);

  const pageSize = 10;

  /**
   * Refreshes the word type list with optional query parameters
   * Resets pagination when language changes
   * 
   * @param params - Optional query parameters for filtering and pagination
   */
  const refreshWordTypes = useCallback(async (params?: Partial<WordTypeQueryParameters>) => {
    if (!langId) {
      setWordTypes([]);
      setTotalCount(0);
      return;
    }

    // Reset pagination when lang was changed
    if (lastLangIdRef.current !== langId) {
      setPageNumber(1);
      lastLangIdRef.current = langId;
    }

    setIsLoading(true);

    try {
      const queryParams = {
        langId,
        pageNumber: params?.pageNumber || pageNumber,
        pageSize: params?.pageSize || pageSize,
        searchTerm: params?.searchTerm,
        sortBy: params?.sortBy,
        sortDescending: params?.sortDescending
      };
      const response = await wordTypeService.getWordTypes(queryParams);
      
      if (params?.pageNumber && params.pageNumber > 1) {
        // Load more
        setWordTypes(prev => [...prev, ...response.items]);
      } else {
        // Initial load or refresh
        setWordTypes(response.items);
      }
      
      setTotalCount(response.totalCount);
      setPageNumber(response.pageNumber);
      setError("");
    } catch (error: any) {
      setError(error.message || "Failed to load word types");
      setWordTypes([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [langId, pageNumber, pageSize]);

  /**
   * Deletes a word type by its ID
   * 
   * @param id - The ID of the word type to delete
   * @returns Promise that resolves to true if deletion was successful, false otherwise
   */
  const deleteWordType = useCallback(async (id: number) => {
    try {
      await wordTypeService.deleteWordType(id);
      await refreshWordTypes();
      setError("");
      return true;
    } catch (error: any) {
      setError(error.message || "Failed to delete word type");
      return false;
    }
  }, [refreshWordTypes]);

  /**
   * Creates a new word type
   * 
   * @param name - The name of the word type
   * @param fields - The field structure for the word type
   * @returns Promise that resolves to true if creation was successful, false otherwise
   */
  const createWordType = useCallback(async (name: string, fields: string) => {
    if (!langId) return false;

    try {
      await wordTypeService.createWordType(name, fields, langId);
      await refreshWordTypes();
      setError("");
      return true;
    } catch (error: any) {
      setError(error.message || "Failed to create word type");
      return false;
    }
  }, [langId, refreshWordTypes]);
  
  /**
   * Loads more word types using pagination
   * Only loads if not already loading and there are more items to load
   */
  const loadMore = useCallback(async () => {
    if (isLoading || wordTypes.length >= totalCount) return;
    await refreshWordTypes({ pageNumber: pageNumber + 1 });
  }, [isLoading, totalCount, wordTypes.length, pageNumber, refreshWordTypes]);

  const updateWordType = useCallback(async (id: number, name: string, fields: string) => {
    try {
      await wordTypeService.updateWordType(id, name, fields);
      await refreshWordTypes();
      setError("");
      return true;
    } catch (error: any) {
      setError(error.message || "Failed to update word type");
      return false;
    }  
  }, [refreshWordTypes]);
  
  const getWordTypesByIds = useCallback(async (wordTypeIds: number[]): Promise<WordType[]> => {
    if (!langId) {
      setError("No language selected");
      return [];
    }
    
    try {
      return await wordTypeService.getWordTypesByIds(wordTypeIds, langId);
    } catch (error: any) {
      setError(error.message || "Failed to fetch word types by IDs");
      return [];
    }
  }, [langId]);

  // Refresh word types when language changes
  useEffect(() => {
    if (langId !== undefined) {
      refreshWordTypes();
    }
  }, [langId, refreshWordTypes]);

  return {
    wordTypes,
    isLoading,
    totalCount,
    error,
    pageNumber,
    pageSize,
    refreshWordTypes,
    loadMore,
    deleteWordType,
    createWordType,
    updateWordType,
    getWordTypesByIds,
    setError
  };
};
