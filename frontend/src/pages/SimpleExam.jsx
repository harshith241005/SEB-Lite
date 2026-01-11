import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SimpleExam() {
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch active exam
    axios.get("http://localhost:5001/api/exam/active")
      .then(res => {
        setExam(res.data);
        setTimeRemaining(res.data.duration * 60); // Convert minutes to seconds
        setLoading(false);
      })
      .catch(err => {
        setError("No active exam found. Please contact your instructor.");
        setLoading(false);
        console.error(err);
      });
  }, []);

  // Timer effect
  useEffect(() => {
    let timer;
    if (examStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  const selectAnswer = (qId, optionIndex) => {
    setAnswers({ ...answers, [qId]: optionIndex });
  };

  const handleSubmit = async () => {
    try {
      // Submit answers to backend
      await axios.post("http://localhost:5001/api/exam/submit", {
        examId: exam._id,
        answers: answers
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("Exam submitted successfully!");
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit exam. Please try again.");
    }
  };

  const startExam = () => {
    setExamStarted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading exam...</p></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  if (!exam) return <div className="flex justify-center items-center h-screen"><p>No exam available</p></div>;

  if (!examStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">{exam.title}</h1>
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">Duration: {exam.duration} minutes</p>
            <p className="text-gray-600 mb-2">Questions: {exam.questions.length}</p>
            <p className="text-gray-600">Max Violations: {exam.maxViolations || 3}</p>
          </div>
          <button
            onClick={startExam}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-mono bg-red-100 px-3 py-1 rounded">
              Time: {formatTime(timeRemaining)}
            </span>
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Question Palette */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Questions</h3>
              <div className="grid grid-cols-3 gap-2">
                {exam.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`p-2 rounded text-sm font-medium ${
                      currentQuestion === index
                        ? 'bg-blue-500 text-white'
                        : answers[exam.questions[index].id] !== undefined
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Display */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Question {currentQuestion + 1} of {exam.questions.length}
                </h2>
                <p className="text-gray-800 text-lg">{question.question}</p>
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(question.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      answers[question.id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === exam.questions.length - 1}
                  className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}