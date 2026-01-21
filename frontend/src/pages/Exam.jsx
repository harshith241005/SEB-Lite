import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Timer from "../components/Timer";
import QuestionPalette from "../components/QuestionPalette";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { useExam } from "../context/ExamContext";
import { getAccessToken } from "../utils/auth";

export default function Exam() {
  const {
    exam,
    setExam,
    answers,
    updateAnswer,
    currentQuestion,
    setCurrentQuestion,
    timeRemaining, // eslint-disable-line no-unused-vars
    setTimeRemaining,
    violations,
    addViolation,
    examSubmitted, // eslint-disable-line no-unused-vars
    setExamSubmitted,
    examStarted, // eslint-disable-line no-unused-vars
    setExamStarted
  } = useExam();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [blurWarningCount, setBlurWarningCount] = useState(0);
  const navigate = useNavigate();
  const { examId } = useParams();

  const token = getAccessToken();

  // Configure axios with auth header
  const authConfig = useMemo(() => ({
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const fetchExam = useCallback(async () => {
    try {
      // Use EXAM_START endpoint to get questions
      const response = await axios.get(API_ENDPOINTS.EXAM_START(examId), authConfig);
      
      // The response contains { exam: {...}, questions: [...], progress: {...} }
      const examData = {
        ...response.data.exam,
        questions: response.data.questions || []
      };
      
      setExam(examData);
      const duration = examData.duration * 60; // Convert minutes to seconds

      // Restore progress from server if available
      if (response.data.progress) {
        const { answers: savedAnswers, timeRemaining: serverTime } = response.data.progress;
        
        // Restore answers from server
        if (savedAnswers && savedAnswers.length > 0) {
          savedAnswers.forEach(answer => {
            updateAnswer(answer.questionIndex, answer.selectedOption);
          });
        }
        
        // Use server time remaining if available
        if (serverTime && serverTime > 0) {
          setTimeRemaining(serverTime);
        } else {
          setTimeRemaining(duration);
        }
        
        setExamStarted(true);
      } else {
        setTimeRemaining(duration);
      }

      // Also check localStorage for any unsaved local progress
      const savedQuestion = localStorage.getItem(`exam_${examId}_currentQuestion`);
      if (savedQuestion) {
        const questionIndex = parseInt(savedQuestion);
        if (questionIndex >= 0 && questionIndex < examData.questions.length) {
          setCurrentQuestion(questionIndex);
        }
      }
    } catch (err) {
      setError("Failed to load exam. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [examId, authConfig, setExam, setTimeRemaining, updateAnswer, setCurrentQuestion, setExamStarted]);

  const logViolation = useCallback(async (type, description, severity) => {
    try {
      if (!exam) return;
      
      // Log to backend
      const response = await axios.post(
        API_ENDPOINTS.VIOLATIONS,
        {
          examId: exam._id || exam.id,
          violationType: type,
          severity,
          description,
          timestamp: new Date(),
          timeRemaining,
        },
        authConfig
      );

      // Log to Electron if available
      if (window.electronAPI) {
        await window.electronAPI.logViolation({
          type,
          description,
          severity
        });
      }

      addViolation({ type, severity, timestamp: new Date() });

      // Check if auto-submitted by backend due to violation limit
      if (response.data.autoSubmitted) {
        setExamSubmitted(true);
        navigate("/submitted", {
          state: {
            score: response.data.submission?.score || 0,
            passed: response.data.submission?.passed || false,
            exam: exam.title,
            violations: response.data.violationCount,
            correctAnswers: response.data.submission?.correctAnswers || 0,
            totalQuestions: response.data.submission?.totalQuestions || 0,
            autoSubmitted: true,
            reason: "Maximum violation limit exceeded"
          },
        });
        return;
      }

      // Client-side fallback check for violation limit
      const maxViolations = exam.maxViolations || 3;
      const currentViolationCount = violations.length + 1; // +1 because we just added one
      if (currentViolationCount >= maxViolations) {
        console.warn('Violation limit reached - exam will be auto-submitted');
        // Set a flag to trigger auto-submit
        setWarningMessage('Maximum violations exceeded! Exam will be auto-submitted.');
        setShowWarning(true);
      }
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
  }, [exam, authConfig, addViolation, timeRemaining, navigate, setExamSubmitted, violations]);

  const handleAnswerChange = (questionIndex, answer) => {
    updateAnswer(questionIndex, answer);
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = useCallback(async () => {
    try {
      // Build answers array with questionIndex and selectedOption
      const submissionAnswers = exam.questions.map((q, index) => ({
        questionIndex: q.questionIndex !== undefined ? q.questionIndex : index,
        selectedOption: answers[q.questionIndex !== undefined ? q.questionIndex : index],
      }));

      // Encrypt answers before submission if Electron is available
      let encryptedId = null;
      if (window.electronAPI) {
        try {
          const encryptResult = await window.electronAPI.encryptAnswers(answers);
          if (encryptResult.success) {
            encryptedId = encryptResult.id;
            console.log('Answers encrypted successfully');
          }
        } catch (encryptError) {
          console.warn('Failed to encrypt answers:', encryptError);
        }
      }

      const response = await axios.post(
        API_ENDPOINTS.SUBMIT_EXAM(exam.id || exam._id),
        {
          answers: submissionAnswers,
          encryptedId,
          violations: violations.length
        },
        authConfig
      );

      setExamSubmitted(true);

      // Stop Electron monitoring
      if (window.electronAPI) {
        await window.electronAPI.stopExamMonitoring();
      }

      // Clear saved answers and state
      const examId = exam._id || exam.id;
      localStorage.removeItem(`exam_${examId}_answers`);
      localStorage.removeItem(`exam_${examId}_timestamp`);
      localStorage.removeItem(`exam_${examId}_timeRemaining`);
      localStorage.removeItem(`exam_${examId}_currentQuestion`);

      navigate("/submitted", {
        state: {
          score: response.data.score,
          passed: response.data.passed,
          exam: exam.title,
          violations: violations.length,
          correctAnswers: response.data.correctAnswers,
          totalQuestions: response.data.totalQuestions
        },
      });
    } catch (err) {
      setError("Failed to submit exam. Please try again.");
      console.error(err);
    }
  }, [exam, answers, authConfig, setExamSubmitted, navigate, violations]);

  // Auto-submit when violations exceed limit
  useEffect(() => {
    if (!exam || examSubmitted) return;
    
    const maxViolations = exam.maxViolations || 3;
    if (violations.length >= maxViolations) {
      console.warn('Auto-submitting due to violation limit');
      handleSubmit();
    }
  }, [violations.length, exam, examSubmitted, handleSubmit]);

  // Timer effect - disabled for now
  // useEffect(() => {
  //   if (!exam || examSubmitted || timeRemaining <= 0) return;
    
  //   if (!examStarted) {
  //     setExamStarted(true);
  //     localStorage.setItem('exam_started', 'true');
  //   }

  //   const timer = setInterval(() => {
  //     setTimeRemaining((prev) => {
  //       if (prev <= 1) {
  //         handleSubmit();
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [exam, examSubmitted, handleSubmit, timeRemaining, examStarted, setExamStarted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!exam || examSubmitted) return;
      
      // Arrow key navigation
      if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        e.preventDefault();
        setCurrentQuestion(currentQuestion - 1);
      } else if (e.key === 'ArrowRight' && currentQuestion < exam.questions.length - 1) {
        e.preventDefault();
        setCurrentQuestion(currentQuestion + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [exam, currentQuestion, examSubmitted, setCurrentQuestion]);

  // Proctoring: Detect tab switch, fullscreen exit, etc.
  useEffect(() => {
    if (!exam || !examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && exam) {
        logViolation("WINDOW_BLUR", "Student switched tabs or lost focus", "medium");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam) {
        logViolation("SHORTCUT_ATTEMPT", "Student exited fullscreen mode", "high");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      // Don't log right-click as violation, just block it
      console.log('Right-click blocked during exam');
      return false;
    };

    // Prevent refresh
    const handleBeforeUnload = (e) => {
      if (examStarted && !examSubmitted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be saved.';
        return e.returnValue;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [exam, examStarted, examSubmitted, logViolation]);

  // Load exam and start monitoring when component mounts
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchExam();

    // Start Electron security monitoring when exam loads
    if (window.electronAPI && exam) {
      window.electronAPI.startExamMonitoring({
        id: examId,
        title: exam.title,
        duration: exam.duration,
        maxViolations: exam.proctoring?.maxViolations || 5
      }).then(() => {
        localStorage.setItem('exam_started', 'true');
        console.log('Exam monitoring started');

        // Listen for violations from Electron
        const cleanup = window.electronAPI.onViolationDetected((event, violation) => {
          logViolation(violation.type, violation.description, violation.severity);
        });

        // Listen for auto-submit events
        const autoSubmitCleanup = window.electronAPI.onAutoSubmit(async (event, data) => {
          console.log('Auto-submit triggered:', data);
          try {
            await handleSubmit();
            alert(`Exam auto-submitted due to: ${data.reason}`);
          } catch (error) {
            console.error('Auto-submit failed:', error);
          }
        });

        // Listen for window blur events
        const blurCleanup = window.electronAPI.onWindowBlur(() => {
          setBlurWarningCount(prev => {
            const newCount = prev + 1;
            setWarningMessage(`Warning: Window focus lost (${newCount}). This has been logged as a violation.`);
            return newCount;
          });
          setShowWarning(true);
          // Hide warning after 5 seconds
          setTimeout(() => setShowWarning(false), 5000);

          // Log violation to backend
          logViolation("WINDOW_BLUR", "Window lost focus during exam", "medium");
        });

        return () => {
          cleanup();
          autoSubmitCleanup();
          blurCleanup();
        };
      }).catch(err => {
        console.warn('Electron monitoring not available:', err);
      });
    }
  }, [token, examId, navigate, fetchExam, logViolation, handleSubmit, exam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading exam...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate("/student-dashboard")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">No exam found</div>
      </div>
    );
  }

  // Check if questions exist
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-4">No questions available for this exam</div>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  // Safety check for current question
  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* SEB Security Status Banner */}
        <div className={`rounded-xl shadow-lg p-4 mb-4 border-2 ${
          violations.length === 0 
            ? 'bg-green-50 border-green-300' 
            : violations.length < (exam.maxViolations || 3) 
              ? 'bg-yellow-50 border-yellow-400' 
              : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {violations.length === 0 ? '🔒' : violations.length < (exam.maxViolations || 3) ? '⚠️' : '🚨'}
              </span>
              <div>
                <h3 className="font-bold text-gray-800">SEB Security Monitor</h3>
                <p className="text-sm text-gray-600">
                  {violations.length === 0 
                    ? 'Exam session secure - No violations detected' 
                    : `${violations.length} violation(s) detected of ${exam.maxViolations || 3} max`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                violations.length === 0 ? 'text-green-600' : 
                violations.length < (exam.maxViolations || 3) ? 'text-yellow-600' : 'text-red-600'
              }`}>
                Violations: {violations.length}/{exam.maxViolations || 3}
              </div>
              {violations.length > 0 && violations.length < (exam.maxViolations || 3) && (
                <p className="text-xs text-yellow-700 mt-1">
                  ⚠️ {(exam.maxViolations || 3) - violations.length} warning(s) left before auto-submit
                </p>
              )}
              {violations.length >= (exam.maxViolations || 3) && (
                <p className="text-xs text-red-700 mt-1 font-bold">
                  🚨 Exam will be auto-submitted!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {exam.questions.length}
              </p>
            </div>
            <Timer 
              duration={exam.duration} 
              onTimeUp={handleSubmit} 
              initialTime={timeRemaining > 0 ? timeRemaining : null}
            />
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Palette */}
        <QuestionPalette
          totalQuestions={exam.questions.length}
          currentQuestion={currentQuestion}
          answers={answers}
          onQuestionClick={handleQuestionClick}
          questions={exam.questions}
        />

        {/* Warning Toast */}
        {showWarning && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{warningMessage}</span>
            </div>
          </div>
        )}

        {/* Violations Alert */}
        {violations.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-6 shadow-sm animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">⚠️ {violations.length} violation(s) detected</p>
                <p className="text-sm">Suspicious activity has been logged. Exam may auto-submit if violations exceed limit.</p>
              </div>
            </div>
          </div>
        )}

        {/* Question Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {question.prompt || question.question}
            </h2>
            {question.category && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                question.category === 'Java' ? 'bg-orange-100 text-orange-800' :
                question.category === 'DSA' ? 'bg-blue-100 text-blue-800' :
                question.category === 'DBMS' ? 'bg-green-100 text-green-800' :
                question.category === 'SQL' ? 'bg-purple-100 text-purple-800' :
                question.category === 'OS' ? 'bg-red-100 text-red-800' :
                question.category === 'Computer Networks' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {question.category}{question.difficulty ? ` | ${question.difficulty}` : ''}
              </span>
            )}
          </div>

          {/* MCQ Options - all questions are MCQ type */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const questionKey = question.questionIndex !== undefined ? question.questionIndex : currentQuestion;
                const isSelected = answers[questionKey] === index;
                return (
                  <label
                    key={index}
                    className={`
                      flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`question-${questionKey}`}
                      value={index}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(questionKey, index)}
                      className="mr-4 w-5 h-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className={`text-gray-700 font-medium ${isSelected ? 'text-indigo-900' : ''}`}>
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-400 disabled:bg-gray-200 text-white rounded-xl hover:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md disabled:shadow-none transform hover:scale-105 disabled:transform-none"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600 font-medium">
            Question {currentQuestion + 1} of {exam.questions.length}
          </div>

          <div className="flex gap-4">
            {currentQuestion < exam.questions.length - 1 && (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
              >
                Next →
              </button>
            )}

            {currentQuestion === exam.questions.length - 1 && (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg transform hover:scale-105"
              >
                ✓ Submit Exam
              </button>
            )}
          </div>
        </div>
        
        {/* Keyboard Navigation Hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Use ← → arrow keys to navigate between questions
        </div>
      </div>
    </div>
  );
}
