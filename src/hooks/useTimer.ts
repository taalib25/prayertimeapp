import {useEffect, useRef, useCallback} from 'react';

/**
 * Custom hook for managing timer intervals with cleanup
 * Uses requestAnimationFrame for high-precision timing when needed
 */
export const useTimer = (
  callback: () => void,
  interval: number,
  active: boolean = true,
  highPrecision: boolean = false,
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const lastTimeRef = useRef<number>(0);

  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      cleanup();
      return;
    }

    if (highPrecision) {
      // Use requestAnimationFrame for high precision (e.g., seconds countdown)
      const tick = (currentTime: number) => {
        if (currentTime - lastTimeRef.current >= interval) {
          callbackRef.current();
          lastTimeRef.current = currentTime;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Use regular setInterval for lower precision (e.g., minutes countdown)
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    }

    return cleanup;
  }, [active, interval, highPrecision, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
};

export default useTimer;
