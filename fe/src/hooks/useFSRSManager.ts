import { Word } from "../services/wordService";

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

export interface ReviewLog {
  CardId: number,
  Rating: Rating
  ReviewDateTime: Date,
  ReviewDuration: number | null
}

/**
 * Hook for managing FSRS algorithm calculation
 * 
 * @param parameteres - provide optimized FSRS parameters
 */
export const useFSRSManager = (parameters: number[]) => {  
  let weights = parameters.slice(0, -1)
  let desired_retention = parameters[21]

  // Constants for counting minimal and maximal interval after applying fuzz
  const FUZZ_RANGES = [
      {
          "start": 2.5,
          "end": 7.0,
          "factor": 0.15,
      },
      {
          "start": 7.0,
          "end": 20.0,
          "factor": 0.1,
      },
      {
          "start": 20.0,
          "end": Infinity,
          "factor": 0.05,
      },
  ]

  // Small time intervals that schedule words in the Learning state
  const LEARNING_STEPS = [10];

  // Small time intervals that schedule words in the Relearning state
  const RELEARNING_STEPS = [1, 10];

  // Maximum number of days a Review-state word can be scheduled into future
  const MAXIMUM_INTERVAL = 36500;

  // Whether to apply a small amount of random fuzz to calculated intervals.
  const ENABLE_FUZZING = true;

  // Minimal value of word stability
  const MIN_STABILITY = 0.001;

  // Decay constant and Factor constant - recalculated when weights change
  let DECAY = -weights[20];
  let FACTOR = 0.9 ** (1 / DECAY) - 1;

  /**
   * Converts the ratio of correctly answered fields to a rating value.
   * @param correctFields - Number of correctly answered fields
   * @param totalFields - Total number of fields
   * @returns Rating value based on the percentage of correct answers:
   * - <= 25%: Again
   * - <= 50%: Hard
   * - <= 75%: Good
   * - <= 100%: Easy
   */
  const convertRating = (correctFields: number, totalFields: number): Rating => {
    if (correctFields < 0 || totalFields <= 0) {
        throw new Error("Invalid input: correctFields must be non-negative and totalFields must be positive");
    }
    
    const percentage = (correctFields / totalFields) * 100;
    
    if (percentage <= 25) return Rating.Again;
    if (percentage <= 50) return Rating.Hard;
    if (percentage <= 75) return Rating.Good;
    return Rating.Easy;
  };
    
  /**
   * Calculates a current retrievability of word.
   *
   * The retrievability of a word is the predicted probability that the card is correctly recalled
   * at the provided datetime.
   *
   * @param word - The word whose retrievability is to be calculated.
   * @returns The retrievability of the Card object as a float between 0 and 1.
   */
  const getWordRetrievability = ( word: Word): number => {
      const currentDatetime = new Date(); 

      if (!word.lastReview || !word.stability) {
        return 0;
      }

      // Ensure lastReview is a Date object
      const lastReviewDate = word.lastReview instanceof Date 
        ? word.lastReview 
        : new Date(word.lastReview);
      
      // Handle invalid date
      if (isNaN(lastReviewDate.getTime())) {
        return 0;
      }

      const elapsedMilliseconds = currentDatetime.getTime() - lastReviewDate.getTime();
      const elapsedDays = Math.max(0, Math.floor(elapsedMilliseconds / (1000 * 60 * 60 * 24)));

      return Math.pow(1 + FACTOR * elapsedDays / word.stability , DECAY);
  }

  /**
   * Clamps a difficulty value to be within the range [1.0, 10.0].
   * @param difficulty - The difficulty value to clamp.
   * @returns The clamped difficulty value.
   */
  const clampDifficulty = (difficulty: number): number => {
      return Math.min(Math.max(difficulty, 1.0), 10.0);
  }
    
  /**
   * Clamps a stability value to be within the range [STABILITY_MIN, Infinity].
   * @param stability - The stability value to clamp.
   * @returns The clamped stability value.
   */
  const clampStability = (stability: number): number => {
      return Math.max(stability, MIN_STABILITY);

    }
    
  /**
   * Calculates the initial stability based on the given rating.
   *
   * @param rating - The rating value.
   * @returns The initial stability value.
   */
  const initialStability = (rating: number): number => {
      let initialStability = weights[rating - 1];
      return clampStability(initialStability);
  }
    
  /**
   * Calculates the initial difficulty based on the given rating.
   *
   * @param rating - The rating value.
   * @returns The initial difficulty value.
   */
  const initialDifficulty = (rating: number): number => {
      return clampDifficulty(weights[4] - Math.exp(weights[5] * (rating - 1)) + 1);
  }
    
  /**
   * Calculates the next interval based on the given stability.
   *
   * @param stability - The stability value.
   * @returns The next interval value in days.
   */
  const nextInterval = (stability: number): number => {
      let nextInterval = (stability / FACTOR) * (Math.pow(desired_retention, 1 / DECAY) - 1);
      
      // Convert to whole days
      nextInterval = Math.round(nextInterval);
    
      // Must be at least 1 day long
      nextInterval = Math.max(nextInterval, 1);
    
      // Cannot be longer than the maximum interval
      return Math.min(nextInterval, MAXIMUM_INTERVAL);
  }
    
  /**
   * Calculates the short-term stability based on the given stability and rating.
   *
   * @param stability - The stability value.
   * @param rating - The rating value.
   * @returns The short-term stability value.
   */
  const shortTermStability = (stability: number, rating: number): number => {
      let shortTermStabilityIncrease = Math.exp(weights[17] * (rating - 3 + weights[18])) * Math.pow(stability, -weights[19]);
    
      if (rating === Rating.Good || rating === Rating.Easy) {
        shortTermStabilityIncrease = Math.max(shortTermStabilityIncrease, 1.0);
      }
    
      return clampStability(stability * shortTermStabilityIncrease);
  }
    
  /**
   * Calculates the next difficulty based on the given difficulty and rating.
   *
   * @param difficulty - The difficulty value.
   * @param rating - The rating value.
   * @returns The next difficulty value.
   */
  const nextDifficulty = (difficulty: number, rating: number): number => {
      const arg1 = initialDifficulty(Rating.Easy);

      const deltaDifficulty = -(weights[6] * (rating - 3));
      const arg2 = difficulty + linearDamping(deltaDifficulty, difficulty);
    
      return clampDifficulty(meanReversion(arg1, arg2));
  }
    
  /**
   * Linear damping function for difficulty adjustment.
   *
   * @param deltaDifficulty - The change in difficulty.
   * @param difficulty - The current difficulty.
   * @returns The adjusted difficulty.
   */
  const linearDamping = (deltaDifficulty: number, difficulty: number): number => {
      return (10.0 - difficulty) * deltaDifficulty / 9.0;
  }
    
  /**
   * Mean reversion function for difficulty adjustment.
   *
   * @param arg1 - The first argument.
   * @param arg2 - The second argument.
   * @returns The mean-reverted value.
   */
  const meanReversion =(arg1: number, arg2: number): number => {
      return weights[7] * arg1 + (1 - weights[7]) * arg2;
  }
  
  /**
   * Calculates the next stability based on the given difficulty, stability, retrievability, and rating.
   *
   * @param difficulty - The difficulty value.
   * @param stability - The stability value.
   * @param retrievability - The retrievability value.
   * @param rating - The rating value.
   * @returns The next stability value.
   */
  const nextStability =(
      difficulty: number,
      stability: number,
      retrievability: number,
      rating: number
    ): number => {
      if (rating === Rating.Again) {
        return clampStability(nextForgetStability(difficulty, stability, retrievability));
      }

      return  clampStability(nextRecallStability(difficulty, stability, retrievability, rating));
  }
    
  /**
   * Calculates the next stability in case of forgetting.
   *
   * @param difficulty - The difficulty value.
   * @param stability - The stability value.
   * @param retrievability - The retrievability value.
   * @returns The new stability after forgetting.
   */
  const nextForgetStability = (
      difficulty: number,
      stability: number,
      retrievability: number
    ): number => {
      const longTerm = weights[11] *
        Math.pow(difficulty, -weights[12]) *
        (Math.pow(stability + 1, weights[13]) - 1) *
        Math.exp((1 - retrievability) * weights[14]);
    
      const shortTerm = stability / Math.exp(weights[17] * weights[18]);
    
      return Math.min(longTerm, shortTerm);
  }
    
  /**
   * Calculates the next stability in case of successful recall.
   *
   * @param difficulty - The difficulty value.
   * @param stability - The stability value.
   * @param retrievability - The retrievability value.
   * @param rating - The rating value.
   * @returns The new stability after recalling.
   */
  const nextRecallStability =(
      difficulty: number,
      stability: number,
      retrievability: number,
      rating: number
  ): number => { 
      const hardPenalty = rating === Rating.Hard ? weights[15] : 1;
      const easyBonus = rating === Rating.Easy ? weights[16] : 1;
    
      return stability * (
        1 +
        Math.exp(weights[8]) *
        (11 - difficulty) *
        Math.pow(stability, -weights[9]) *
        (Math.exp((1 - retrievability) * weights[10]) - 1) *
        hardPenalty *
        easyBonus
      );
  }
    
  /**
   * Adds random fuzz to an interval to prevent words from becoming too predictable.
   *
   * @param intervalDays - The calculated interval before fuzzing.
   * @returns The fuzzed interval.
   */
    function getFuzzedInterval(intervalDays: number): number {
      // Fuzz is not applied on small intervals
      if (intervalDays < 2.5) {
        return intervalDays;
      }
    
      const [minInterval, maxInterval] = getFuzzRange(intervalDays);
      
      return Math.min(
        Math.round(Math.random() * (maxInterval - minInterval + 1) + minInterval),
        MAXIMUM_INTERVAL
      );
    }
    
  /**
   * Computes the fuzz range (min and max values) based on the interval.
   *
   * @param intervalDays - The number of days in the interval.
   * @returns A tuple of [min, max] interval values.
   */
    function getFuzzRange(intervalDays: number): [number, number] {
      let delta = 1.0;
    
      for (const fuzz of FUZZ_RANGES) {
        const overlap = Math.max(Math.min(intervalDays, fuzz.end) - fuzz.start, 0.0);
        delta += fuzz.factor * overlap;
      }
    
      let minInterval = Math.max(2, Math.round(intervalDays - delta));
      let maxInterval = Math.min(Math.round(intervalDays + delta), MAXIMUM_INTERVAL);
      minInterval = Math.min(minInterval, maxInterval);
    
      return [minInterval, maxInterval];
    }
    
  /**
   * Reviews a word with a given rating at a given time for a specified duration.
   *
   * @param word - The word being reviewed.
   * @param rating - The chosen rating for the card being reviewed.
   * @param reviewDuration - The number of milliseconds it took to review the card or undefined if unspecified.
   * @returns A tuple containing the updated, reviewed word and its corresponding review log.
   * @throws Error if the `reviewDatetime` is not timezone-aware and set to UTC.
   */
  const reviewWord = (
    word: Word,
    rating: Rating,
    reviewDuration?: number
  ): [Word, ReviewLog] => {
    // Create a copy of the word to avoid modifying the original
    const updatedWord = { ...word };
    const reviewDatetime = new Date();

    // Set date of fist review
    if(updatedWord.firstReview === null)
    {
      updatedWord.firstReview = new Date();
    }
    
    // Calculate days since last review
    let daysSinceLastReview: number | null = null;
    if (updatedWord.lastReview) {
      // Ensure lastReview is a Date object
      const lastReviewDate = updatedWord.lastReview instanceof Date 
        ? updatedWord.lastReview 
        : new Date(updatedWord.lastReview);
      
      // Handle invalid date
      if (!isNaN(lastReviewDate.getTime())) {
        const elapsedMilliseconds = reviewDatetime.getTime() - lastReviewDate.getTime();
        daysSinceLastReview = Math.floor(elapsedMilliseconds / (1000 * 60 * 60 * 24));
      }
    }

    let nextIntervalValue: number;

    // Handle different learning states
    switch (updatedWord.state) {
      case LearningState.Learning:
        // Update stability and difficulty
        if (updatedWord.stability === null || updatedWord.stability === undefined || 
            updatedWord.difficulty === null || updatedWord.difficulty === undefined) {
          updatedWord.stability = initialStability(rating);
          updatedWord.difficulty = initialDifficulty(rating);
        } else if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
          updatedWord.stability = shortTermStability(updatedWord.stability, rating);
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty, rating);
        } else {
          updatedWord.stability = nextStability(
            updatedWord.difficulty,
            updatedWord.stability,
            getWordRetrievability(updatedWord),
            rating
          );
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty, rating);
        }

        // Calculate next interval
        if (LEARNING_STEPS.length === 0 || 
            (updatedWord.step && updatedWord.step >= LEARNING_STEPS.length && 
            [Rating.Hard, Rating.Good, Rating.Easy].includes(rating))) {
          updatedWord.state = LearningState.Review;
          updatedWord.step = undefined;
          nextIntervalValue = nextInterval(updatedWord.stability);
        } else {
          if (rating === Rating.Again) {
            updatedWord.step = 0;
            nextIntervalValue = LEARNING_STEPS[updatedWord.step] / (24 * 60); // Convert minutes to days
          } else if (rating === Rating.Hard) {
            // Step stays the same
            if (updatedWord.step === 0 && LEARNING_STEPS.length === 1) {
              nextIntervalValue = LEARNING_STEPS[0] * 1.5 / (24 * 60);
            } else if (updatedWord.step === 0 && LEARNING_STEPS.length >= 2) {
              nextIntervalValue = (LEARNING_STEPS[0] + LEARNING_STEPS[1]) / 2.0 / (24 * 60);
            } else {
              nextIntervalValue = LEARNING_STEPS[updatedWord.step as number] / (24 * 60);
            }
          } else if (rating === Rating.Good) {
            if (updatedWord.step && updatedWord.step + 1 === LEARNING_STEPS.length) {
              updatedWord.state = LearningState.Review;
              updatedWord.step = undefined;
              nextIntervalValue = nextInterval(updatedWord.stability);
            } else {
              updatedWord.step = (updatedWord.step ? updatedWord.step + 1 : 1);
              nextIntervalValue = LEARNING_STEPS[updatedWord.step] / (24 * 60);
            }
          } else if (rating === Rating.Easy) {
            updatedWord.state = LearningState.Review;
            updatedWord.step = undefined;
            nextIntervalValue = nextInterval(updatedWord.stability);
          } else {
            nextIntervalValue = 1; // Default to 1 day if rating is not recognized
          }
        }
        break;

      case LearningState.Review:
        // Update stability and difficulty
        if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
          updatedWord.stability = shortTermStability(updatedWord.stability as number, rating);
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty as number, rating);
        } else {
          updatedWord.stability = nextStability(
            updatedWord.difficulty as number,
            updatedWord.stability as number,
            getWordRetrievability(updatedWord),
            rating
          );
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty as number, rating);
        }

        // Calculate next interval
        if (rating === Rating.Again) {
          if (RELEARNING_STEPS.length === 0) {
            nextIntervalValue = nextInterval(updatedWord.stability as number);
          } else {
            updatedWord.state = LearningState.Relearning;
            updatedWord.step = 0;
            nextIntervalValue = RELEARNING_STEPS[0] / (24 * 60); // Convert minutes to days
          }
        } else {
          // Hard, Good, or Easy
          nextIntervalValue = nextInterval(updatedWord.stability as number);
        }
        break;

      case LearningState.Relearning:
        // Update stability and difficulty
        if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
          updatedWord.stability = shortTermStability(updatedWord.stability as number, rating);
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty as number, rating);
        } else {
          updatedWord.stability = nextStability(
            updatedWord.difficulty as number,
            updatedWord.stability as number,
            getWordRetrievability(updatedWord),
            rating
          );
          updatedWord.difficulty = nextDifficulty(updatedWord.difficulty as number, rating);
        }

        // Calculate next interval
        if (RELEARNING_STEPS.length === 0 || 
            (updatedWord.step && updatedWord.step >= RELEARNING_STEPS.length && 
            [Rating.Hard, Rating.Good, Rating.Easy].includes(rating))) {
          updatedWord.state = LearningState.Review;
          updatedWord.step = undefined;
          nextIntervalValue = nextInterval(updatedWord.stability as number);
        } else {
          if (rating === Rating.Again) {
            updatedWord.step = 0;
            nextIntervalValue = RELEARNING_STEPS[updatedWord.step] / (24 * 60);
          } else if (rating === Rating.Hard) {
            // Step stays the same
            if (updatedWord.step === 0 && RELEARNING_STEPS.length === 1) {
              nextIntervalValue = RELEARNING_STEPS[0] * 1.5 / (24 * 60);
            } else if (updatedWord.step === 0 && RELEARNING_STEPS.length >= 2) {
              nextIntervalValue = (RELEARNING_STEPS[0] + RELEARNING_STEPS[1]) / 2.0 / (24 * 60);
            } else {
              nextIntervalValue = RELEARNING_STEPS[updatedWord.step as number] / (24 * 60);
            }
          } else if (rating === Rating.Good) {
            if (updatedWord.step && updatedWord.step + 1 === RELEARNING_STEPS.length) {
              updatedWord.state = LearningState.Review;
              updatedWord.step = undefined;
              nextIntervalValue = nextInterval(updatedWord.stability as number);
            } else {
              updatedWord.step = (updatedWord.step ? updatedWord.step + 1 : 1);
              nextIntervalValue = RELEARNING_STEPS[updatedWord.step] / (24 * 60);
            }
          } else if (rating === Rating.Easy) {
            updatedWord.state = LearningState.Review;
            updatedWord.step = undefined;
            nextIntervalValue = nextInterval(updatedWord.stability as number);
          } else {
            nextIntervalValue = 1; // Default to 1 day if rating is not recognized
          }
        }
        break;

      default:
        // New state or unrecognized state
        updatedWord.state = LearningState.Learning;
        updatedWord.step = 0;
        nextIntervalValue = LEARNING_STEPS[0] / (24 * 60); // Convert minutes to days
        break;
    }

    // Apply fuzzing if enabled and in Review state
    if (ENABLE_FUZZING && updatedWord.state === LearningState.Review) {
      nextIntervalValue = getFuzzedInterval(nextIntervalValue);
    }

    // Update due date and last review
    const intervalMilliseconds = nextIntervalValue * 24 * 60 * 60 * 1000;
    updatedWord.due = new Date(reviewDatetime.getTime() + intervalMilliseconds);
    updatedWord.lastReview = reviewDatetime;

    // Create review log
    const reviewLog: ReviewLog = {
      CardId: updatedWord.id,
      Rating: rating,
      ReviewDateTime: reviewDatetime,
      ReviewDuration: reviewDuration || null
    };

    return [updatedWord, reviewLog];
  };

  return {
    convertRating,
    reviewWord
  };
}
