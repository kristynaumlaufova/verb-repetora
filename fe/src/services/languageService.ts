import { apiClient } from './apiService';

/**
 * Interface representing a language entity
 * @param id The unique identifier of the language
 * @param name The name of the language
 * @param createdAt The creation date of the language
 * @param updatedAt The last update date of the language
 */
export interface Language {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for paginated API responses
 * @param items The array of items in the current page
 * @param totalCount The total number of items across all pages
 * @param pageNumber The current page number
 * @param pageSize The number of items per page
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Interface defining query parameters for language requests
 * @param pageNumber The page number to retrieve
 * @param pageSize The number of items per page
 * @param searchTerm The search term to filter languages
 * @param sortBy The field to sort by
 * @param sortDescending Whether to sort in descending order
 */
export interface LanguageQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Service for handling language-related operations
 */
export const languageService = {
  /**
   * Retrieves a paginated list of languages
   * @param params Query parameters for filtering, sorting, and pagination
   * @returns Promise resolving to a paginated response of languages
   */
  getLanguages: async (params: LanguageQueryParameters = {}): Promise<PaginatedResponse<Language>> => {
    const response = await apiClient.get('/Language', { 
      params: {
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
   * Retrieves a specific language by its ID
   * @param id The ID of the language to retrieve
   * @returns Promise resolving to the language data
   */
  getLanguage: async (id: number): Promise<Language> => {
    const response = await apiClient.get(`/Language/${id}`);
    return response.data;  
  },

  /**
   * Creates a new language
   * @param name The name of the language to create
   * @returns Promise resolving to the created language data
   */
  createLanguage: async (name: string): Promise<Language> => {
    const response = await apiClient.post('/Language', { name });
    return response.data;  
  },

  /**
   * Updates an existing language
   * @param id The ID of the language to update
   * @param name The new name for the language
   * @returns Promise resolving to the updated language data
   */
  updateLanguage: async (id: number, name: string): Promise<Language> => {
    const response = await apiClient.put(`/Language/${id}`, { id, name });
    return response.data;  
  },

  /**
   * Deletes a language by its ID
   * @param id The ID of the language to delete
   * @returns Promise that resolves when the deletion is complete
   */
  deleteLanguage: async (id: number): Promise<void> => {
    await apiClient.delete(`/Language/${id}`);
  }
};
