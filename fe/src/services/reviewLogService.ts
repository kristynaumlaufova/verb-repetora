import { apiClient } from "./apiService";
import { ReviewLog } from "../hooks/useFSRSManager";

export interface ReviewLogBatch {
  reviewLogs: ReviewLog[];
}

export const reviewLogService = {
  /**
   * Saves a batch of review logs to the server
   * @param reviewLogs Array of review logs to save
   * @returns Promise that resolves when the logs are saved
   */
  createBatchReviewLogs: async (reviewLogs: ReviewLog[]): Promise<void> => {
    await apiClient.post("/ReviewLog/batch", {
      reviewLogs: reviewLogs.map(log => ({
        wordId: log.CardId,
        rating: log.Rating,
        reviewDateTime: log.ReviewDateTime,
        reviewDuration: log.ReviewDuration
      }))
    });
  },

  /**
   * Loads optimized FSRS weights from the server
   * @returns Promise that resolves with the optimized weights
   */
  loadOptimizedWeights: async (): Promise<number[]> => {
    const response = await apiClient.get("/ReviewLog/load");
    return response.data;
  }
};
