import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ExamContext = createContext();

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save answers
  useEffect(() => {
    if (!autoSaveEnabled || !exam || examSubmitted) return;

    const saveInterval = setInterval(() => {
      const examId = exam._id || exam.id;
      if (examId) {
        localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
        localStorage.setItem(`exam_${examId}_timestamp`, Date.now().toString());
        localStorage.setItem(`exam_${examId}_currentQuestion`, currentQuestion.toString());
        localStorage.setItem(`exam_${examId}_timeRemaining`, timeRemaining.toString());
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [answers, exam, currentQuestion, timeRemaining, autoSaveEnabled, examSubmitted]);

  const updateAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer };
      return newAnswers;
    });
  }, []);

  const addViolation = useCallback((violation) => {
    setViolations(prev => [...prev, violation]);
  }, []);

  const resetExam = useCallback(() => {
    setExam(null);
    setAnswers({});
    setCurrentQuestion(0);
    setTimeRemaining(0);
    setViolations([]);
    setExamStarted(false);
    setExamSubmitted(false);
    localStorage.removeItem('currentExamId');
    localStorage.removeItem('exam_answers');
    localStorage.removeItem('currentQuestion');
    localStorage.removeItem('exam_timeRemaining');
    localStorage.removeItem('exam_started');
  }, []);

  const value = {
    exam,
    setExam,
    answers,
    updateAnswer,
    setAnswers,
    currentQuestion,
    setCurrentQuestion,
    timeRemaining,
    setTimeRemaining,
    violations,
    addViolation,
    examStarted,
    setExamStarted,
    examSubmitted,
    setExamSubmitted,
    autoSaveEnabled,
    setAutoSaveEnabled,
    resetExam
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};
