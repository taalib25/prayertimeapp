import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading tasks...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({error}) => {
  return (
    <View style={styles.container}>
      <View style={styles.errorContent}>
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 450,
    backgroundColor: '#E1FFD1',
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
});
