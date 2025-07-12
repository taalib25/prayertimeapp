import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {Text, StyleSheet} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import {useTimer} from '../hooks/useTimer';

interface CountdownTimerProps {
  targetTime: string; // Prayer time in HH:MM format (24-hour)
  isActive?: boolean; // Whether this is the active (next) prayer
  style?: any; // Custom styles
  onComplete?: () => void; // Callback when countdown reaches zero
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime,
  isActive = false,
  style,
  onComplete,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Update onComplete ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Memoize target time parsing for performance
  const targetMinutes = useMemo(() => {
    const [hours, minutes] = targetTime.split(':').map(Number);
    return hours * 60 + minutes;
  }, [targetTime]);

  // Calculate time remaining until target time
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Calculate difference in minutes
    let diffMinutes = targetMinutes - currentMinutes;
    let diffSeconds = 0 - currentSeconds;

    // If target time has passed today, calculate for tomorrow
    if (diffMinutes < 0 || (diffMinutes === 0 && diffSeconds <= 0)) {
      diffMinutes += 24 * 60; // Add 24 hours worth of minutes
    }

    // Adjust for seconds
    if (diffSeconds < 0) {
      diffMinutes -= 1;
      diffSeconds += 60;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return {
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, diffSeconds),
    };
  }, [targetMinutes]);

  // Update countdown
  const updateCountdown = useCallback(() => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    // Check if countdown has expired
    const totalSeconds =
      remaining.hours * 3600 + remaining.minutes * 60 + remaining.seconds;
    if (totalSeconds <= 0 && !isExpired) {
      setIsExpired(true);
      onCompleteRef.current?.();
    } else if (totalSeconds > 0 && isExpired) {
      setIsExpired(false);
    }
  }, [calculateTimeRemaining, isExpired]); // Use custom timer hook for efficient updates - reduce frequency for inactive timers
  useTimer(updateCountdown, isActive ? 1000 : 30000, isActive, true);

  // Calculate initial time for all timers
  useEffect(() => {
    updateCountdown();
  }, [targetTime, updateCountdown]);
  // Format time display
  const formatTime = useCallback((): string => {
    if (!isActive) {
      return targetTime; // Show prayer time for inactive prayers
    }

    if (isExpired) {
      return 'Now';
    }

    const {hours, minutes, seconds} = timeRemaining;

    // Show different formats based on time remaining
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 5) {
      return `${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return 'Now';
    }
  }, [isActive, targetTime, timeRemaining, isExpired]); // Determine if we should show seconds (only for very close times)
  const showSeconds = useMemo(() => {
    return isActive && timeRemaining.hours === 0 && timeRemaining.minutes <= 5;
  }, [isActive, timeRemaining]);

  return (
    <Text
      style={[
        styles.timerText,
        isActive && styles.activeTimerText,
        isExpired && styles.expiredTimerText,
        showSeconds && styles.urgentTimerText,
        style,
      ]}
      numberOfLines={1}>
      {formatTime()}
    </Text>
  );
};

const styles = StyleSheet.create({
  timerText: {
    ...typography.h2,
    fontSize: 32,
    color: colors.text.prayerBlue,
    textAlign: 'center',
    letterSpacing: -0.5,
    padding : 6
  },
  activeTimerText: {
    ...typography.h1,
    color: '#1B7A1B', // Darker, more readable green for active countdown
    fontSize: 36,
    letterSpacing: -1,
    textShadowColor: 'rgba(27, 122, 27, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  expiredTimerText: {
    color: '#E74C3C', // More sophisticated red when time is up
    ...typography.h1,
    fontSize: 28,
    textShadowColor: 'rgba(231, 76, 60, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  urgentTimerText: {
    color: '#D68910', // Warmer orange for urgent countdown (< 5 minutes)
    ...typography.h1,
    fontSize: 34,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(214, 137, 16, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
});

export default CountdownTimer;
