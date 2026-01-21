import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { getUser, getAccessToken, clearAuth, isAuthenticated } from "../utils/auth";

export default function StudentDashboard() {
  const [availableExams, setAvailableExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [stats, setStats] = useState({ totalAvailable: 0, totalCompleted: 0, averageScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('available');
  const navigate = useNavigate();

  const token = getAccessToken();
  const user = getUser() || {};

  // Configure axios with auth header
  const authConfig = useMemo(() => ({
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");
      const response = await axios.get(API_ENDPOINTS.EXAMS_AVAILABLE, authConfig);
      const data = response.data;

      setAvailableExams(data.available || []);
      setCompletedExams(data.completed || []);
      setStats(data.stats || { totalAvailable: 0, totalCompleted: 0, averageScore: 0 });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          clearAuth();
          navigate("/login");
        }, 2000);
      } else {
        setError("Failed to load exams. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [authConfig, navigate]);

  useEffect(() => {
    if (!token || !isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (user.role && user.role !== 'student') {
      navigate("/instructor-dashboard");
      return;
    }
    fetchDashboardData();
  }, [token, user.role, navigate, fetchDashboardData]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleTakeExam = (examId) => {
    navigate(`/exam-instructions/${examId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              fetchDashboardData();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SEB Student Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                📝
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAvailable}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                ✅
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                📊
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow">
            {[
              { id: 'available', label: 'Available Exams', icon: '📝' },
              { id: 'completed', label: 'My Results', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Available Exams</h3>
              <p className="text-sm text-gray-600">Exams you can take right now</p>
            </div>
            <div className="p-6">
              {availableExams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Exams Available</h3>
                  <p className="text-gray-500">There are no exams available for you to take at this time.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back later or contact your instructor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableExams.map((exam) => (
                    <div key={exam._id || exam.id} className="exam-card bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      {/* Status Badge */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Available
                        </span>
                        {exam.type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {exam.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title || 'Untitled Exam'}</h3>
                        {exam.company && exam.company !== 'General' && (
                          <p className="text-sm text-gray-600 mb-1"><strong>Company:</strong> {exam.company}</p>
                        )}
                        <p className="text-sm text-gray-600 mb-1"><strong>Duration:</strong> {exam.duration || 60} mins</p>
                        <p className="text-sm text-gray-600 mb-1"><strong>Questions:</strong> {exam.questionCount || exam.totalQuestions || 'N/A'}</p>
                        <p className="text-sm text-gray-600"><strong>Max Violations:</strong> {exam.maxViolations || 3}</p>
                      </div>
                      <button
                        onClick={() => handleTakeExam(exam._id || exam.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                      >
                        📝 Start Exam
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Exam Results</h3>
              <p className="text-sm text-gray-600">Your performance on completed exams</p>
            </div>
            <div className="divide-y divide-gray-200">
              {completedExams.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No exam results available yet. Complete some exams to see your results here.
                </div>
              ) : (
                completedExams.map((result, index) => (
                  <div key={result.examId || index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 mr-3">
                            {result.title || 'Exam'}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Score</p>
                            <p className="font-semibold text-gray-900">{(result.score || 0).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Correct Answers</p>
                            <p className="font-semibold text-gray-900">
                              {result.correctAnswers || 0}/{result.totalQuestions || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Grade</p>
                            <p className="font-semibold text-gray-900">{result.grade || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p className="font-semibold text-gray-900">{result.status || 'Submitted'}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted: {formatDate(result.submittedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}