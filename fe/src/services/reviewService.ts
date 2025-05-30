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
    let words: Word[] = [];
    
    for (const lessonId of lessonIds) {
      try {
        const lesson = await lessonService.getLesson(lessonId);
        if (lesson.wordIds && lesson.wordIds.length > 0) {
          words = [...words, ...(await apiClient.post("/Word/byIds", lesson.wordIds))?.data];
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
}

export const reviewService = new ReviewService();
