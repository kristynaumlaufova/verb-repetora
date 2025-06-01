import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useLessonManager } from "../../../hooks/useLessonManager";
import { Lesson, lessonService } from "../../../services/lessonService";
import pageStyles from "../Pages.module.css";
import styles from "./Lessons.module.css";
import LessonItem from "./LessonItem";
import CreateLesson from "../../Dialogs/CreateLesson/CreateLesson";
import DeleteConfirmation from "../../Dialogs/DeleteConfirmation/DeleteConfirmation";
import { useNavigate } from "react-router-dom";

const Lessons: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const {
    lessons,
    isLoading,
    error,
    setError,
    refreshData,
    createLesson,
    updateLesson,
    deleteLesson,
    selectedLessons,
    toggleLessonSelection,
  } = useLessonManager();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (currentLanguage) {
      refreshData();
    }
  }, [currentLanguage, refreshData]);

  const handleCreateOrUpdate = async (
    name: string,
    selectedWordIds?: number[]
  ) => {
    let success = false;

    if (editingLesson) {
      success = await updateLesson(
        editingLesson.id,
        name,
        selectedWordIds || []
      );
    } else {
      const lessonId = await createLesson(name, selectedWordIds);
      success = !!lessonId;
    }

    if (success) {
      setEditingLesson(null);
      setIsCreateModalOpen(false);
    }
  };
  const handleEdit = async (lesson: Lesson) => {
    try {
      const lessonData = await lessonService.getLesson(lesson.id);
      setEditingLesson(lessonData);
      setIsCreateModalOpen(true);
    } catch (error) {
      setError("Failed to load lesson details for editing");
    }
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;

    const success = await deleteLesson(deletingLesson.id);
    if (success) {
      setDeletingLesson(null);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingLesson(null);
    setError("");
  };

  return (
    <div className={pageStyles.container}>
      {error && <div className={pageStyles.errorNotification}>{error}</div>}
      <h1 className={pageStyles.title}>Lessons</h1>
      <div className={styles.buttonGroup}>
        <button
          className={styles.reviewRecommandedButton}
          onClick={() =>
            navigate("/review", {
              state: {
                lessonIds: selectedLessons,
                type: "recommended",
                languageId: currentLanguage?.id,
              },
            })
          }
          disabled={selectedLessons.length === 0}
        >
          Review recommended
        </button>
        <button
          className={styles.reviewAllButton}
          onClick={() =>
            navigate("/review", {
              state: {
                lessonIds: selectedLessons,
                type: "all",
                languageId: currentLanguage?.id,
              },
            })
          }
          disabled={selectedLessons.length === 0}
        >
          Review all
        </button>
      </div>
      <div className={pageStyles.list}>
        <div className={pageStyles.wrapper}>
          {isLoading ? (
            <div className={pageStyles.loading}>Loading...</div>
          ) : lessons.length === 0 ? (
            <div className={pageStyles.noContent}>No lessons found</div>
          ) : (
            lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                onEdit={handleEdit}
                onDelete={setDeletingLesson}
                isSelected={selectedLessons.includes(lesson.id)}
                onToggleSelect={toggleLessonSelection}
              />
            ))
          )}
        </div>
        <button
          className={pageStyles.addButton}
          onClick={() => setIsCreateModalOpen(true)}
          title="Add new lesson"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
      <CreateLesson
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onCreateLesson={handleCreateOrUpdate}
        initialValue={editingLesson}
      />
      <DeleteConfirmation
        isOpen={!!deletingLesson}
        onClose={() => {
          setDeletingLesson(null);
          setError("");
        }}
        onDelete={handleDelete}
        title="Do you really want to delete this lesson?"
        message="If you delete this lesson, all words assigned to it will be unlinked. This action can't be taken back."
      />
    </div>
  );
};

export default Lessons;
