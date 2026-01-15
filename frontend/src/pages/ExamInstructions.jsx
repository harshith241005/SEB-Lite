import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { getAccessToken, getUser } from "../utils/auth";

export default function ExamInstructions() {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [canStart, setCanStart] = useState(false);
  const navigate = useNavigate();
  const { examId } = useParams();

  const token = getAccessToken();
  const user = getUser() || {};

  const authConfig = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!token || (user.role && user.role !== 'student')) {
      navigate("/login");
      return;
    }

    const fetchExam = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.EXAM_BY_ID(examId), authConfig);
        setExam(response.data);
      } catch (err) {
        setError("Failed to load exam. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, token, user.role, navigate]);

  useEffect(() => {
    if (canStart && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (canStart && countdown === 0) {
      navigate(`/exam/${examId}`);
    }
  }, [canStart, countdown, examId, navigate]);

  const handleStartExam = () => {
    setCanStart(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading exam instructions...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <p className="text-red-600 font-semibold">{error || "Exam not found"}</p>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          {exam.title}
        </h1>
        <p className="text-center text-gray-600 mb-8">{exam.description || "Exam Instructions"}</p>

        {canStart ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{countdown}</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Exam starting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <p className="text-gray-600">Please prepare yourself. The exam will begin automatically.</p>
          </div>
        ) : (
          <>
            {/* Exam Details */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-900">{exam.duration} minutes</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Questions:</span>
                  <span className="ml-2 text-gray-900">{exam.questions?.length || exam.totalQuestions}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Passing Percentage:</span>
                  <span className="ml-2 text-gray-900">{exam.passingPercentage}%</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Max Violations:</span>
                  <span className="ml-2 text-gray-900">{exam.maxViolations}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Important Instructions</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>This exam is monitored for security. Any suspicious activity will be logged and may result in disqualification.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Do not switch tabs, minimize the window, or use keyboard shortcuts (Ctrl+C, Alt+Tab, etc.).</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>The exam will automatically submit when time expires or if you exceed the violation limit.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Your answers are auto-saved as you progress through the exam.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">5.</span>
                  <span>You cannot return to previous questions once you move forward (if applicable).</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">6.</span>
                  <span>Ensure you have a stable internet connection before starting.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">7.</span>
                  <span>Close all other applications before starting the exam.</span>
                </li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">🔒 Security Monitoring Active</h3>
              <p className="text-sm text-red-800">
                This exam uses SEB-Lite secure browser technology. The following activities are monitored:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Window focus and tab switching</li>
                <li>Keyboard shortcuts and copy-paste attempts</li>
                <li>Right-click and context menu usage</li>
                <li>Fullscreen exit attempts</li>
                <li>Multiple monitor detection</li>
                <li>System-level security events</li>
              </ul>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={handleStartExam}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-200 shadow-lg"
              >
                I Understand - Start Exam
              </button>
              <p className="text-sm text-gray-600 mt-4">
                By clicking "Start Exam", you agree to the terms and conditions of this secure examination.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
