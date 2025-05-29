import { apiClient } from "./apiService";
import { Word } from "./wordService";
import { lessonService } from "./lessonService";

export interface ReviewSession {
  words: Word[];
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

class ReviewService {
  async getWordsForLessons(lessonIds: number[]): Promise<Word[]> {
    // First, gather all word IDs from the selected lessons
    const words: Word[] = [];
    
    for (const lessonId of lessonIds) {
      try {
        const lesson = await lessonService.getLesson(lessonId);
        if (lesson.wordIds && lesson.wordIds.length > 0) {
          // For each word ID, fetch the full word details
          for (const wordId of lesson.wordIds) {
            const response = await apiClient.get(`/Word/${wordId}`);
            const word: Word = response.data;
            // Avoid duplicates
            if (!words.some(w => w.id === word.id)) {
              words.push(word);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching words for lesson ${lessonId}:`, error);
      }
    }
    
    return words;
  }
  
  // This method would shuffle the words to make review more effective
  shuffleWords(words: Word[]): Word[] {
    // Create a copy of the words array to avoid modifying the original
    const shuffled = [...words];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
}

export const reviewService = new ReviewService();
