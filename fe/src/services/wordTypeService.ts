import { apiClient } from './apiService';

export interface WordType {
  id: number;
  name: string;
  langId: number;
  userId: number;  
  fields: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface WordTypeQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  langId: number;
}

export const wordTypeService = {  getWordTypes: async (params: WordTypeQueryParameters): Promise<PaginatedResponse<WordType>> => {
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

  getWordType: async (id: number): Promise<WordType> => {
    const response = await apiClient.get(`/WordType/${id}`);
    return response.data;
  },
  getWordTypesByIds: async (wordTypeIds: number[], languageId: number): Promise<WordType[]> => {
    if (!wordTypeIds || wordTypeIds.length === 0) {
      return [];
    }
    const response = await apiClient.post(`/WordType/byIds?langId=${languageId}`, wordTypeIds);
    return response.data;
  },

  createWordType: async (name: string, fields: string, langId: number): Promise<WordType> => {
    const response = await apiClient.post('/WordType', {
      name,
      langId,
      fields
    });
    return response.data;
  },

  updateWordType: async (id: number, name: string, fields: string): Promise<WordType> => {
    const response = await apiClient.put(`/WordType/${id}`, {
      id,
      name,
      fields
    });
    return response.data;
  },

  deleteWordType: async (id: number): Promise<void> => {
    await apiClient.delete(`/WordType/${id}`);
  }
};
