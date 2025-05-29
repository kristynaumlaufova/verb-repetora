import React from "react";
import pageStyles from "../Pages.module.css";
import lessonStyles from "./ManageLessons.module.css";
import { Lesson } from "../../../services/lessonService";

interface LessonItemProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  isSelected: boolean;
  onToggleSelect: (lessonId: number) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
}) => {
  return (
    <div
      className={`${pageStyles.item} ${
        isSelected ? lessonStyles.selected : ""
      }`}
    >
      <div className={lessonStyles.itemContent}>
        <div className={lessonStyles.selectCheckbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(lesson.id)}
            aria-label={`Select ${lesson.name}`}
          />
        </div>
        <div className={lessonStyles.itemName}>
          <span title={lesson.name}>{lesson.name}</span>
        </div>
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
