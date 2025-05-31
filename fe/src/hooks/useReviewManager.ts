import { useState, useCallback } from 'react';
import { Word, convertWordToFSRSRequest } from '../services/wordService';
import { WordType } from '../services/wordTypeService';
import { apiClient } from '../services/apiService';
import { lessonService } from '../services/lessonService';
import { wordTypeService } from '../services/wordTypeService';
import { fsrsService, Rating } from '../services/fsrsService';

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

export const useReviewManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Shuffles an array of words using Fisher-Yates algorithm
   */
  const shuffleWords = useCallback((words: Word[]): Word[] => {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);
  
  /**
   * Fetches words for the specified lessons
   */
  const getWordsForLessons = useCallback(async (lessonIds: number[]): Promise<Word[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let words: Word[] = [];
      
      for (const lessonId of lessonIds) {
        try {
          const lesson = await lessonService.getLesson(lessonId);
          if (lesson.wordIds && lesson.wordIds.length > 0) {
            const response = await apiClient.post("/Word/byIds", lesson.wordIds);
            // Use the convertDtoToWord function from wordService.ts
            const convertedWords = response?.data.map((dto: any) => ({
              ...dto,
              due: dto.due ? new Date(dto.due) : undefined,
              lastReview: dto.lastReview ? new Date(dto.lastReview) : null,
              firstReview: dto.firstReview ? new Date(dto.firstReview) : null
            })) || [];
            words = [...words, ...convertedWords];
          }
        } catch (error) {
          console.error(`Error fetching words for lesson ${lessonId}:`, error);
          setError(`Failed to fetch words for lesson ${lessonId}`);
        }
      }
      
      return shuffleWords(words);
    } finally {
      setIsLoading(false);
    }
  }, [shuffleWords]);
  
  /**
   * Fetches words that are due for review based on their due date
   */
  const getDueWordsForReview = useCallback(async (wordIds: number[]): Promise<Word[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request words with the filterByDue parameter set to true
      const response = await apiClient.post("/Word/byIds?filterByDue=true", wordIds);
      // Convert date strings to Date objects
      return response?.data.map((dto: any) => ({
        ...dto,
        due: dto.due ? new Date(dto.due) : undefined,
        lastReview: dto.lastReview ? new Date(dto.lastReview) : null,
        firstReview: dto.firstReview ? new Date(dto.firstReview) : null
      })) || [];
    } catch (error) {
      console.error("Error fetching due words:", error);
      setError("Failed to fetch due words for review");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Gets all word types for the given words
   */
  const getWordTypesForWords = useCallback(async (words: Word[]): Promise<WordType[]> => {
    try {
      // Get all unique word type IDs from the words
      const wordTypeIds = Array.from(
        new Set(words.map(word => word.wordTypeId))
      );
      
      return await wordTypeService.getWordTypesByIds(wordTypeIds);
    } catch (error) {
      console.error("Failed to fetch word types:", error);
      setError("Failed to fetch word types");
      return [];
    }
  }, []);
  
  /**
   * Loads review data for the specified lessons
   */
  const getReviewData = useCallback(async (lessonIds: number[], type: "all" | "recommended" = "all"): Promise<ReviewData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let words: Word[] = [];
      
      // Get words based on the review type
      if (type === "all") {
        words = await getWordsForLessons(lessonIds);
      } else {
        // Get words that are due for review based on FSRS algorithm
        const allWords = await getWordsForLessons(lessonIds);
        const wordIds = allWords.map(word => word.id);
        words = await getDueWordsForReview(wordIds);
      }
      
      const wordTypes = await getWordTypesForWords(words);
      
      return {
        words,
        wordTypes
      };
    } catch (error) {
      console.error("Error getting review data:", error);
      setError("Failed to get review data");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getWordsForLessons, getDueWordsForReview, getWordTypesForWords]);
  
  /**
   * Initializes a review session with the given words
   */
  const initReviewSession = useCallback((words: Word[]): ReviewSession => {
    return {
      reviewQueue: [...words],
      currentIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0
    };
  }, []);
  
  /**
   * Process a user's answer for a word in a review session
   */
  const processAnswer = useCallback((session: ReviewSession, correctFields: number, totalFields: number): ReviewSession => {
    // Create a copy to avoid mutating the original
    const updatedSession = { ...session };
    const currentWord = updatedSession.reviewQueue[updatedSession.currentIndex];
    
    if (!currentWord) {
      return updatedSession;
    }
    
    // Calculate rating based on the percentage of correctly answered fields
    const rating = fsrsService.calculateRating(correctFields, totalFields);
    
    // Update word with FSRS scheduling
    const updatedWord = fsrsService.applyFSRSScheduler(currentWord, rating);
    
    // Update the word in the queue
    updatedSession.reviewQueue[updatedSession.currentIndex] = updatedWord;
    
    // Update session statistics
    if (rating === Rating.Again || correctFields < totalFields) {
      updatedSession.incorrectAnswers++;
    } else {
      updatedSession.correctAnswers++;
    }
    
    // If the card was rated "Again" or marked incorrect, reinsert it into the queue
    if (rating === Rating.Again || correctFields < totalFields * 0.5) {
      // Calculate delay (number of cards before we see this one again)
      // For simplicity, we'll place it 3-5 cards later or at the end if that's not possible
      const queuePosition = Math.min(
        updatedSession.currentIndex + 3 + Math.floor(Math.random() * 3),
        updatedSession.reviewQueue.length
      );
      
      // Remove from current position and insert at new position
      const wordToRequeue = updatedSession.reviewQueue.splice(updatedSession.currentIndex, 1)[0];
      updatedSession.reviewQueue.splice(queuePosition, 0, wordToRequeue);
      
      // Adjust current index (if we remove the current card, we should stay at the same index)
      // but we don't want to advance yet since we're now looking at a new card
      return updatedSession;
    }
    
    // Advance to the next card
    updatedSession.currentIndex++;
    
    return updatedSession;
  }, []);
  
  /**
   * Completes a review session and sends the updated FSRS data to the server
   */
  const completeReviewSession = useCallback(async (session: ReviewSession): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare the update requests for all reviewed words
      const updateRequests = session.reviewQueue.map(word => convertWordToFSRSRequest(word));
      
      // Send batch update to the server
      await apiClient.post("/Word/updateBatchFSRS", updateRequests);
      
      console.log(`Review session completed. Updated ${updateRequests.length} words.`);
    } catch (error) {
      console.error("Error completing review session:", error);
      setError("Failed to save review session data");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    error,
    getReviewData,
    initReviewSession,
    processAnswer,
    completeReviewSession,
  };
};

export default useReviewManager;
