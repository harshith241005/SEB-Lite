import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ExamProvider } from "./context/ExamContext";
import Login from "./pages/Login";
import Exam from "./pages/Exam";
import ExamInstructions from "./pages/ExamInstructions";
import Submitted from "./pages/Submitted";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CreateExam from "./pages/CreateExam";
import "./index.css";

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

  // Role-based redirect component
  const RoleBasedRedirect = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (user.role === 'instructor' || user.role === 'admin') {
      return <Navigate to="/instructor-dashboard" replace />;
    } else {
      return <Navigate to="/student-dashboard" replace />;
    }
  };

  return (
    <ExamProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/exam-instructions/:examId" element={<ExamInstructions />} />
          <Route path="/exam/:examId" element={<Exam />} />
          <Route path="/submitted" element={<Submitted />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/" element={<RoleBasedRedirect />} />
        </Routes>
      </Router>
    </ExamProvider>
  );
}

export default App;
