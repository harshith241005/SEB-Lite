import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
      const [examsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.EXAMS_AVAILABLE, authConfig)
      ]);

      setExams(examsRes.data || []);

      // Fetch results for completed exams
      const completedExams = examsRes.data.filter(exam => exam.hasCompleted);
      const resultsPromises = completedExams.map(exam =>
        axios.get(API_ENDPOINTS.EXAM_RESULTS(exam._id), authConfig).catch(() => null)
      );

      const resultsData = await Promise.all(resultsPromises);
      setResults(resultsData.filter(r => r).map(r => r.data));

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  useEffect(() => {
    if (!token || user.role !== 'student') {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [token, user.role, navigate, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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

  const getExamStatus = (exam) => {
    if (exam.hasCompleted) return 'completed';
    if (exam.canTake) return 'available';
    if (exam.isActive) return 'enrolled';
    return 'upcoming';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'enrolled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading dashboard...</div>
      </div>
    );
  }

  const availableExams = exams.filter(exam => getExamStatus(exam) === 'available');
  const completedExams = exams.filter(exam => exam.hasCompleted);

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
                <p className="text-2xl font-bold text-gray-900">{availableExams.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedExams.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {results.length > 0
                    ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1)
                    : 0
                  }%
                </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map((exam) => (
                  <div key={exam._id || exam.id} className="exam-card bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h3>
                      <p className="text-sm text-gray-600 mb-1"><strong>Company:</strong> {exam.company}</p>
                      <p className="text-sm text-gray-600 mb-1"><strong>Type:</strong> {exam.type}</p>
                      <p className="text-sm text-gray-600"><strong>Duration:</strong> {exam.duration} mins</p>
                    </div>
                    <button
                      onClick={() => handleTakeExam(exam._id || exam.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
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
              {results.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No exam results available yet. Complete some exams to see your results here.
                </div>
              ) : (
                results.map((result) => (
                  <div key={result.exam} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 mr-3">
                            {result.exam?.title || 'Exam'}
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
                            <p className="font-semibold text-gray-900">{result.score.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Correct Answers</p>
                            <p className="font-semibold text-gray-900">
                              {result.correctAnswers}/{result.totalQuestions}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Grade</p>
                            <p className="font-semibold text-gray-900">{result.grade}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time Taken</p>
                            <p className="font-semibold text-gray-900">
                              {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted: {formatDate(result.submittedAt)}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
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