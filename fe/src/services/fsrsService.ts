import { Word } from "./wordService";

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

export enum LearningState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3
}

const fsrsParams = {
  w: [
    0.2172,
    1.1771,
    3.2602,
    16.1507,
    7.0114,
    0.57,
    2.0966,
    0.0069,
    1.5261,
    0.112,
    1.0178,
    1.849,
    0.1133,
    0.3127,
    2.2934,
    0.2191,
    3.0004,
    0.7536,
    0.3332,
    0.1437,
    0.2,
  ],
  requestRetention: 0.9,
  defaultDifficulty: 0.3,
  minStability: 0.001,
};

/**
* Calculate initial stability of word
*/
const calculateInitialStability = (difficulty: number): number => {
  const w = fsrsParams.w;
  return Math.max(fsrsParams.minStability, w[4] * Math.exp(-w[5] * difficulty));
};

/**
 * Update card difficulty based on rating
 */
const updateDifficulty = (difficulty: number, rating: Rating): number => {
  const w = fsrsParams.w;
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
};

/**
 * Calculate retrievability based on stability and elapsed time
 */
const calculateRetrievability = (stability: number, elapsedDays: number): number => {
  return Math.exp(-elapsedDays / stability);
};

/**
 * Update stability based on card properties and rating
 */
const updateStability = (difficulty: number, stability: number, retrievability: number, rating: Rating): number => {
  const w = fsrsParams.w;
  
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
  
  return Math.max(fsrsParams.minStability, newStability);
};

/**
 * Calculate review interval based on stability
 */
const calculateInterval = (stability: number): number => {
  // Calculate interval using the desired retention formula
  const retention = fsrsParams.requestRetention;
  const interval = stability * Math.log(retention) / Math.log(0.9);
  
  // Ensure interval is at least 1 day
  return Math.max(1, Math.round(interval));
};

/**
 * Helper method to add days to a date
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Helper method to add minutes to a date
 */
const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

/**
 * Helper method to get days between two dates
 */
const getDaysBetween = (startDate: Date, endDate: Date): number => {
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
};

/**
 * Calculates the rating based on the percentage of correctly answered fields
 * @param correctFields Number of correctly answered fields
 * @param totalFields Total number of fields
 * @returns Rating based on the percentage of correctly answered fields
 */
export const calculateRating = (correctFields: number, totalFields: number): Rating => {
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
};

/**
 * Applies the FSRS algorithm to update a word's learning parameters based on the user's rating
 * @param word The word being reviewed
 * @param rating The rating given by the user
 * @returns Updated word with new FSRS parameters
 */
export const applyFSRSScheduler = (word: Word, rating: Rating): Word => {
  const now = new Date();
  
  // Create a copy of the word to avoid mutating the original
  const updatedWord = { ...word };
  
  // Initialize values for new cards
  if (!updatedWord.state) {
    updatedWord.state = LearningState.New;
  }
  
  if (!updatedWord.difficulty) {
    updatedWord.difficulty = fsrsParams.defaultDifficulty;
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
        updatedWord.due = addMinutes(now, 5); // Try again in 5 minutes
      } else if (rating === Rating.Hard) {
        // Hard, move to next step but with longer delay
        updatedWord.state = LearningState.Learning;
        updatedWord.step = (updatedWord.step || 0) + 1;
        updatedWord.due = addMinutes(now, 10); // Review in 10 minutes
      } else if (rating === Rating.Good) {
        if ((updatedWord.step || 0) >= 3) {
          // Graduate to Review state
          updatedWord.state = LearningState.Review;
          updatedWord.step = null;
          
          // Initialize stability for review cards
          updatedWord.stability = calculateInitialStability(updatedWord.difficulty || fsrsParams.defaultDifficulty);
          
          // Calculate next review date based on stability
          const interval = calculateInterval(updatedWord.stability);
          updatedWord.due = addDays(now, interval);
        } else {
          // Move to next learning step
          updatedWord.state = LearningState.Learning;
          updatedWord.step = (updatedWord.step || 0) + 1;
          updatedWord.due = addMinutes(now, 15 * (updatedWord.step || 1)); // Increasing intervals
        }
      } else if (rating === Rating.Easy) {
        // Skip remaining steps and graduate
        updatedWord.state = LearningState.Review;
        updatedWord.step = null;
        
        // Initialize stability with bonus for easy rating
        updatedWord.stability = calculateInitialStability(updatedWord.difficulty || fsrsParams.defaultDifficulty) * 1.5;
        
        // Calculate next review date with bonus interval
        const interval = calculateInterval(updatedWord.stability) * 1.5;
        updatedWord.due = addDays(now, interval);
      }
      break;
      
    case LearningState.Review:
      // Update difficulty based on rating
      updatedWord.difficulty = updateDifficulty(
        updatedWord.difficulty || fsrsParams.defaultDifficulty,
        rating
      );
      
      // Calculate retrievability (how likely the user was to remember)
      const retrievability = calculateRetrievability(
        updatedWord.stability || fsrsParams.minStability,
        getDaysBetween(updatedWord.lastReview || now, now)
      );
      
      // Update stability based on difficulty, retrievability and rating
      updatedWord.stability = updateStability(
        updatedWord.difficulty || fsrsParams.defaultDifficulty,
        updatedWord.stability || fsrsParams.minStability,
        retrievability,
        rating
      );
      
      if (rating === Rating.Again) {
        // Failed review, move to relearning
        updatedWord.state = LearningState.Relearning;
        updatedWord.step = 0;
        updatedWord.due = addMinutes(now, 5); // Try again in 5 minutes
      } else {
        // Stay in review state, calculate next interval
        const interval = calculateInterval(updatedWord.stability || fsrsParams.minStability);
        
        // Apply interval modifier based on rating
        let modifiedInterval = interval;
        if (rating === Rating.Hard) {
          modifiedInterval *= 0.8; // Reduce interval for hard ratings
        } else if (rating === Rating.Easy) {
          modifiedInterval *= 1.3; // Increase interval for easy ratings
        }
        
        updatedWord.due = addDays(now, modifiedInterval);
      }
      break;
      
    case LearningState.Relearning:
      if (rating === Rating.Again) {
        // Failed relearning, reset step
        updatedWord.step = 0;
        updatedWord.due = addMinutes(now, 5); // Try again in 5 minutes
      } else if (rating === Rating.Hard || rating === Rating.Good) {
        // Progress in relearning steps
        updatedWord.step = (updatedWord.step || 0) + 1;
        
        if ((updatedWord.step || 0) >= 2) {
          // Return to review state after completing relearning steps
          updatedWord.state = LearningState.Review;
          updatedWord.step = null;
          
          // Recalculate stability (reduced after failure)
          updatedWord.stability = (updatedWord.stability || fsrsParams.minStability) * 0.5;
          
          // Calculate next review date
          const interval = calculateInterval(updatedWord.stability || fsrsParams.minStability);
          updatedWord.due = addDays(now, interval);
        } else {
          // Continue relearning
          updatedWord.due = addMinutes(now, 10 * (updatedWord.step || 1));
        }
      } else if (rating === Rating.Easy) {
        // Skip remaining relearning steps
        updatedWord.state = LearningState.Review;
        updatedWord.step = null;
        
        // Recalculate stability (less reduction for easy rating)
        updatedWord.stability = (updatedWord.stability || fsrsParams.minStability) * 0.7;
        
        // Calculate next review date
        const interval = calculateInterval(updatedWord.stability || fsrsParams.minStability);
        updatedWord.due = addDays(now, interval);
      }
      break;
  }
  
  return updatedWord;
};

export interface FSRSInterface {
  calculateRating: typeof calculateRating;
  applyFSRSScheduler: typeof applyFSRSScheduler;
}

export const fsrsService: FSRSInterface = {
  calculateRating,
  applyFSRSScheduler
};

export default fsrsService;
