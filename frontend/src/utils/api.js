import axios from 'axios';
import { getAccessToken, refreshAccessToken, clearAuth } from './auth';

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// API Endpoints - returns full URL
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  // Exams
  EXAMS: `${API_BASE_URL}/exam`,
  EXAMS_AVAILABLE: `${API_BASE_URL}/exam/available`,
  EXAM_BY_ID: (id) => `${API_BASE_URL}/exam/${id}`,
  EXAM_START: (id) => `${API_BASE_URL}/exam/${id}/start`,
  SUBMIT_EXAM: (id) => `${API_BASE_URL}/exam/${id}/submit`,
  EXAM_RESULTS: (id) => `${API_BASE_URL}/exam/${id}/results`,
  EXAM_IMPORT_CSV: `${API_BASE_URL}/exam/import-csv`,
  EXAM_IMPORT_URL: `${API_BASE_URL}/exam/import-url`,

  // Answers
  ANSWER_SAVE: `${API_BASE_URL}/answer/save`,
  ANSWER_SUBMIT: `${API_BASE_URL}/answer/submit`,
  ANSWER_PROGRESS: (examId) => `${API_BASE_URL}/answer/${examId}/progress`,

  // Violations
  VIOLATIONS: `${API_BASE_URL}/violation`,
  VIOLATION_STATS: `${API_BASE_URL}/violation/stats`,

  // Admin
  ADMIN_UPLOAD_EXAM: `${API_BASE_URL}/admin/upload-exam`,
  ADMIN_TOGGLE_EXAM: `${API_BASE_URL}/admin/toggle-exam`,
};

// Helper function to get full API URL (deprecated - use API_ENDPOINTS directly)
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken } = await refreshAccessToken();
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Axios default configuration (for backward compatibility)
export const axiosConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Export axios instance for use in components
export default axiosInstance;