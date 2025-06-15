import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lesson, lessonService } from '../services/lessonService';

/**
 * Hook for managing lessons in the application
 * Provides functionality for loading, creating, updating, and deleting lessons
 * as well as managing lesson selection state
 * 
 * @returns An object containing lesson data and functions to manage lessons
 */
export const useLessonManager = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);

  const { currentLanguage } = useLanguage();

  /**
   * Loads lessons for the current language
   */
  const loadLessons = useCallback(async () => {
    if (!currentLanguage) return;
    try {
      const response = await lessonService.getLessons({
        languageId: currentLanguage.id,
      });
      setLessons(response.items);
      setError('');
    } catch (error) {
      setError('Failed to load lessons');
    }
  }, [currentLanguage]);

  /**
   * Refreshes lesson data with loading state indicator
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadLessons();
    } finally {
      setIsLoading(false);
    }
  }, [loadLessons]);  
  
  /**
   * Creates a new lesson
   * 
   * @param name - The name of the lesson to create
   * @param wordIds - Optional array of word IDs to include in the lesson
   * @returns The ID of the newly created lesson, or null if creation failed
   */
  const createLesson = useCallback(async (name: string, wordIds: number[] = []) => {
    if (!currentLanguage || !name.trim()) return null;
    try {
      const newLesson = await lessonService.createLesson(
        name.trim(),
        currentLanguage.id,
        wordIds
      );
      await loadLessons();
      setError('');
      return newLesson.id;
    } catch (error) {
      setError('Failed to create lesson');
      return null;
    }
  }, [currentLanguage, loadLessons]);

  /**
   * Deletes a lesson by ID
   * 
   * @param lessonId - The ID of the lesson to delete
   * @returns True if deletion was successful, false otherwise
   */
  const deleteLesson = useCallback(async (lessonId: number) => {
    try {
      await lessonService.deleteLesson(lessonId);
      await loadLessons();
      setError('');
      return true;
    } catch (error) {
      setError('Failed to delete lesson');
      return false;
    }
  }, [loadLessons]);

  /**
   * Updates an existing lesson
   * 
   * @param lessonId - The ID of the lesson to update
   * @param name - The new name for the lesson
   * @param wordIds - Optional array of word IDs to include in the updated lesson
   * @returns True if update was successful, false otherwise
   */
  const updateLesson = useCallback(async (lessonId: number, name: string, wordIds: number[] = []) => {
    if (!name.trim()) return false;
    try {
      await lessonService.updateLesson(lessonId, name.trim(), wordIds);
      await loadLessons();
      setError('');
      return true;
    } catch (error) {
      setError('Failed to update lesson');
      return false;
    }
  }, [loadLessons]);

  /**
   * Toggles the selection state of a lesson
   * 
   * @param lessonId - The ID of the lesson to toggle selection for
   */
  const toggleLessonSelection = useCallback((lessonId: number) => {
    setSelectedLessons((prevSelected) => {
      if (prevSelected.includes(lessonId)) {
        return prevSelected.filter(id => id !== lessonId);
      } else {
        return [...prevSelected, lessonId];
      }
    });  
  }, []);

  return {
    lessons,
    isLoading,
    error,
    setError,
    refreshData,
    createLesson,
    updateLesson,
    deleteLesson,
    selectedLessons,
    toggleLessonSelection
  };
};
