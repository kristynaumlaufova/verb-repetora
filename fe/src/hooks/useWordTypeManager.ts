import { useState, useCallback, useRef, useEffect } from 'react';
import { wordTypeService, WordType, WordTypeQueryParameters } from '../services/wordTypeService';

export const useWordTypeManager = (langId: number | undefined) => {
  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string>("");

  const lastLangIdRef = useRef<number | undefined>(langId);

  const pageSize = 10;

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
