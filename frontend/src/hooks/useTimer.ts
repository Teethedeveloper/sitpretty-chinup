// Import React hooks
import { useState, useEffect, useCallback } from 'react';

// Custom hook for managing a countdown timer
const useTimer = (initialDuration: number, onComplete: () => void, autoStart: boolean = true) => {
  // State for remaining seconds
  const [seconds, setSeconds] = useState(initialDuration);
  // State for timer running status
  const [isRunning, setIsRunning] = useState(autoStart);

  // Effect to handle timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && seconds > 0) {
      // Update timer every second
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            // Stop timer and call onComplete when done
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, onComplete]);

  // Start the timer
  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Reset the timer
  const resetTimer = useCallback(() => {
    setSeconds(initialDuration);
    setIsRunning(autoStart);
  }, [initialDuration, autoStart]);

  // Format seconds into mm:ss
  const formatTime = (sec: number): string => {
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = sec % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Return timer state and methods
  return {
    time: formatTime(seconds),
    seconds,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
};

// Export the hook
export default useTimer;

// remove autostart and initial duration