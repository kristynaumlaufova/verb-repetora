import { apiClient } from './apiService';

/**
 * Represents a word type with its structure and metadata
 */
export interface WordType {
  id: number;
  name: string;
  langId: number;
  userId: number;  
  fields: string;
}

/**
 * Generic interface for paginated API responses
 * @template T The type of items in the paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Query parameters for word type API requests
 * Used to filter, sort, and paginate word types
 */
export interface WordTypeQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  langId: number;
}

export const wordTypeService = {  
  /**
   * Retrieves a paginated list of word types based on the provided query parameters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns A promise resolving to a paginated response of word types
   */
  getWordTypes: async (params: WordTypeQueryParameters): Promise<PaginatedResponse<WordType>> => {
    const response = await apiClient.get('/WordType', { 
      params: {
        langId: params.langId,
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        searchTerm: params.searchTerm,
        sortBy: params.sortBy,
        sortDescending: params.sortDescending
      }
    });
    return response.data;
  },

  /**
   * Retrieves a single word type by its ID
   * @param id - The ID of the word type to retrieve
   * @returns A promise resolving to the requested word type
   */
  getWordType: async (id: number): Promise<WordType> => {
    const response = await apiClient.get(`/WordType/${id}`);
    return response.data;
  },
  
  /**
   * Retrieves multiple word types by their IDs for a specific language
   * @param wordTypeIds - Array of word type IDs to retrieve
   * @param languageId - The language ID to filter by
   * @returns A promise resolving to an array of word types
   */
  getWordTypesByIds: async (wordTypeIds: number[], languageId: number): Promise<WordType[]> => {
    if (!wordTypeIds || wordTypeIds.length === 0) {
      return [];
    }
    const response = await apiClient.post(`/WordType/byIds?langId=${languageId}`, wordTypeIds);
    return response.data;
  },

  /**
   * Creates a new word type
   * @param name - The name of the new word type
   * @param fields - The fields structure as a string
   * @param langId - The language ID the word type belongs to
   * @returns A promise resolving to the created word type
   */
  createWordType: async (name: string, fields: string, langId: number): Promise<WordType> => {
    const response = await apiClient.post('/WordType', {
      name,
      langId,
      fields
    });
    return response.data;
  },

  /**
   * Updates an existing word type
   * @param id - The ID of the word type to update
   * @param name - The updated name for the word type
   * @param fields - The updated fields structure as a string
   * @returns A promise resolving to the updated word type
   */
  updateWordType: async (id: number, name: string, fields: string): Promise<WordType> => {
    const response = await apiClient.put(`/WordType/${id}`, {
      id,
      name,
      fields
    });
    return response.data;
  },

  /**
   * Deletes a word type by its ID
   * @param id - The ID of the word type to delete
   * @returns A promise that resolves when the deletion is complete
   */
  deleteWordType: async (id: number): Promise<void> => {
    await apiClient.delete(`/WordType/${id}`);
  }
};
