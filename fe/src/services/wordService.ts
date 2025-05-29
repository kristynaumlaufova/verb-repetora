import { apiClient } from "./apiService";

export interface Word {
  id: number;
  wordTypeId: number;
  languageId: number;
  keyword: string;
  fields: string;
}

export interface WordDto {
  id: number;
  wordTypeId: number;
  languageId: number;
  keyword: string;
  fields: string;
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

export const wordService = {
  getWords: async (params: WordQueryParameters): Promise<PaginatedResponse<WordDto>> => {
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
    return response.data;
  },

  createWord: async (word: CreateWordRequest): Promise<WordDto> => {
    const response = await apiClient.post("/Word", word);
    return response.data;
  },

  updateWord: async (id: number, word: UpdateWordRequest): Promise<WordDto> => {
    const response = await apiClient.put(`/Word/${id}`, word);
    return response.data;
  },
  deleteWord: async (id: number): Promise<void> => {
    await apiClient.delete(`/Word/${id}`);
  },
  
  getWordsByIds: async (wordIds: number[]): Promise<WordDto[]> => {
    if (!wordIds || wordIds.length === 0) {
      return [];
    }
    const response = await apiClient.post("/Word/byIds", wordIds);
    return response.data;
  }
};
