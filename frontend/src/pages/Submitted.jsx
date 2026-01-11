import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Submitted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score = 0, passed = false, exam = "Exam" } = location.state || {};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">
          {passed ? "✅" : "❌"}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {passed ? "Exam Passed!" : "Exam Submitted"}
        </h1>
        <p className="text-gray-600 mb-6">
          {exam}
        </p>

        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <p className="text-gray-600 text-sm">Your Score</p>
          <p className="text-4xl font-bold text-blue-600">{score.toFixed(2)}%</p>
          <p className="text-gray-600 text-sm mt-2">
            {passed
              ? `Congratulations! You passed the exam.`
              : `You need to achieve a passing score to pass.`}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/exam")}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Take Another Exam
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
