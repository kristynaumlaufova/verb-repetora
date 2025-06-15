import { apiClient } from './apiService';

/**
 * Interface representing a lesson with its associated words
 */
export interface Lesson {
  id: number;
  name: string;
  languageId: number;
  wordIds: number[];
}

/**
 * Interface for querying lessons with pagination and filtering options
 */
export interface LessonQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  languageId?: number;
}

/**
 * Interface for paginated lesson response from the API
 */
export interface LessonResponse {
  items: Lesson[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Service class for managing lessons
 */
class LessonService {  
  /**
   * Retrieves a paginated list of lessons with filtering and sorting options
   * @param params Query parameters for filtering, sorting and pagination
   * @returns Promise with paginated lesson response
   */
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

    /**
   * Creates a new lesson
   * @param name The name of the lesson
   * @param languageId The ID of the language the lesson belongs to
   * @param wordIds Optional array of word IDs to include in the lesson
   * @returns Promise with the created lesson
   */
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
  
  /**
   * Updates an existing lesson
   * @param id The ID of the lesson to update
   * @param name The updated name of the lesson
   * @param wordIds Updated array of word IDs to include in the lesson
   */
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
  
  /**
   * Deletes a lesson by its ID
   * @param id The ID of the lesson to delete
   */
  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/Lesson/${id}`);
  }  
  
  /**
   * Retrieves a lesson by its ID
   * @param id The ID of the lesson to retrieve
   * @returns Promise with the requested lesson
   */
  async getLesson(id: number): Promise<Lesson> {
    const response = await apiClient.get(`/Lesson/${id}`);
    return response.data;
  }
  
  /**
   * Retrieves multiple lessons by their IDs
   * @param lessonIds Array of lesson IDs to retrieve
   * @param languageId Language ID to filter results
   * @returns Promise with array of found lessons
   */
  async getLessonsById(lessonIds: number[], languageId: number): Promise<Lesson[]> {
    if (!lessonIds || lessonIds.length === 0) {
      return [];
    }
    
    const response = await apiClient.post(`/Lesson/byIds?langId=${languageId}`, lessonIds);
    return response.data;
  }
}

export const lessonService = new LessonService();
