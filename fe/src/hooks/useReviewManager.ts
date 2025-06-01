import { useState, useCallback } from 'react';
import { Word } from '../services/wordService';
import { WordType } from '../services/wordTypeService';
import { reviewService } from '../services/reviewService';
import { convertRating, reviewWord } from '../helpers/fsrsHelper';
import { useLanguage } from '../contexts/LanguageContext';

export interface ReviewSession {
  reviewQueue: Word[];
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  pendingAnswer?: {
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
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);  const [isComplete, setIsComplete] = useState(false);


  const { currentLanguage } = useLanguage();

  const loadReviewData = useCallback(async (lessonIds: number[], type: string): Promise<ReviewData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!currentLanguage) {
        setError("No language selected");
        setIsLoading(false);
        return null;
      }

      // Get words from the specified lessons
      const words = type === "all" 
        ? await reviewService.getWordsForLessons(lessonIds, currentLanguage.id)
        : await reviewService.getWordsForLessons(lessonIds, currentLanguage.id, true);
      
      if (words.length === 0) {
        setError("No words available for review");
        setIsLoading(false);
        return null;
      }      
      
      if(type === "all") {
        // Shuffle the words for review
        reviewService.shuffleWords(words);
      }
      
      // Get word types for these words
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
  }, [currentLanguage]);

  const initReviewSession = useCallback((data?: ReviewData): ReviewSession => {
    const sessionData = data || reviewData;
    
    if (!sessionData) {
      throw new Error("Cannot initialize session: Review data not loaded");
    }
    
    const newSession: ReviewSession = {
      reviewQueue: sessionData.words,
      currentIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0
    };
    
    setReviewSession(newSession);
    setIsChecking(false);
    setIsCorrect(null);
    setIsComplete(false);
    
    return newSession;
  }, [reviewData]);

  const getCurrentWord = useCallback((): Word | undefined => {
    if (!reviewSession) return undefined;

    return reviewSession.currentIndex < reviewSession.reviewQueue.length
      ? reviewSession.reviewQueue[reviewSession.currentIndex]
      : undefined;
  },[reviewSession]);

  const getCurrentWordType = useCallback((): WordType | undefined => {
    const word = getCurrentWord();
    if (!word) return undefined;

    return reviewData?.wordTypes.find((type) => type.id === word.wordTypeId);
  },[getCurrentWord, reviewData?.wordTypes]);
  
  const checkAnswer = useCallback((answer: string): void => {
    if (!reviewSession || !getCurrentWord()) return;
    
    setIsChecking(true);
    
    const currentWord = getCurrentWord()!;
    const correctAnswer = currentWord.fields;
    
    // Check how many fields were correct
    const correctFields = reviewService.checkAnswer(answer, correctAnswer);
    const totalFields = correctAnswer.split(';').length;
    
    // Calculater rating
    const rating = convertRating(correctFields, totalFields);
    const fsrsData = reviewWord(currentWord, rating, undefined);

    console.log(fsrsData);

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
  
  const nextQuestion = useCallback((): boolean => {
    if (!reviewSession) return false;
    
    // Check if this will be the last question
    const willBeComplete = (reviewSession.currentIndex + 1) >= reviewSession.reviewQueue.length;
    
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
    
    // Reset UI state for the next word
    setIsChecking(false);
    setIsCorrect(null);
    
    // Set the complete flag if this was the last question
    if (willBeComplete) {
      setIsComplete(true);
    }
    
    // Return true if the session is complete
    return willBeComplete;
  }, [reviewSession]);
  
  const getSessionStats = useCallback(() => {
    if (!reviewSession) return null;
    
    const total = reviewSession.correctAnswers + reviewSession.incorrectAnswers;
    const percentCorrect = total > 0 
      ? Math.round((reviewSession.correctAnswers / total) * 100) 
      : 0;
    
    return {
      totalWords: reviewSession.reviewQueue.length,
      wordsReviewed: reviewSession.currentIndex,
      correctAnswers: reviewSession.correctAnswers,
      incorrectAnswers: reviewSession.incorrectAnswers,
      percentCorrect
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
    getSessionStats
  };
};
