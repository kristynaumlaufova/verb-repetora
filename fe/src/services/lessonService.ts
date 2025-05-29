import { apiClient } from './apiService';

export interface Lesson {
  id: number;
  name: string;
  languageId: number;
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

class LessonService {  async getLessons(params: LessonQueryParameters): Promise<LessonResponse> {
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
    languageId: number
  ): Promise<Lesson> {
    const response = await apiClient.post('/Lesson', {
      name,
      languageId
    });
    return response.data;
  }

  async updateLesson(
    id: number,
    name: string
  ): Promise<void> {
    await apiClient.put(`/Lesson/${id}`, { name });
  }

  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/Lesson/${id}`);
  }

  async assignWordsToLesson(lessonId: number, wordIds: number[]): Promise<void> {
    await apiClient.post(`/Lesson/${lessonId}/words`, { wordIds });
  }

  async removeWordsFromLesson(lessonId: number, wordIds: number[]): Promise<void> {
    await apiClient.delete(`/Lesson/${lessonId}/words`, {
      data: { wordIds },
    });
  }
}

export const lessonService = new LessonService();
