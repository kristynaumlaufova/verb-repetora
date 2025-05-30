import { apiClient } from "./apiService";
import { Word } from "./wordService";
import { lessonService } from "./lessonService";
import { WordType, wordTypeService } from "./wordTypeService";

export interface ReviewSession {
  words: Word[];
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
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
      // For future implementation - recommended words based on FSRS algorithm
      // This is a placeholder for now
      words = await this.getWordsForLessons(lessonIds);
      // TODO: Implement FSRS algorithm filtering here
      console.log("FSRS-based recommendation to be implemented");
    }
    
    const wordTypes = await this.getWordTypesForWords(words);
    
    return {
      words,
      wordTypes
    };
  }
}

export const reviewService = new ReviewService();
