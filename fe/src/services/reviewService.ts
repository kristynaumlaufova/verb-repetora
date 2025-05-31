import { apiClient } from "./apiService";
import { Word, UpdateFSRSDataRequest, wordService, convertWordToFSRSRequest } from "./wordService";
import { lessonService } from "./lessonService";
import { WordType, wordTypeService } from "./wordTypeService";
import { fsrsService, Rating } from "./fsrsService";

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

class ReviewService {
  async getWordsForLessons(lessonIds: number[]): Promise<Word[]> {
    let words: Word[] = [];
    
    for (const lessonId of lessonIds) {
      try {
        const lesson = await lessonService.getLesson(lessonId);
        if (lesson.wordIds && lesson.wordIds.length > 0) {
          // const response = await apiClient.post("/Word/byIds", lesson.wordIds);
          // // Convert WordDto objects to Word objects with proper Date objects
          // const convertedWords = response?.data.map(convertDtoToWord) || [];
          // words = [...words, ...convertedWords];
        }
      } catch (error) {
        console.error(`Error fetching words for lesson ${lessonId}:`, error);
      }
    }
    
    return this.shuffleWords(words);
  }
  
  shuffleWords(words: Word[]): Word[] {
    // Fisher-Yates shuffle algorithm
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    
    return words;
  }

  async getWordTypesForWords(words: Word[]): Promise<WordType[]> {
    // Get all unique word type IDs from the words
    const wordTypeIds = Array.from(
      new Set(words.map(word => word.wordTypeId))
    );
    
    let wordTypes: WordType[] = [];
    try {
      wordTypes = await wordTypeService.getWordTypesByIds(wordTypeIds);
    } catch (error) {
      console.error("Failed to fetch word types:", error);
    }
    
    return wordTypes;
  }

  async getReviewData(lessonIds: number[], type: "all" | "recommended" = "all"): Promise<ReviewData> {
    let words: Word[] = [];
    
    // Get words based on the review type
    if (type === "all") {
      words = await this.getWordsForLessons(lessonIds);
    } else {
      // Get words that are due for review based on FSRS algorithm
      try {
        const allWords = await this.getWordsForLessons(lessonIds);
        const wordIds = allWords.map(word => word.id);
        
        words = await this.getDueWordsForReview(wordIds);
      } catch (error) {
        console.error("Error fetching due words for review:", error);
      }
    }
    
    const wordTypes = await this.getWordTypesForWords(words);
    
    return {
      words,
      wordTypes
    };
  }
    /**
   * Fetches words that are due for review based on their due date
   * @param wordIds IDs of words to check
   * @returns Words that are due for review
   */
  async getDueWordsForReview(wordIds: number[]): Promise<Word[]> {
    // try {
    //   // Request words with the filterByDue parameter set to true
    //   const response = await apiClient.post("/Word/byIds?filterByDue=true", wordIds);
    //   // Convert WordDto objects to Word objects with proper Date objects
    //   return response?.data.map(convertDtoToWord) || [];
    // } catch (error) {
    //   console.error("Error fetching due words:", error);
    //   return [];
    // }
    return [];
  }

  /**
   * Initializes a review session with the given words
   * @param words Words to review in this session
   * @returns A review session object
   */
  initReviewSession(words: Word[]): ReviewSession {
    return {
      reviewQueue: [...words],
      currentIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0
    };
  }

  /**
   * Calculates the rating based on the percentage of correctly answered fields
   * @param correctFields Number of correctly answered fields
   * @param totalFields Total number of fields
   * @returns Rating based on the percentage of correctly answered fields
   */
  calculateRating(correctFields: number, totalFields: number): Rating {
    // Delegate to fsrsService
    return fsrsService.calculateRating(correctFields, totalFields);
  }
  
  /**
   * Applies the FSRS algorithm to update a word's learning parameters based on the user's rating
   * @param word The word being reviewed
   * @param rating The rating given by the user
   * @returns Updated word with new FSRS parameters
   */
  applyFSRSScheduler(word: Word, rating: Rating): Word {
    // Delegate to fsrsService
    return fsrsService.applyFSRSScheduler(word, rating);
  }
  
  /**
   * Process a user's answer for a word in a review session
   * @param session Current review session
   * @param correctFields Number of correctly answered fields
   * @param totalFields Total number of fields
   * @returns Updated review session
   */
  processAnswer(session: ReviewSession, correctFields: number, totalFields: number): ReviewSession {
    // Create a copy to avoid mutating the original
    const updatedSession = { ...session };
    const currentWord = updatedSession.reviewQueue[updatedSession.currentIndex];
    
    if (!currentWord) {
      return updatedSession;
    }
    
    // Calculate rating based on the percentage of correctly answered fields
    const rating = this.calculateRating(correctFields, totalFields);
    
    // Update word with FSRS scheduling
    const updatedWord = this.applyFSRSScheduler(currentWord, rating);
    
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
  }
  /**
   * Completes a review session and sends the updated FSRS data to the server
   * @param session Review session to complete
   * @returns Promise that resolves when the update is complete
   */
  async completeReviewSession(session: ReviewSession): Promise<void> {
    try {
      // Prepare the update requests for all reviewed words
      const updateRequests: UpdateFSRSDataRequest[] = session.reviewQueue.map(word => 
        convertWordToFSRSRequest(word)
      );
      
      // Send batch update to the server
      await wordService.updateBatchFSRSData(updateRequests);
      
      console.log(`Review session completed. Updated ${updateRequests.length} words.`);
    } catch (error) {
      console.error("Error completing review session:", error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
