import React, { useEffect, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ExamProvider } from "./context/ExamContext";
import { getAccessToken, getUser, isAuthenticated } from "./utils/auth";
import Login from "./pages/Login";
import Exam from "./pages/Exam";
import ExamInstructions from "./pages/ExamInstructions";
import Submitted from "./pages/Submitted";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CreateExam from "./pages/CreateExam";
import "./index.css";

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getAccessToken();
  const user = getUser() || {};

  if (!token || !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'instructor' || user.role === 'admin') {
      return <Navigate to="/instructor-dashboard" replace />;
    }
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
};

function App() {
  // Enter fullscreen on app load for security
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen request failed (may be normal in dev):", err);
      }
    };

    // Only enter fullscreen after user interaction
    const handleFirstInteraction = async () => {
      await enterFullscreen();
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    return () => document.removeEventListener("click", handleFirstInteraction);
  }, []);

  // Prevent copy, paste, and other unsafe operations
  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, F12, etc.
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("keydown", preventKeyboardShortcuts);

    return () => {
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, []);

  // Role-based redirect component - uses proper auth utilities
  const RoleBasedRedirect = () => {
    // Use proper auth utilities instead of direct localStorage access
    const token = getAccessToken();
    const user = getUser() || {};

    if (!token || !isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    if (user.role === 'instructor' || user.role === 'admin') {
      return <Navigate to="/instructor-dashboard" replace />;
    } else {
      return <Navigate to="/student-dashboard" replace />;
    }
  };

  return (
    <ErrorBoundary>
      <ExamProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Student routes */}
            <Route path="/student-dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/exam-instructions/:examId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamInstructions />
              </ProtectedRoute>
            } />
            <Route path="/exam/:examId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Exam />
              </ProtectedRoute>
            } />
            <Route path="/submitted" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Submitted />
              </ProtectedRoute>
            } />
            
            {/* Instructor/Admin routes */}
            <Route path="/instructor-dashboard" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/create-exam" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CreateExam />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Router>
      </ExamProvider>
    </ErrorBoundary>
  );
}

export default App;
