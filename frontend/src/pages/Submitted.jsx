import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Submitted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    score = 0, 
    passed = false, 
    exam = "Exam",
    violations = 0,
    totalQuestions = 0,
    correctAnswers = 0
  } = location.state || {};

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getGrade = () => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${passed ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600'} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl text-center">
        <div className="text-6xl mb-4">
          {passed ? "🎉" : "📝"}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {passed ? "Congratulations! Exam Passed!" : "Exam Completed"}
        </h1>
        <p className="text-gray-600 mb-6 text-lg">
          {exam}
        </p>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 mb-6 border-2 border-blue-200">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium">Your Score</p>
              <p className={`text-5xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {score.toFixed(1)}%
              </p>
              <p className={`text-2xl font-bold mt-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                Grade: {getGrade()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Performance</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {correctAnswers}/{totalQuestions}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Correct Answers
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-left">
              <p className="text-gray-500 font-medium">Status:</p>
              <p className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'PASSED ✓' : 'REQUIRES IMPROVEMENT'}
              </p>
            </div>
            <div className="text-left">
              <p className="text-gray-500 font-medium">Violations:</p>
              <p className={`font-bold ${violations > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {violations} detected
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className={`${passed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border-2 rounded-lg p-4 mb-6`}>
          <p className={`${passed ? 'text-green-800' : 'text-orange-800'} font-medium`}>
            {passed
              ? `Excellent work! You have successfully passed the exam with a score of ${score.toFixed(1)}%.`
              : `Your score of ${score.toFixed(1)}% did not meet the passing criteria. Keep practicing and try again!`}
          </p>
          {violations > 0 && (
            <p className="text-orange-700 text-sm mt-2">
              ⚠️ Note: {violations} security violation(s) were detected during your exam.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBackToDashboard}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
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
