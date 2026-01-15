import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { getUser, getAccessToken, clearAuth } from "../utils/auth";

export default function InstructorDashboard() {
  const [exams, setExams] = useState([]);
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');
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
      const [examsRes, violationsRes, statsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.EXAMS, authConfig),
        axios.get(`${API_ENDPOINTS.VIOLATIONS}?limit=10`, authConfig),
        axios.get(`${API_ENDPOINTS.VIOLATION_STATS}?timeframe=24h`, authConfig)
      ]);

      setExams(examsRes.data?.exams || examsRes.data || []);
      setViolations(violationsRes.data?.violations || violationsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  useEffect(() => {
    if (!token || (user.role && !['instructor', 'admin'].includes(user.role))) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user.role, navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
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
        <div className="text-xl font-semibold text-gray-700">Loading dashboard...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">SEB Instructor Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                📝
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                👥
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exams.reduce((acc, exam) => acc + exam.enrolledStudents, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                ⚠️
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Violations (24h)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                🚨
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats?.find(s => s.severity === 'high')?.totalCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow">
            {[
              { id: 'exams', label: 'My Exams', icon: '📝' },
              { id: 'violations', label: 'Recent Violations', icon: '⚠️' },
              { id: 'create', label: 'Create Exam', icon: '➕' }
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
        {activeTab === 'exams' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Exams</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {exams.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No exams created yet. Click "Create Exam" to get started.
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam._id || exam.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{exam.title}</h4>
                        <p className="text-sm text-gray-500">
                          {exam.totalQuestions} questions • {exam.duration} min • {exam.enrolledStudents} enrolled
                        </p>
                        <p className="text-xs text-gray-400">
                          Status: {exam.status} • Created: {formatDate(exam.createdAt)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // Toggle exam active status
                            const toggleActive = async () => {
                              try {
                                const token = localStorage.getItem("token");
                                await axios.put(
                                  `${API_ENDPOINTS.EXAMS}/${exam._id || exam.id}`,
                                  { isActive: !exam.isActive },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                fetchDashboardData();
                              } catch (err) {
                                console.error('Failed to toggle exam status:', err);
                              }
                            };
                            toggleActive();
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            exam.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {exam.isActive ? '✓ Active' : 'Inactive'}
                        </button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50">
                          View Results
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-gray-50">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Violations</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {violations.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No violations detected in the last 24 hours.
                </div>
              ) : (
                violations.map((violation) => (
                  <div key={violation._id || violation.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            violation.severity === 'high' ? 'bg-red-100 text-red-800' :
                            violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {violation.severity}
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {violation.violationType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {violation.student?.name} ({violation.student?.email})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(violation.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{violation.description}</p>
                        {violation.exam && (
                          <p className="text-xs text-gray-500">{violation.exam.title}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Exam</h3>
            <p className="text-gray-600 mb-6">
              Use the exam creation interface to build comprehensive assessments with security monitoring.
            </p>
            <button
              onClick={() => navigate('/create-exam')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Start Creating Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}