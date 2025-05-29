import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lesson, lessonService } from '../services/lessonService';

export const useLessonManager = () => {
  const { currentLanguage } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
  const createLesson = useCallback(async (name: string) => {
    if (!currentLanguage || !name.trim()) return false;
    try {
      await lessonService.createLesson(
        name.trim(),
        currentLanguage.id
      );
      await loadLessons();
      setError('');
      return true;
    } catch (error) {
      setError('Failed to create lesson');
      return false;
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
  
  const updateLesson = useCallback(async (lessonId: number, name: string) => {
    if (!name.trim()) return false;
    try {
      await lessonService.updateLesson(lessonId, name.trim());
      await loadLessons();
      setError('');
      return true;
    } catch (error) {
      setError('Failed to update lesson');
      return false;
    }
  }, [loadLessons]);

  return {
    lessons,
    isLoading,
    error,
    setError,
    refreshData,
    createLesson,
    updateLesson,
    deleteLesson,
  };
};
