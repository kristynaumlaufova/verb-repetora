import { apiClient } from './apiService';

export interface Language {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface LanguageQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export const languageService = {
  getLanguages: async (params: LanguageQueryParameters = {}): Promise<PaginatedResponse<Language>> => {
    console.log(apiClient);
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

  getLanguage: async (id: number): Promise<Language> => {
    const response = await apiClient.get(`/Language/${id}`);
    return response.data;
  },

  createLanguage: async (name: string): Promise<Language> => {
    const response = await apiClient.post('/Language', { name });
    return response.data;
  },

  updateLanguage: async (id: number, name: string): Promise<Language> => {
    const response = await apiClient.put(`/Language/${id}`, { id, name });
    return response.data;
  },

  deleteLanguage: async (id: number): Promise<void> => {
    await apiClient.delete(`/Language/${id}`);
  }
};
