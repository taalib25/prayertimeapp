import React, {useState, useEffect} from 'react';
import {Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface SaveButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

const LoadingDots: React.FC = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.buttonText}>Saving{'.'.repeat(dotCount)}</Text>;
};

const SaveButton: React.FC<SaveButtonProps> = ({onPress, isLoading}) => {
  return (
    <Pressable
      style={({pressed}) => [
        styles.button,
        isLoading && styles.buttonDisabled,
        pressed && !isLoading && styles.pressedState,
      ]}
      onPress={onPress}
      disabled={isLoading}>
      {isLoading ? (
        <LoadingDots />
      ) : (
        <Text style={styles.buttonText}>Save Changes</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.text.muted,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});

export default SaveButton;
