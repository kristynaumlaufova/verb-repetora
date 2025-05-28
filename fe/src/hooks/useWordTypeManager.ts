import { useState, useCallback } from 'react';
import { wordTypeService, WordType } from '../services/wordTypeService';

export const useWordTypeManager = (langId: number | undefined) => {
  const [wordTypes, setWordTypes] = useState<WordType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string>("");

  const refreshWordTypes = useCallback(async () => {
    if (!langId) {
      setWordTypes([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await wordTypeService.getWordTypes({
        langId
      });
      setWordTypes(response.items);
      setTotalCount(response.totalCount);
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

  const createWordType = useCallback(async (name: string, fields: string[]) => {
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

  const updateWordType = useCallback(async (id: number, name: string, fields: string[]) => {
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
    refreshWordTypes,
    deleteWordType,
    createWordType,
    updateWordType,
    setError
  };
};
