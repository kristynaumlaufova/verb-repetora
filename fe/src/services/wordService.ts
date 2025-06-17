import { apiClient } from "./apiService";
import { LearningState } from "../hooks/useFSRSManager"

/**
 * Interface representing a word.
 */
export interface Word {
  id: number;
  wordTypeId: number;
  languageId: number;
  keyword: string;
  fields: string;
  state?: LearningState;
  step?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  due?: Date;
  lastReview?: Date | null;
  firstReview?: Date | null;
}

/**
 * Interface for creating a new word
 * Contains required properties for word creation
 */
export interface CreateWordRequest {
  languageId: number;
  wordTypeId: number;
  keyword: string;
  fields: string;
}

/**
 * Interface for updating an existing word
 * Contains properties that can be modified during an update
 */
export interface UpdateWordRequest {
  id: number;
  wordTypeId: number;
  keyword: string;
  fields: string;
}

/**
 * Interface for updating FSRS data for a word
 * Contains all the word properties plus FSRS algorithm-specific fields
 */
export interface UpdateFSRSDataRequest {
  id: number;
  wordTypeId: number;
  languageId: number;
  keyword: string;
  fields: string;
  state?: LearningState;
  step?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  due?: Date;
  lastReview?: Date | null;
  firstReview?: Date | null;
}

/**
 * Interface for querying words with pagination and filtering options
 */
export interface WordQueryParameters {
  langId: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Generic interface for paginated API responses
 * @template T The type of items in the response
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Interface for dashboard statistics about word learning progress
 */
export interface DashboardStats {
  dueWords: number;
  totalWords: number;
  stateDistribution: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  dailyNewWords: Array<{ date: string; count: number }>;
}

export const wordService = {
    /**
   * Retrieves a paginated list of words with filtering and sorting options
   * @param params Query parameters for filtering, sorting and pagination
   * @returns Promise with paginated word list
   */
  getWords: async (params: WordQueryParameters): Promise<PaginatedResponse<Word>> => {
    const response = await apiClient.get("/Word", { 
      params: {
        langId: params.langId,
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        searchTerm: params.searchTerm,
        sortBy: params.sortBy,
        sortDescending: params.sortDescending
      }
    });
    
    return {
      ...response.data,
      items: response.data.items
    };
  },

  /**
   * Creates a new word
   * @param word The word data to create
   * @returns Promise with the created word
   */
  createWord: async (word: CreateWordRequest): Promise<Word> => {
    return (await apiClient.post("/Word", word)).data;
  },

  /**
   * Updates an existing word
   * @param id The ID of the word to update
   * @param word The updated word data
   * @returns Promise with the updated word
   */
  updateWord: async (id: number, word: UpdateWordRequest): Promise<Word> => {
    return (await apiClient.put(`/Word/${id}`, word)).data;
  }, 

  /**
   * Deletes a word by its ID
   * @param id The ID of the word to delete
   */
  deleteWord: async (id: number): Promise<void> => {
    await apiClient.delete(`/Word/${id}`);
  },
  
  /**
   * Retrieves multiple words by their IDs
   * @param wordIds Array of word IDs to retrieve
   * @param languageId Optional language ID to filter results
   * @returns Promise with array of found words
   */
  getWordsByIds: async (wordIds: number[], languageId?: number): Promise<Word[]> => {
    if (!wordIds || wordIds.length === 0) {
      return [];
    }
    
    const langParam = languageId ? `?langId=${languageId}` : '';
    return (await apiClient.post(`/Word/byIds${langParam}`, wordIds)).data;
  },
  
  /**
   * Updates FSRS data for multiple words in a batch operation
   * @param dataList Array of word objects with updated FSRS data
   */
  updateBatchFSRSData: async (dataList: UpdateFSRSDataRequest[]): Promise<void> => {
    await apiClient.post("/Word/updateBatchFSRS", dataList);
  },

  /**
   * Retrieves dashboard statistics for words in a specific language
   * @param langId Optional language ID to filter stats by
   * @returns Promise with dashboard statistics
   */
  getDashboardStats: async (langId?: number): Promise<DashboardStats> => {
    const params = langId ? { langId } : {};
    const response = await apiClient.get("/Word/dashboard-stats", { params });
    return response.data;
  }
};
