import React from "react";
import pageStyles from "../Pages.module.css";
import { Lesson } from "../../../services/lessonService";

interface LessonItemProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={pageStyles.item}>
      <div>
        <span title={lesson.name}>{lesson.name}</span>
      </div>
      <div className={pageStyles.actionButtons}>
        <button
          className={pageStyles.editButton}
          onClick={() => onEdit(lesson)}
          title="Edit lesson"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className={pageStyles.deleteButton}
          onClick={() => onDelete(lesson)}
          title="Delete lesson"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default LessonItem;
