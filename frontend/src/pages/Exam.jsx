import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Timer from "../components/Timer";
import QuestionPalette from "../components/QuestionPalette";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { useExam } from "../context/ExamContext";

export default function Exam() {
  const {
    exam,
    setExam,
    answers,
    updateAnswer,
    currentQuestion,
    setCurrentQuestion,
    timeRemaining,
    setTimeRemaining,
    violations,
    addViolation,
    examSubmitted,
    setExamSubmitted,
    examStarted,
    setExamStarted
  } = useExam();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [blurWarningCount, setBlurWarningCount] = useState(0);
  const navigate = useNavigate();
  const { examId } = useParams();

  const token = localStorage.getItem("token");

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
      const response = await axios.get(API_ENDPOINTS.EXAM_BY_ID(examId) + '/start', authConfig);
      setExam(response.data);
      const duration = response.data.duration * 60; // Convert minutes to seconds

      // Load saved state if available
      const savedAnswers = localStorage.getItem(`exam_${examId}_answers`);
      const savedTimestamp = localStorage.getItem(`exam_${examId}_timestamp`);
      const savedTime = localStorage.getItem(`exam_${examId}_timeRemaining`);
      const savedQuestion = localStorage.getItem(`exam_${examId}_currentQuestion`);

      if (savedAnswers && savedTimestamp) {
        const timeSinceSave = Date.now() - parseInt(savedTimestamp);
        // Only restore if saved within last 24 hours
        if (timeSinceSave < 24 * 60 * 60 * 1000) {
          // Restore answers
          const parsedAnswers = JSON.parse(savedAnswers);
          Object.keys(parsedAnswers).forEach(key => {
            updateAnswer(key, parsedAnswers[key]);
          });

          // Restore time and question if valid
          if (savedTime) {
            const remaining = parseInt(savedTime);
            if (remaining > 0 && remaining <= duration) {
              setTimeRemaining(remaining);
            } else {
              setTimeRemaining(duration);
            }
          } else {
            setTimeRemaining(duration);
          }

          if (savedQuestion) {
            const questionIndex = parseInt(savedQuestion);
            if (questionIndex >= 0 && questionIndex < response.data.questions.length) {
              setCurrentQuestion(questionIndex);
            }
          }

          setExamStarted(true);
        } else {
          // Clear old data
          localStorage.removeItem(`exam_${examId}_answers`);
          localStorage.removeItem(`exam_${examId}_timestamp`);
          localStorage.removeItem(`exam_${examId}_timeRemaining`);
          localStorage.removeItem(`exam_${examId}_currentQuestion`);
          setTimeRemaining(duration);
        }
      } else {
        setTimeRemaining(duration);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.error || "This exam is not available or you have already attempted it.");
      } else {
        setError("Failed to load exam. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [examId, authConfig, setExam, setTimeRemaining, updateAnswer, setCurrentQuestion, setExamStarted]);

  const logViolation = useCallback(async (type, description, severity) => {
    try {
      // Log to backend
      await axios.post(
        API_ENDPOINTS.VIOLATIONS,
        {
          examId: exam._id,
          violationType: type,
          severity,
          description,
          timestamp: new Date(),
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
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
  }, [exam, authConfig, addViolation]);

  const handleAnswerChange = (questionId, answer) => {
    updateAnswer(questionId, answer);
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = useCallback(async () => {
    try {
      const submissionAnswers = exam.questions.map((q) => ({
        questionId: q.questionId,
        answer: answers[q.questionId] || "",
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
        API_ENDPOINTS.SUBMIT_EXAM(exam._id),
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
          totalQuestions: response.data.totalQuestions || exam.questions.length,
          correctAnswers: response.data.correctAnswers || 0
        },
      });
    } catch (err) {
      setError("Failed to submit exam. Please try again.");
      console.error(err);
    }
  }, [exam, answers, authConfig, setExamSubmitted, navigate, violations]);

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

  // Auto-save answers every 10 seconds
  useEffect(() => {
    if (!exam || !examStarted || examSubmitted) return;

    const autoSaveInterval = setInterval(() => {
      try {
        localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
        localStorage.setItem(`exam_${examId}_timestamp`, Date.now().toString());
        localStorage.setItem(`exam_${examId}_timeRemaining`, timeRemaining.toString());
        localStorage.setItem(`exam_${examId}_currentQuestion`, currentQuestion.toString());
        console.log('Auto-saved answers at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [exam, examId, answers, timeRemaining, currentQuestion, examStarted, examSubmitted]);

  // Proctoring: Detect tab switch, fullscreen exit, etc.
  useEffect(() => {
    if (!exam || !examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && exam) {
        logViolation("tab_switch", "Student switched tabs", "high");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam) {
        logViolation("fullscreen_exit", "Student exited fullscreen", "high");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation("right_click", "Right-click attempted", "low");
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
          setBlurWarningCount(prev => prev + 1);
          setWarningMessage(`Warning: Window focus lost (${blurWarningCount + 1}). This has been logged as a violation.`);
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

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {exam.questions.length}
              </p>
            </div>
            <Timer duration={exam.duration} onTimeUp={handleSubmit} />
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
              {question.question}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              question.category === 'Java' ? 'bg-orange-100 text-orange-800' :
              question.category === 'DSA' ? 'bg-blue-100 text-blue-800' :
              question.category === 'DBMS' ? 'bg-green-100 text-green-800' :
              question.category === 'SQL' ? 'bg-purple-100 text-purple-800' :
              question.category === 'OS' ? 'bg-red-100 text-red-800' :
              question.category === 'Computer Networks' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {question.category} | {question.difficulty}
            </span>
          </div>

          {question.questionType === "mcq" && (
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = answers[question.questionId] === option;
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
                      name={`question-${question.questionId}`}
                      value={option}
                      checked={isSelected}
                      onChange={(e) =>
                        handleAnswerChange(question.questionId, e.target.value)
                      }
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

          {(question.questionType === "short_answer" ||
            question.questionType === "essay") && (
            <textarea
              value={answers[question.questionId] || ""}
              onChange={(e) =>
                handleAnswerChange(question.questionId, e.target.value)
              }
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
              placeholder="Enter your answer here..."
              rows={question.questionType === "essay" ? 8 : 4}
            />
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
