import { apiClient } from "./apiService";
import { LearningState, Word, UpdateFSRSDataRequest, wordService, convertWordToFSRSRequest, convertDtoToWord } from "./wordService";
import { lessonService } from "./lessonService";
import { WordType, wordTypeService } from "./wordTypeService";

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

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
          const response = await apiClient.post("/Word/byIds", lesson.wordIds);
          // Convert WordDto objects to Word objects with proper Date objects
          const convertedWords = response?.data.map(convertDtoToWord) || [];
          words = [...words, ...convertedWords];
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
    try {
      // Request words with the filterByDue parameter set to true
      const response = await apiClient.post("/Word/byIds?filterByDue=true", wordIds);
      // Convert WordDto objects to Word objects with proper Date objects
      return response?.data.map(convertDtoToWord) || [];
    } catch (error) {
      console.error("Error fetching due words:", error);
      return [];
    }
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
    if (totalFields === 0) return Rating.Good; // Default to Good if there are no fields
    
    const percentage = (correctFields / totalFields) * 100;
    
    if (percentage <= 25) {
      return Rating.Again;
    } else if (percentage <= 50) {
      return Rating.Hard;
    } else if (percentage <= 85) {
      return Rating.Good;
    } else {
      return Rating.Easy;
    }
  }
  
  /**
   * FSRS Parameters - Based on the default parameters from the fsrs.py implementation
   * These parameters control how the scheduler calculates intervals between reviews
   */
  private fsrsParams = {
    requestRetention: 0.9, // Default target retention rate (90%)
    w: [
      0.2172, // w[0]
      1.1771, // w[1]
      3.2602, // w[2]
      16.1507, // w[3]
      7.0114, // w[4]
      0.57, // w[5]
      2.0966, // w[6]
      0.0069, // w[7]
      1.5261, // w[8]
      0.112, // w[9]
      1.0178, // w[10]
      1.849, // w[11]
      0.1133, // w[12]
      0.3127, // w[13]
      2.2934, // w[14]
      0.2191, // w[15]
      3.0004, // w[16]
      0.7536, // w[17]
      0.3332, // w[18]
      0.1437, // w[19]
      0.2, // w[20]
    ],
    defaultDifficulty: 0.3, // Default difficulty value for new cards
    minStability: 0.001, // Minimum stability value
  }
  
  /**
   * Applies the FSRS algorithm to update a word's learning parameters based on the user's rating
   * @param word The word being reviewed
   * @param rating The rating given by the user
   * @returns Updated word with new FSRS parameters
   */
  applyFSRSScheduler(word: Word, rating: Rating): Word {
    const now = new Date();
    
    // Create a copy of the word to avoid mutating the original
    const updatedWord = { ...word };
    
    // Initialize values for new cards
    if (!updatedWord.state) {
      updatedWord.state = LearningState.New;
    }
    
    if (!updatedWord.difficulty) {
      updatedWord.difficulty = this.fsrsParams.defaultDifficulty;
    }
    
    // Set first review date if this is the first time
    if (!updatedWord.firstReview) {
      updatedWord.firstReview = now;
    }
    
    // Update last review timestamp
    updatedWord.lastReview = now;
    
    // Apply different scheduling logic based on the current state and rating
    switch (updatedWord.state) {
      case LearningState.New:
      case LearningState.Learning:
        if (rating === Rating.Again) {
          // Failed the review, reset step
          updatedWord.state = LearningState.Learning;
          updatedWord.step = 0;
          updatedWord.due = this.addMinutes(now, 5); // Try again in 5 minutes
        } else if (rating === Rating.Hard) {
          // Hard, move to next step but with longer delay
          updatedWord.state = LearningState.Learning;
          updatedWord.step = (updatedWord.step || 0) + 1;
          updatedWord.due = this.addMinutes(now, 10); // Review in 10 minutes
        } else if (rating === Rating.Good) {
          if ((updatedWord.step || 0) >= 3) {
            // Graduate to Review state
            updatedWord.state = LearningState.Review;
            updatedWord.step = null;
            
            // Initialize stability for review cards
            updatedWord.stability = this.calculateInitialStability(updatedWord.difficulty || this.fsrsParams.defaultDifficulty);
            
            // Calculate next review date based on stability
            const interval = this.calculateInterval(updatedWord.stability);
            updatedWord.due = this.addDays(now, interval);
          } else {
            // Move to next learning step
            updatedWord.state = LearningState.Learning;
            updatedWord.step = (updatedWord.step || 0) + 1;
            updatedWord.due = this.addMinutes(now, 15 * (updatedWord.step || 1)); // Increasing intervals
          }
        } else if (rating === Rating.Easy) {
          // Skip remaining steps and graduate
          updatedWord.state = LearningState.Review;
          updatedWord.step = null;
          
          // Initialize stability with bonus for easy rating
          updatedWord.stability = this.calculateInitialStability(updatedWord.difficulty || this.fsrsParams.defaultDifficulty) * 1.5;
          
          // Calculate next review date with bonus interval
          const interval = this.calculateInterval(updatedWord.stability) * 1.5;
          updatedWord.due = this.addDays(now, interval);
        }
        break;
        
      case LearningState.Review:
        // Update difficulty based on rating
        updatedWord.difficulty = this.updateDifficulty(
          updatedWord.difficulty || this.fsrsParams.defaultDifficulty,
          rating
        );
        
        // Calculate retrievability (how likely the user was to remember)
        const retrievability = this.calculateRetrievability(
          updatedWord.stability || this.fsrsParams.minStability,
          this.getDaysBetween(updatedWord.lastReview || now, now)
        );
        
        // Update stability based on difficulty, retrievability and rating
        updatedWord.stability = this.updateStability(
          updatedWord.difficulty || this.fsrsParams.defaultDifficulty,
          updatedWord.stability || this.fsrsParams.minStability,
          retrievability,
          rating
        );
        
        if (rating === Rating.Again) {
          // Failed review, move to relearning
          updatedWord.state = LearningState.Relearning;
          updatedWord.step = 0;
          updatedWord.due = this.addMinutes(now, 5); // Try again in 5 minutes
        } else {
          // Stay in review state, calculate next interval
          const interval = this.calculateInterval(updatedWord.stability || this.fsrsParams.minStability);
          
          // Apply interval modifier based on rating
          let modifiedInterval = interval;
          if (rating === Rating.Hard) {
            modifiedInterval *= 0.8; // Reduce interval for hard ratings
          } else if (rating === Rating.Easy) {
            modifiedInterval *= 1.3; // Increase interval for easy ratings
          }
          
          updatedWord.due = this.addDays(now, modifiedInterval);
        }
        break;
        
      case LearningState.Relearning:
        if (rating === Rating.Again) {
          // Failed relearning, reset step
          updatedWord.step = 0;
          updatedWord.due = this.addMinutes(now, 5); // Try again in 5 minutes
        } else if (rating === Rating.Hard || rating === Rating.Good) {
          // Progress in relearning steps
          updatedWord.step = (updatedWord.step || 0) + 1;
          
          if ((updatedWord.step || 0) >= 2) {
            // Return to review state after completing relearning steps
            updatedWord.state = LearningState.Review;
            updatedWord.step = null;
            
            // Recalculate stability (reduced after failure)
            updatedWord.stability = (updatedWord.stability || this.fsrsParams.minStability) * 0.5;
            
            // Calculate next review date
            const interval = this.calculateInterval(updatedWord.stability || this.fsrsParams.minStability);
            updatedWord.due = this.addDays(now, interval);
          } else {
            // Continue relearning
            updatedWord.due = this.addMinutes(now, 10 * (updatedWord.step || 1));
          }
        } else if (rating === Rating.Easy) {
          // Skip remaining relearning steps
          updatedWord.state = LearningState.Review;
          updatedWord.step = null;
          
          // Recalculate stability (less reduction for easy rating)
          updatedWord.stability = (updatedWord.stability || this.fsrsParams.minStability) * 0.7;
          
          // Calculate next review date
          const interval = this.calculateInterval(updatedWord.stability || this.fsrsParams.minStability);
          updatedWord.due = this.addDays(now, interval);
        }
        break;
    }
    
    return updatedWord;
  }
  
  /**
   * Calculate initial stability for a card based on its difficulty
   */
  private calculateInitialStability(difficulty: number): number {
    const w = this.fsrsParams.w;
    return Math.max(this.fsrsParams.minStability, w[4] * Math.exp(-w[5] * difficulty));
  }
  
  /**
   * Update card difficulty based on rating
   */
  private updateDifficulty(difficulty: number, rating: Rating): number {
    const w = this.fsrsParams.w;
    // Mean reversion for difficulty
    const meanReversion = (0.3 - difficulty) * w[7];
    
    // Rating modification
    let difficultyModification = 0;
    if (rating === Rating.Again) {
      difficultyModification = w[8];
    } else if (rating === Rating.Hard) {
      difficultyModification = w[9];
    } else if (rating === Rating.Good) {
      difficultyModification = w[10];
    } else if (rating === Rating.Easy) {
      difficultyModification = w[11];
    }
    
    // Calculate new difficulty
    const newDifficulty = difficulty + meanReversion + difficultyModification;
    
    // Constrain difficulty between 0.1 and 1
    return Math.min(1, Math.max(0.1, newDifficulty));
  }
  
  /**
   * Calculate retrievability based on stability and elapsed time
   */
  private calculateRetrievability(stability: number, elapsedDays: number): number {
    return Math.exp(-elapsedDays / stability);
  }
  
  /**
   * Update stability based on card properties and rating
   */
  private updateStability(difficulty: number, stability: number, retrievability: number, rating: Rating): number {
    const w = this.fsrsParams.w;
    
    let stabilityModifier = 0;
    if (rating === Rating.Again) {
      stabilityModifier = w[12] * Math.pow(difficulty, w[13]) * Math.pow(stability, w[14]) * Math.pow(retrievability, w[15]);
    } else if (rating === Rating.Hard) {
      stabilityModifier = w[16] * Math.pow(difficulty, w[17]) * Math.pow(stability, w[18]) * Math.pow(retrievability, w[19]);
    } else if (rating === Rating.Good || rating === Rating.Easy) {
      stabilityModifier = w[0] + w[1] * Math.pow(difficulty, w[2]) * Math.pow(stability, w[3]);
    }
    
    let newStability = stability;
    if (rating === Rating.Again) {
      newStability *= stabilityModifier;
    } else {
      newStability *= (1 + stabilityModifier);
    }
    
    return Math.max(this.fsrsParams.minStability, newStability);
  }
  
  /**
   * Calculate review interval based on stability
   */
  private calculateInterval(stability: number): number {
    // Calculate interval using the desired retention formula
    const retention = this.fsrsParams.requestRetention;
    const interval = stability * Math.log(retention) / Math.log(0.9);
    
    // Ensure interval is at least 1 day
    return Math.max(1, Math.round(interval));
  }
  
  /**
   * Helper method to add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Helper method to add minutes to a date
   */
  private addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }
  
  /**
   * Helper method to get days between two dates
   */
  private getDaysBetween(startDate: Date, endDate: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time component for accurate day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Calculate the difference in milliseconds
    const diffMs = end.getTime() - start.getTime();
    
    // Convert to days
    return Math.round(diffMs / msPerDay);
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
