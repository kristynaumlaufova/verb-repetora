import { apiClient } from "./apiService";
import { Word } from "./wordService";
import { WordType, wordTypeService } from "./wordTypeService";
import { lessonService } from "./lessonService";

/**
 * Interface representing a review session with its state
 */
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

/**
 * Interface for review data containing words and their word types
 */
export interface ReviewData {
  words: Word[];
  wordTypes: WordType[];
}

export const reviewService = {    
  /**
   * Retrieves words for review from specified lessons
   * @param lessonIds Array of lesson IDs to get words from
   * @param languageId Language ID to filter words
   * @param filterByDue Whether to only include words due for review
   * @returns Promise with array of words for review
   */
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
      const lessons = await lessonService.getLessonsById(lessonIds, languageId);
      
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

  /**
   * Shuffles an array of words in place using Fisher-Yates algorithm
   * @param words Array of words to shuffle
   */
  shuffleWords: (words: Word[]) => {
    // Fisher-Yates shuffle algorithm
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
  },

  /**
   * Retrieves word types for a collection of words
   * @param words Array of words to get word types for
   * @param languageId Language ID to filter word types
   * @returns Promise with array of word types
   */
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
  
    /**
   * Checks a user's answer against the correct answer
   * @param userAnswer The user's input answer (semicolon-separated fields)
   * @param correctAnswer The correct answer (semicolon-separated fields)
   * @returns Number of correctly matched fields
   */
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
