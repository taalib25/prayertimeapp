import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SelectList} from 'react-native-dropdown-select-list';
import {colors, spacing, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';

export interface DropdownOption {
  key: string;
  value: string;
}

export interface DropdownFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <SelectList
        setSelected={onValueChange}
        data={options}
        save="key"
        placeholder={placeholder}
        search={false}
        boxStyles={error ? styles.dropdownError : styles.dropdown}
        dropdownStyles={styles.dropdownList}
        inputStyles={styles.dropdownText}
        dropdownTextStyles={styles.dropdownOptionText}
        arrowicon={<Text style={styles.dropdownArrow}>▼</Text>}
        defaultOption={options.find(option => option.key === value)}
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
  dropdown: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  dropdownError: {
    borderWidth: 2,
    borderColor: colors.error || '#FF6B6B',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text.dark,
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    marginTop: 5,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.text.dark,
    fontSize: 16,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.text.muted,
  },
  errorText: {
    ...typography.bodyTiny,
    color: colors.error || '#FF6B6B',
    marginTop: 4,
  },
});

export default DropdownField;
