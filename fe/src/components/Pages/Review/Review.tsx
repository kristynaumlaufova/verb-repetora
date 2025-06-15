import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReviewManager } from "../../../hooks/useReviewManager";
import ReviewError from "./ReviewError/ReviewError";
import NoWordsAvailable from "./NoWordsAvailable/NoWordsAvailable";
import ReviewLoading from "./ReviewLoading/ReviewLoading";
import ReviewSessionComponent from "./ReviewSession/ReviewSession";

interface ReviewLocationState {
  lessonIds: number[];
  type: "all" | "recommended";
  languageId?: number;
}

const Review: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReviewLocationState;
  const [fieldAnswers, setFieldAnswers] = useState<{
    [fieldName: string]: string;
  }>({});
  const {
    isLoading,
    error,
    loadReviewData,
    reviewSession,
    initReviewSession,
    isChecking,
    isCorrect,
    isComplete,
    getCurrentWord,
    getCurrentWordType,
    checkAnswer,
    nextQuestion,
    completeSession,
  } = useReviewManager(state.type);

  // Initialize review session when component mounts
  useEffect(() => {
    if (!state) {
      navigate("/lessons", { replace: true });
      return;
    }

    const initializeReview = async () => {
      try {
        const data = await loadReviewData(state.lessonIds || []);

        if (data) {
          initReviewSession(data);
        }
      } catch (error) {
        console.error("Failed to initialize review session:", error);
      }
    };

    initializeReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, navigate]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldAnswers((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const getFieldNames = (): string[] => {
    const wordType = getCurrentWordType();
    if (!wordType || !wordType.fields) return [];

    return wordType.fields.split(";").filter((field) => field.trim() !== "");
  };

  const resetFieldAnswers = () => {
    setFieldAnswers({});
  };

  const areAllFieldsAnswered = (): boolean => {
    const fieldNames = getFieldNames();
    return fieldNames.every(
      (field) =>
        fieldAnswers[field] !== undefined && fieldAnswers[field].trim() !== ""
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isChecking && areAllFieldsAnswered()) {
        handleCheck();
      }
    }
  };

  const handleGiveUp = () => {
    const currentWord = getCurrentWord();
    const fieldNames = getFieldNames();

    if (currentWord) {
      const correctFields = currentWord.fields.split(";");
      const newFieldAnswers: { [key: string]: string } = {};

      fieldNames.forEach((field, index) => {
        newFieldAnswers[field] = correctFields[index] || "";
      });

      setFieldAnswers(newFieldAnswers);

      checkAnswer("", state.type);
    }
  };

  const handleBackClick = () => {
    if (reviewSession) {
      completeSession();
    } else {
      navigate("/lessons");
    }
  };

  const handleFinish = () => {
    navigate("/lessons");
  };

  const handleCheck = () => {
    // Convert field answers to semicolon-separated string
    const fieldNames = getFieldNames();
    const answersArray = fieldNames.map((field) => fieldAnswers[field] || "");
    const answersString = answersArray.join(";");

    checkAnswer(answersString, state.type);
  };

  // Move to next question
  const handleNext = () => {
    nextQuestion(state.type);
    resetFieldAnswers();
  };
  // Render the loading state
  if (isLoading) {
    return <ReviewLoading />;
  }
  // Display an error message if something went wrong
  if (error) {
    return <ReviewError error={error} onBackClick={handleFinish} />;
  }
  // Render the no words review page
  const currentWord = getCurrentWord();
  const currentWordType = getCurrentWordType();
  if (!currentWord || !currentWordType || !reviewSession) {
    return (
      <NoWordsAvailable
        isComplete={isComplete}
        onBackClick={handleFinish}
        reviewSession={reviewSession}
        reviewType={state.type}
      />
    );
  }

  // Render review session
  return (
    <ReviewSessionComponent
      reviewSession={reviewSession}
      currentWord={currentWord}
      currentWordType={currentWordType}
      isChecking={isChecking}
      isCorrect={isCorrect}
      isComplete={isComplete}
      fieldAnswers={fieldAnswers}
      reviewType={state.type}
      onFieldChange={handleFieldChange}
      onCheck={handleCheck}
      onGiveUp={handleGiveUp}
      onKeyDown={handleKeyDown}
      onNext={handleNext}
      onBackClick={handleBackClick}
      onFinish={handleFinish}
      getFieldNames={getFieldNames}
      areAllFieldsAnswered={areAllFieldsAnswered()}
    />
  );
};

export default Review;
