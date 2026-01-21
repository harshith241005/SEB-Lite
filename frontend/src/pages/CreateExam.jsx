import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, axiosConfig } from "../utils/api";
import { getAccessToken } from "../utils/auth";

export default function CreateExam() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    passingPercentage: 60,
    startTime: '',
    endTime: '',
    instructions: '',
    course: '',
    subject: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    explanation: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('file'); // 'file', 'url', 'csv'
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importDuration, setImportDuration] = useState(60);
  const [importPassingPercentage, setImportPassingPercentage] = useState(60);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const token = getAccessToken();

  // Configure axios with auth header
  const authConfig = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addQuestion = () => {
    // Validate question
    if (!currentQuestion.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.questionType === 'mcq') {
      if (currentQuestion.options.some(opt => !opt.trim())) {
        setError('All options must be filled for MCQ questions');
        return;
      }
      if (!currentQuestion.correctAnswer) {
        setError('Correct answer must be selected for MCQ questions');
        return;
      }
    } else if (!currentQuestion.correctAnswer.trim()) {
      setError('Correct answer is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }));

    // Reset current question
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      explanation: ''
    });

    setError('');
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!importTitle.trim()) {
      setError('Please enter an exam title before importing');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('title', importTitle);
      formDataUpload.append('duration', importDuration.toString());
      formDataUpload.append('passingPercentage', importPassingPercentage.toString());

      const currentToken = getAccessToken();
      await axios.post(
        API_ENDPOINTS.EXAM_IMPORT_CSV,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      setSuccess('Exam imported successfully!');
      setShowImportModal(false);
      resetImportForm();
      setTimeout(() => {
        navigate('/instructor-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import exam file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!importTitle.trim()) {
      setError('Please enter an exam title');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const currentToken = getAccessToken();
      await axios.post(
        API_ENDPOINTS.EXAM_IMPORT_URL,
        {
          url: importUrl,
          title: importTitle,
          duration: importDuration,
          passingPercentage: importPassingPercentage,
        },
        {
          headers: {
            ...axiosConfig.headers,
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      setSuccess('Exam imported successfully from URL!');
      setShowImportModal(false);
      resetImportForm();
      setTimeout(() => {
        navigate('/instructor-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import exam from URL');
    } finally {
      setLoading(false);
    }
  };

  const resetImportForm = () => {
    setImportUrl('');
    setImportTitle('');
    setImportDuration(60);
    setImportPassingPercentage(60);
    setImportType('file');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Exam title is required');
      }
      if (formData.questions.length === 0) {
        throw new Error('At least one question is required');
      }
      if (!formData.startTime || !formData.endTime) {
        throw new Error('Start and end times are required');
      }

      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (startTime >= endTime) {
        throw new Error('End time must be after start time');
      }

      // Format questions with questionId
      const formattedQuestions = formData.questions.map((q, index) => ({
        questionId: q.questionId || `q${index + 1}`,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1,
        explanation: q.explanation || ""
      }));

      const examData = {
        ...formData,
        questions: formattedQuestions,
        totalQuestions: formattedQuestions.length
      };

      await axios.post(API_ENDPOINTS.EXAMS, examData, authConfig);

      setSuccess('Exam created successfully!');
      setTimeout(() => {
        navigate('/instructor-dashboard');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/instructor-dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center font-medium"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
              <p className="text-gray-600 mt-2">Build comprehensive assessments with secure monitoring</p>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
            >
              📥 Import Exam
            </button>
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Exam</h2>
              
              {/* Import Type Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setImportType('file')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    importType === 'file'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📁 File Upload
                </button>
                <button
                  onClick={() => setImportType('url')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    importType === 'url'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🔗 Import from URL
                </button>
              </div>

              {/* Common Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter exam title"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={importDuration}
                      onChange={(e) => setImportDuration(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="5"
                      max="480"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing %
                    </label>
                    <input
                      type="number"
                      value={importPassingPercentage}
                      onChange={(e) => setImportPassingPercentage(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              {importType === 'file' && (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4 text-sm">
                    Upload a CSV or JSON file with questions.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">CSV Format:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
{`question,option1,option2,option3,option4,correct_answer,category,difficulty
"What is 2+2?",2,3,4,5,3,Math,easy
"Capital of France?",London,Paris,Berlin,Madrid,2,Geography,medium`}
                    </pre>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">JSON Format:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
{`{
  "questions": [
    {
      "prompt": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctOptionIndex": 1
    }
  ]
}`}
                    </pre>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    onChange={handleFileImport}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              )}

              {/* URL Import Section */}
              {importType === 'url' && (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4 text-sm">
                    Import questions from a URL (JSON or CSV). Great for using shared question banks!
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">💡 Example Sources:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• GitHub raw file URLs</li>
                      <li>• Google Sheets (published as CSV)</li>
                      <li>• Any public JSON/CSV endpoint</li>
                    </ul>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/questions.json"
                      required
                    />
                  </div>
                  
                  <button
                    onClick={handleUrlImport}
                    disabled={loading || !importUrl || !importTitle}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Importing...
                      </>
                    ) : (
                      '🔗 Import from URL'
                    )}
                  </button>
                </div>
              )}

              {/* Error in Modal */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImportForm();
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science Final Exam"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="5"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Percentage *
                </label>
                <input
                  type="number"
                  name="passingPercentage"
                  value={formData.passingPercentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CS101"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the exam..."
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduling</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions for students taking the exam..."
            />
          </div>

          {/* Questions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>

            {/* Current Question Form */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    name="questionText"
                    value={currentQuestion.questionText}
                    onChange={handleQuestionChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your question..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type *
                    </label>
                    <select
                      name="questionType"
                      value={currentQuestion.questionType}
                      onChange={handleQuestionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks *
                    </label>
                    <input
                      type="number"
                      name="marks"
                      value={currentQuestion.marks}
                      onChange={handleQuestionChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {currentQuestion.questionType === 'mcq' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={option}
                          checked={currentQuestion.correctAnswer === option}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                          className="mr-2"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {(currentQuestion.questionType === 'short_answer' || currentQuestion.questionType === 'essay') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    <textarea
                      name="correctAnswer"
                      value={currentQuestion.correctAnswer}
                      onChange={handleQuestionChange}
                      rows={currentQuestion.questionType === 'essay' ? 3 : 2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the correct answer..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <textarea
                    name="explanation"
                    value={currentQuestion.explanation}
                    onChange={handleQuestionChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Explanation for the correct answer..."
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Questions Added ({formData.questions.length})</h3>
              {formData.questions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No questions added yet</p>
              ) : (
                formData.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-2">
                            Q{index + 1}
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {question.questionType} • {question.marks} marks
                          </span>
                        </div>
                        <p className="text-gray-900 mb-2">{question.questionText}</p>
                        {question.questionType === 'mcq' && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">Options:</p>
                            <ul className="list-disc list-inside ml-4">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className={option === question.correctAnswer ? 'font-semibold text-green-600' : ''}>
                                  {option} {option === question.correctAnswer && '(Correct)'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/instructor-dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.questions.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Creating Exam...' : 'Create Exam'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}