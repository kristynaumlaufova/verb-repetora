import { apiClient } from "./apiService";
import { Word } from "./wordService";
import { WordType, wordTypeService } from "./wordTypeService";

export interface ReviewSession {
  reviewQueue: Word[];
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  _pendingAnswer?: {
    correctFields: number;
    totalFields: number;
  };
}

export interface ReviewData {
  words: Word[];
  wordTypes: WordType[];
}

export const reviewService = {  
  getWordsForLessons: async(lessonIds: number[], languageId: number, filterByDue: boolean = false): Promise<Word[]> => {
    try {
      // For recommended review type with empty lessonIds, get all due words
      if (filterByDue && (!lessonIds || lessonIds.length === 0)) {
        const wordsResponse = await apiClient.post(`/Word/byIds?langId=${languageId}&filterByDue=${filterByDue}`, []);
        return wordsResponse.data;
      }
      
      // No selected lesson
      if (!lessonIds || lessonIds.length === 0) {
        return [];
      }
      
      // Get lessons
      const lessonsResponse = await apiClient.post(`/Lesson/byIds?langId=${languageId}`, lessonIds);
      const lessons = lessonsResponse.data;
      
      // Extract all word IDs
      const allWordIds = lessons.reduce((ids: number[], lesson: any) => {
        if (lesson.wordIds && lesson.wordIds.length > 0) {
          return [...ids, ...lesson.wordIds];
        }
        return ids;
      }, []);
      
      // If no word IDs found, return empty array
      if (allWordIds.length === 0) {
        return [];
      }
      
      // Get all words
      const wordsResponse = await apiClient.post(`/Word/byIds?langId=${languageId}&filterByDue=${filterByDue}`, allWordIds);
      return wordsResponse.data;
    } catch (error) {
      console.error(`Error fetching words for lessons:`, error);
      return [];
    }
  },
  
  shuffleWords: (words: Word[]) => {
    // Fisher-Yates shuffle algorithm
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
  },  

  getWordTypesForWords: async(words: Word[], languageId: number): Promise<WordType[]> => {
    const wordTypeIds = Array.from(
      new Set(words.map(word => word.wordTypeId))
    );
    
    let wordTypes: WordType[] = [];
    try {
      wordTypes = await wordTypeService.getWordTypesByIds(wordTypeIds, languageId);
    } catch (error) {
      console.error("Failed to fetch word types:", error);
    }
    
    return wordTypes;
  },
  
  checkAnswer: (userAnswer: string, correctAnswer: string): number => {
    const userFields = userAnswer.trim().split(';').map(field => field.trim());
    const correctFields = correctAnswer.trim().split(';').map(field => field.trim());

    let correctCount = 0;
    for (const field of userFields) {
      if (correctFields.includes(field)) {
        correctCount++;
      }
    }

    return correctCount;
  },
}
