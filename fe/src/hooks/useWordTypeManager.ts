import { useState, useCallback } from 'react';
import { wordTypeService, WordType, WordTypeQueryParameters } from '../services/wordTypeService';

export const useWordTypeManager = (langId: number | undefined) => {  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<string>("");
  const refreshWordTypes = useCallback(async (params?: Partial<WordTypeQueryParameters>) => {
    if (!langId) {
      setWordTypes([]);
      setTotalCount(0);
      return;
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
        // Load more - append items
        setWordTypes(prev => [...prev, ...response.items]);
      } else {
        // Initial load or refresh - replace items
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
  }, [langId]);

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
    setError
  };
};
