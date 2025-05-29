import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lesson, lessonService } from '../services/lessonService';

export const useLessonManager = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);

  const { currentLanguage } = useLanguage();

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

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadLessons();
    } finally {
      setIsLoading(false);
    }
  }, [loadLessons]);  
  
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
