import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  error?: string;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  error,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.dark,
    backgroundColor: colors.white,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error || '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    ...typography.bodyTiny,
    color: colors.error || '#FF6B6B',
    marginTop: 4,
  },
});

export default FormField;
