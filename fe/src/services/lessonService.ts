import { apiClient } from './apiService';

export interface Lesson {
  id: number;
  name: string;
  languageId: number;
  wordIds: number[];
}

export interface LessonQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  languageId?: number;
}

export interface LessonResponse {
  items: Lesson[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

class LessonService {  
  async getLessons(params: LessonQueryParameters): Promise<LessonResponse> {
    const response = await apiClient.get('/Lesson', {
      params: {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        searchTerm: params.searchTerm,
        sortBy: params.sortBy,
        sortDescending: params.sortDescending,
        langId: params.languageId,
      },
    });
    return response.data;
  }
  async createLesson(
    name: string,
    languageId: number,
    wordIds: number[] = []
  ): Promise<Lesson> {
    const response = await apiClient.post('/Lesson', {
      name,
      languageId,
      wordIds
    });
    return response.data;
  }

  async updateLesson(
    id: number,
    name: string,
    wordIds: number[] = []
  ): Promise<void> {
    await apiClient.put(`/Lesson/${id}`, { 
      name,
      wordIds 
    });
  }

  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/Lesson/${id}`);
  }
}

export const lessonService = new LessonService();
