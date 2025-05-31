import { apiClient } from "./apiService";
import { LearningState } from "./fsrsService";


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

export interface WordDto {
  id: number;
  wordTypeId: number;
  languageId: number;
  keyword: string;
  fields: string;
  state?: LearningState;
  step?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  due?: string;
  lastReview?: string | null;
  firstReview?: string | null;
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

export const wordService = {
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
    
    // Convert DTOs to Word objects
    const dtoResponse = response.data as PaginatedResponse<WordDto>;
    return {
      ...dtoResponse,
      items: dtoResponse.items.map(convertDtoToWord)
    };
  },

  createWord: async (word: CreateWordRequest): Promise<Word> => {
    const response = await apiClient.post("/Word", word);
    return convertDtoToWord(response.data);
  },

  updateWord: async (id: number, word: UpdateWordRequest): Promise<Word> => {
    const response = await apiClient.put(`/Word/${id}`, word);
    return convertDtoToWord(response.data);
  },
  
  deleteWord: async (id: number): Promise<void> => {
    await apiClient.delete(`/Word/${id}`);
  },
  
  getWordsByIds: async (wordIds: number[]): Promise<Word[]> => {
    if (!wordIds || wordIds.length === 0) {
      return [];
    }
    const response = await apiClient.post("/Word/byIds", wordIds);
    // Convert DTOs to Word objects
    return response.data.map(convertDtoToWord);
  },
  
  // Method to update FSRS data for a word
  updateFSRSData: async (data: UpdateFSRSDataRequest): Promise<Word> => {
    const response = await apiClient.put(`/Word/updateFSRS/${data.id}`, data);
    return convertDtoToWord(response.data);
  },
  
  // Method to batch update FSRS data for multiple words
  updateBatchFSRSData: async (dataList: UpdateFSRSDataRequest[]): Promise<void> => {
    await apiClient.post("/Word/updateBatchFSRS", dataList);
  }
};

// Helper function to convert WordDto to Word (converting string dates to Date objects)
export const convertDtoToWord = (dto: WordDto): Word => {
  return {
    ...dto,
    due: dto.due ? new Date(dto.due) : undefined,
    lastReview: dto.lastReview ? new Date(dto.lastReview) : null,
    firstReview: dto.firstReview ? new Date(dto.firstReview) : null
  };
};

// Helper function to convert Word to UpdateFSRSDataRequest (converting Date objects to strings)
export const convertWordToFSRSRequest = (word: Word): UpdateFSRSDataRequest => {
  return {
    id: word.id,
    state: word.state || LearningState.New,
    step: word.step !== undefined ? word.step : null,
    stability: word.stability !== undefined ? word.stability : null,
    difficulty: word.difficulty !== undefined ? word.difficulty : null,
    due: word.due?.toISOString() || new Date().toISOString(),
    lastReview: word.lastReview?.toISOString() || null,
    firstReview: word.firstReview?.toISOString() || null
  };
};
