const buildAnswerMap = (answers = []) => {
  const map = new Map();
  if (!Array.isArray(answers)) {
    return map;
  }

  answers.forEach((entry) => {
    if (entry && typeof entry.questionIndex === "number") {
      map.set(entry.questionIndex, {
        selectedOption:
          typeof entry.selectedOption === "number" ? entry.selectedOption : null,
        timeSpent: typeof entry.timeSpent === "number" ? entry.timeSpent : 0,
      });
    }
  });

  return map;
};

const evaluateSubmission = (exam, providedAnswers = [], existingAnswers = []) => {
  const providedMap = buildAnswerMap(providedAnswers);
  const existingMap = buildAnswerMap(existingAnswers);

  const evaluatedAnswers = exam.questions.map((question, index) => {
    const answer = providedMap.get(index) || existingMap.get(index) || {};
    const selectedOption =
      typeof answer.selectedOption === "number" ? answer.selectedOption : null;
    const timeSpent = typeof answer.timeSpent === "number" ? answer.timeSpent : 0;
    const isCorrect =
      selectedOption !== null && selectedOption === question.correctOptionIndex;

    return {
      questionIndex: index,
      selectedOption,
      timeSpent,
      isCorrect,
    };
  });

  const correctAnswers = evaluatedAnswers.filter((entry) => entry.isCorrect).length;
  const percentage = Number(
    ((correctAnswers / exam.questions.length) * 100).toFixed(2)
  );

  return { evaluatedAnswers, correctAnswers, percentage };
};

const finalizeSubmission = async ({
  exam,
  attempt,
  answers,
  timeRemaining,
  violationsCount,
  autoSubmitted = false,
  autoSubmitReason = null,
}) => {
  const { evaluatedAnswers, correctAnswers, percentage } = evaluateSubmission(
    exam,
    answers,
    attempt.answers
  );

  attempt.answers = evaluatedAnswers;
  attempt.correctAnswers = correctAnswers;
  attempt.totalQuestions = exam.questions.length;
  attempt.percentage = percentage;
  attempt.score = percentage;
  attempt.status = autoSubmitted ? "auto-submitted" : "submitted";
  attempt.autoSubmitted = autoSubmitted;
  attempt.autoSubmitReason = autoSubmitReason;
  attempt.submittedAt = new Date();
  attempt.timeRemaining = typeof timeRemaining === "number" && timeRemaining >= 0 ? timeRemaining : 0;
  attempt.durationUsed = exam.duration * 60 - attempt.timeRemaining;
  attempt.violationsCount =
    typeof violationsCount === "number" && violationsCount >= 0
      ? violationsCount
      : attempt.violationsCount;
  attempt.lastSavedAt = new Date();

  await attempt.save();

  return { evaluatedAnswers, correctAnswers, percentage };
};

module.exports = {
  buildAnswerMap,
  evaluateSubmission,
  finalizeSubmission,
};
