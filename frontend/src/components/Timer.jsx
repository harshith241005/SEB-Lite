import React, { useState, useEffect, useRef } from "react";

export default function Timer({ duration, onTimeUp, initialTime }) {
  // Use initialTime if provided (for resuming), otherwise use duration in seconds
  const [timeRemaining, setTimeRemaining] = useState(
    initialTime || (duration * 60)
  );
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // Reset timer if duration changes
    if (initialTime) {
      setTimeRemaining(initialTime);
    } else if (duration) {
      setTimeRemaining(duration * 60);
    }
  }, [duration, initialTime]);

  useEffect(() => {
    if (timeRemaining <= 0 && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      if (onTimeUp) onTimeUp();
      return;
    }

    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
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
