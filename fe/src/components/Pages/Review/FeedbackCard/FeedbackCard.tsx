import React, { useEffect, useRef } from "react";
import styles from "./FeedbackCard.module.css";
import { Word } from "../../../../services/wordService";
import { WordType } from "../../../../services/wordTypeService";

interface FeedbackCardProps {
  currentWord: Word;
  currentWordType: WordType;
  fieldAnswers: { [fieldName: string]: string };
  isCorrect: boolean | null;
  onNext: () => void;
  getFieldNames: () => string[];
  isLastWord: boolean;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  currentWord,
  currentWordType,
  fieldAnswers,
  isCorrect,
  onNext,
  getFieldNames,
  isLastWord,
}) => {
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isCorrect !== null && nextButtonRef.current) {
      // Add a small delay before focusing the button to prevent immediate Enter key processing
      const focusTimeout = setTimeout(() => {
        if (nextButtonRef.current) {
          nextButtonRef.current.focus();
        }
      }, 100);

      return () => {
        clearTimeout(focusTimeout);
      };
    }
  }, [isCorrect]);

  return (
    <div className={styles.feedbackCardContainer}>
      <div className={styles.wordCard}>
        <div className={styles.wordType}>{currentWordType.name}</div>
        <div className={styles.wordKeyword}>{currentWord.keyword}</div>
        <div className={styles.scrollableContent}>
          <div className={styles.wordDetails}>
            {getFieldNames().map((fieldName, index) => {
              const expectedValue = currentWord.fields.split(";")[index];
              const userValue = fieldAnswers[fieldName] || "";
              const isIncorrect =
                userValue.toLowerCase().trim() !==
                expectedValue.toLowerCase().trim();

              return (
                <div key={fieldName} className={styles.fieldDetail}>
                  {fieldName}: {expectedValue}
                  {isIncorrect && (
                    <div className={styles.yourAnswer}>
                      Your answer: {userValue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {isCorrect !== null && (
            <div
              className={
                isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
              }
            >
              {isCorrect ? "Correct!" : "Incorrect!"}
            </div>
          )}
          <div className={styles.buttonGroup}>
            <button
              className={styles.nextButton}
              onClick={onNext}
              ref={nextButtonRef}
            >
              {isLastWord ? "Finish" : "Next Word"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;
