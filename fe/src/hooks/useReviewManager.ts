import { useState, useCallback, useRef } from 'react';
import { Word, wordService } from '../services/wordService';
import { WordType } from '../services/wordTypeService';
import { reviewService } from '../services/reviewService';
import { reviewLogService } from '../services/reviewLogService';
import { convertRating, reviewWord, ReviewLog, updateFSRSWeights } from '../helpers/fsrsHelper';
import { useLanguage } from '../contexts/LanguageContext';
import { MinHeap } from '@datastructures-js/heap';

export interface ReviewSession {
  reviewHeap: MinHeap<Word>;
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalWords: number;
  pendingAnswer?: {
    correctFields: number;
    totalFields: number;
  };
}

export interface ReviewData {
  words: Word[];
  wordTypes: WordType[];
}

export const useReviewManager = (type: string) => {  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const reviewStartTimeRef = useRef<number | null>(null);
  const { currentLanguage } = useLanguage();

  // For "recommended" review type - sorts based on due review date
  const getDueTimeCompare = (word: Word): number => {
    return word.due ? new Date(word.due).getTime() : 0;
  };

  // For "all" review type - maintain original (shuffled) order
  const preserveOrderCompare = (word: Word): number => {
    return 0; // All words considered equal, so insertion order is preserved
  };
  const loadReviewData = useCallback(async (lessonIds: number[]): Promise<ReviewData | null> => {
    setIsLoading(true);
    setError(null);
      // Reset review state
    setReviewLogs([]);
    
    try {
      if (!currentLanguage) {
        setError("No language selected");
        setIsLoading(false);
        return null;
      }

      // Get words from the specified lessons
      const filterByDue = type === "recommended";
      let words = await reviewService.getWordsForLessons(lessonIds, currentLanguage.id, filterByDue);
      
      if (words.length === 0) {
        setError("No words available for review");
        setIsLoading(false);
        return null;
      }        
      
      // Process words based on review type
      if (type === "all") {
        // Shuffle words for review
        reviewService.shuffleWords(words);
      } else if (type === "recommended") {
        if (words.length === 0) {
          setError("No words are due for review");
          setIsLoading(false);
          return null;
        }
      }
      
      // Get word types for words
      const wordTypes = await reviewService.getWordTypesForWords(words, currentLanguage.id);
      
      const data = {
        words: words,
        wordTypes: wordTypes
      };
      
      setReviewData(data);
      setIsLoading(false);
      return data;
    } catch (error: any) {
      setError(error.message || "Failed to load review data");
      setIsLoading(false);
      return null;
    }
  }, [currentLanguage, type]);

  const initReviewSession = useCallback((data?: ReviewData): ReviewSession => {
    const sessionData = data || reviewData;
    
    if (!sessionData) {
      throw new Error("Cannot initialize session: Review data not loaded");
    }

    let reviewHeap: MinHeap<Word>;
    if(type === "all"){
      reviewHeap = new MinHeap(preserveOrderCompare);
    }else{
      reviewHeap = new MinHeap(getDueTimeCompare);
    }    sessionData.words.forEach((word) => reviewHeap.insert(word));
    
    const newSession: ReviewSession = {
      reviewHeap: reviewHeap,
      currentIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalWords: sessionData.words.length
    };
    
    setReviewSession(newSession);
    setIsChecking(false);
    setIsCorrect(null);
    setIsComplete(false);
    // Reset FSRS tracking data
    setReviewLogs([]);
    
    // Start timing for the first word
    reviewStartTimeRef.current = Date.now();
    
    return newSession;
  }, [reviewData, type]);  

  const getCurrentWord = useCallback((): Word | undefined => {
    if (!reviewSession) return undefined;
    
    // Check if there are words in the heap
    if (reviewSession.reviewHeap.size() === 0) {
      return undefined;
    }
    
    // Retrieve next word
    const nextWord = reviewSession.reviewHeap.root();

    if(type === "recommended") {
      // Check if the next word is actually due
      if (nextWord && nextWord.due) {
        const dueDate = new Date(nextWord.due);
        const currentDate = new Date();
        
        // If the word is not due yet return undefined
        if (dueDate > currentDate) {
          return undefined;
        }
      }
    }
    
    return nextWord ?? undefined;
  },[reviewSession, type]);

  const getCurrentWordType = useCallback((): WordType | undefined => {
    const word = getCurrentWord();
    if (!word) return undefined;

    return reviewData?.wordTypes.find((type) => type.id === word.wordTypeId);
  },[getCurrentWord, reviewData?.wordTypes]);  
  
  const checkAnswer = useCallback((answer: string, type: string): void => {
    if (!reviewSession || !getCurrentWord()) return;
    
    setIsChecking(true);
    
    const currentWord = getCurrentWord()!;
    const correctAnswer = currentWord.fields;
    
    // Check how many fields were correct
    const correctFields = reviewService.checkAnswer(answer, correctAnswer);
    const totalFields = correctAnswer.split(';').length;    
    
    if(type === "recommended"){
      // Calculate review duration
      const reviewDuration = reviewStartTimeRef.current 
        ? Date.now() - reviewStartTimeRef.current 
        : undefined;
      
      // Convert answer to FSRS rating
      const rating = convertRating(correctFields, totalFields);
      
      // Process with FSRS algorithm
      const [updatedWord, reviewLog] = reviewWord(currentWord, rating, reviewDuration);
      
      // Store review logs
      setReviewLogs(prev => [...prev, reviewLog]);
      
      // Immediately insert the updated word back into the heap
      reviewSession.reviewHeap.insert(updatedWord);
    }
    
    // Set whether the answer was correct for UI feedback
    setIsCorrect(correctFields === totalFields);
    
    // Update the session with pending answer information
    setReviewSession(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        pendingAnswer: {
          correctFields,
          totalFields
        }
      };
    });
  }, [reviewSession, getCurrentWord]);  
  
  const nextQuestion = useCallback((type: string): boolean => {
    if (!reviewSession) return false;
    
    // Extract the current word from the heap
    reviewSession.reviewHeap.extractRoot();
    
    // Check if this will be the last question or if next word is not due yet
    let willBeComplete = reviewSession.reviewHeap.size() === 0;
    
    // For recommended review type, check if the next word is actually due
    if (type === "recommended" && !willBeComplete) {
      const nextWord = reviewSession.reviewHeap.root();
      if (nextWord && nextWord.due) {
        const dueDate = new Date(nextWord.due);
        const currentDate = new Date();
        
        // If the word is not due yet, mark as complete
        if (dueDate > currentDate) {
          willBeComplete = true;
        }
      }
    }
    
    // Process the pending answer if there is one
    if (reviewSession.pendingAnswer) {
      const isFullyCorrect = reviewSession.pendingAnswer.correctFields === 
                            reviewSession.pendingAnswer.totalFields;
      
      // Update session with the answer result
      setReviewSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          correctAnswers: prev.correctAnswers + (isFullyCorrect ? 1 : 0),
          incorrectAnswers: prev.incorrectAnswers + (isFullyCorrect ? 0 : 1),
          currentIndex: prev.currentIndex + 1,
          pendingAnswer: undefined
        };
      });
    } else {
      // Move to next word if no pending answer
      setReviewSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
        };
      });
    }
    
  // Set complete state if no more words or next word is not due
    if (willBeComplete) {
      setIsComplete(true);

      if(type === "recommended"){
        // Save FSRS data for words
        wordService.updateBatchFSRSData(reviewSession.reviewHeap.toArray());
        
        // Save review logs for optimization
        if (reviewLogs.length > 0) {
          reviewLogService.createBatchReviewLogs(reviewLogs)
            .then(() => {
              // After saving logs, load optimized weights
              return reviewLogService.loadWeights();
            })
            .then(weights => {
              if (weights && weights.length > 0) {
                // Update FSRS weights with the optimized values
                updateFSRSWeights(weights);
              }
            })
            .catch(err => console.error("Failed to process review logs:", err));
        }
      }
    }
    
    // Reset UI state for the next word
    setIsChecking(false);
    setIsCorrect(null);    // Reset review start time for the next word
    if(type === "recommended"){
      reviewStartTimeRef.current = Date.now();  
    }    return willBeComplete;
  }, [reviewSession, reviewLogs]);
  
  const getSessionStats = useCallback(() => {
    if (!reviewSession) return null;
    
    const total = reviewSession.correctAnswers + reviewSession.incorrectAnswers;
    const percentCorrect = total > 0 
      ? Math.round((reviewSession.correctAnswers / total) * 100) 
      : 0;
    
    // Get next due date if available
    let nextDueDate = null;
    if (reviewSession.reviewHeap.size() > 0) {
      const nextWord = reviewSession.reviewHeap.root();
      if (nextWord && nextWord.due) {
        nextDueDate = new Date(nextWord.due);
      }
    }
      return {
      totalReviewWords: reviewSession.totalWords,
      remainingWords: reviewSession.reviewHeap.size(),
      wordsReviewed: reviewSession.currentIndex,
      correctAnswers: reviewSession.correctAnswers,
      incorrectAnswers: reviewSession.incorrectAnswers,
      percentCorrect,      nextDueDate
    };
  }, [reviewSession]);

  return {
    isLoading,
    error,
    loadReviewData,
    reviewSession,
    initReviewSession,
    isChecking,
    isCorrect,
    isComplete,
    getCurrentWord,
    getCurrentWordType,
    checkAnswer,
    nextQuestion,
    getSessionStats,
    reviewLogs
  };
};
