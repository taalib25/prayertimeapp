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
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});

export default SaveButton;
