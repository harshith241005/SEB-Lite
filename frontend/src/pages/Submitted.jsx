import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";
import { useExam } from "../context/ExamContext";

export default function Submitted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetExam } = useExam();
  
  const { 
    score = 0, 
    passed = false, 
    exam = "Exam", 
    violations = 0,
    autoSubmitted = false,
    reason = "",
    correctAnswers = 0,
    totalQuestions = 0
  } = location.state || {};

  // Reset exam context on mount
  useEffect(() => {
    resetExam();
  }, [resetExam]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className={`min-h-screen ${passed ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-orange-400 to-red-500'} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
        {/* Auto-submit warning banner */}
        {autoSubmitted && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <span className="text-2xl mr-2">🚨</span>
              <div>
                <p className="text-red-800 font-semibold">Exam Auto-Submitted</p>
                <p className="text-red-600 text-sm">{reason || "Security violation limit exceeded"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-6xl mb-4">
          {passed ? "🎉" : "📝"}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {passed ? "Congratulations! You Passed!" : "Exam Submitted"}
        </h1>
        <p className="text-gray-600 mb-6">
          {exam}
        </p>

        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <p className="text-gray-600 text-sm">Your Score</p>
          <p className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-blue-600'}`}>
            {typeof score === 'number' ? score.toFixed(1) : score}%
          </p>
          {totalQuestions > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              {correctAnswers} correct out of {totalQuestions} questions
            </p>
          )}
          <p className="text-gray-600 text-sm mt-2">
            {passed
              ? `Great job! You have successfully passed the exam.`
              : `Keep practicing and try again!`}
          </p>
        </div>

        {/* Violations section */}
        {violations > 0 && (
          <div className={`${violations >= 3 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4 mb-6`}>
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">⚠️</span>
              <p className={`${violations >= 3 ? 'text-red-800' : 'text-yellow-800'} text-sm font-medium`}>
                {violations} violation(s) were recorded during your exam
              </p>
            </div>
            <p className={`${violations >= 3 ? 'text-red-600' : 'text-yellow-600'} text-xs mt-2`}>
              Violations are logged and may affect your exam evaluation.
            </p>
          </div>
        )}

        {/* No violations - clean exam */}
        {violations === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">✅</span>
              <p className="text-green-800 text-sm font-medium">
                Clean exam - No security violations detected
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
