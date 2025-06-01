import { apiClient } from "./apiService";
import { LearningState } from "../helpers/fsrsHelper"

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

export interface CreateWordRequest {
  languageId: number;
  wordTypeId: number;
  keyword: string;
  fields: string;
}

export interface UpdateWordRequest {
  id: number;
  wordTypeId: number;
  keyword: string;
  fields: string;
}

export interface UpdateFSRSDataRequest {
  id: number;
  state: LearningState;
  step: number | null;
  stability: number | null;
  difficulty: number | null;
  due: string;
  lastReview: string | null;
  firstReview?: string | null;
}

export interface WordQueryParameters {
  langId: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

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
  getDashboardStats: async (langId?: number): Promise<DashboardStats> => {
    const params = langId ? { langId } : {};
    const response = await apiClient.get("/Word/dashboard-stats", { params });
    return response.data;
  },
  
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

  createWord: async (word: CreateWordRequest): Promise<Word> => {
    return (await apiClient.post("/Word", word)).data;
  },

  updateWord: async (id: number, word: UpdateWordRequest): Promise<Word> => {
    return (await apiClient.put(`/Word/${id}`, word)).data;
  },
    deleteWord: async (id: number): Promise<void> => {
    await apiClient.delete(`/Word/${id}`);
  },
  
  getWordsByIds: async (wordIds: number[], languageId?: number): Promise<Word[]> => {
    if (!wordIds || wordIds.length === 0) {
      return [];
    }
    
    const langParam = languageId ? `?langId=${languageId}` : '';
    return (await apiClient.post(`/Word/byIds${langParam}`, wordIds)).data;
  },
  
  updateBatchFSRSData: async (dataList: UpdateFSRSDataRequest[]): Promise<void> => {
    await apiClient.post("/Word/updateBatchFSRS", dataList);
  }
};
