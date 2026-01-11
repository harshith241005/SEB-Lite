import React, { useState, useEffect } from "react";

export default function Timer({ duration, onTimeUp }) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert minutes to seconds

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isWarning = timeRemaining < 300; // Less than 5 minutes
  const isCritical = timeRemaining < 60; // Less than 1 minute

  const getTimerColor = () => {
    if (isCritical) return "text-red-600";
    if (isWarning) return "text-orange-600";
    return "text-green-600";
  };

  const getBackgroundColor = () => {
    if (isCritical) return "bg-red-50";
    if (isWarning) return "bg-orange-50";
    return "bg-green-50";
  };

  return (
    <div className={`${getBackgroundColor()} rounded-lg p-4 border-2 border-gray-300`}>
      <p className="text-sm text-gray-600 font-semibold">Time Remaining</p>
      <p className={`text-3xl font-bold ${getTimerColor()}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      {isCritical && (
        <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ Time Running Out!</p>
      )}
    </div>
  );
}
