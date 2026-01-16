import React from 'react';

export default function QuestionPalette({
  totalQuestions,
  currentQuestion,
  answers,
  onQuestionClick,
  questions = []
}) {
  const getQuestionStatus = (index) => {
    // Use questionIndex from the question if available, otherwise use the index
    const question = questions[index];
    const questionKey = question?.questionIndex !== undefined ? question.questionIndex : index;
    const hasAnswer = answers[questionKey] !== undefined && answers[questionKey] !== null;

    if (index === currentQuestion) {
      return 'current';
    }
    return hasAnswer ? 'answered' : 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'bg-blue-600 text-white border-2 border-blue-800 ring-2 ring-blue-300';
      case 'answered':
        return 'bg-green-500 text-white border-2 border-green-700';
      case 'unanswered':
        return 'bg-gray-200 text-gray-700 border-2 border-gray-400 hover:bg-gray-300';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">📋</span>
        Question Palette
      </h3>
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const status = getQuestionStatus(index);
          return (
            <button
              key={index}
              onClick={() => onQuestionClick(index)}
              className={`
                w-10 h-10 rounded-lg font-semibold text-sm
                transition-all duration-200 transform hover:scale-110
                ${getStatusColor(status)}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
              title={`Question ${index + 1} - ${status === 'answered' ? 'Answered' : 'Unanswered'}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600">Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <span className="text-gray-600">Unanswered</span>
          </div>
        </div>
        <div className="text-gray-600 font-medium">
          Answered: {Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== null).length} / {totalQuestions}
        </div>
      </div>
    </div>
  );
}
