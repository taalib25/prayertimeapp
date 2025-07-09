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
  required?: boolean;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
}) => {
  const handleSelect = (selectedKey: string) => {
    onValueChange(selectedKey);
  };

  // Check if value is empty string or undefined
  const hasError = error !== undefined && error !== '';

  const getBoxStyles = () => {
    return hasError
      ? {...styles.selectBox, ...styles.selectBoxError}
      : styles.selectBox;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
      <SelectList
        setSelected={handleSelect}
        data={options}
        save="key"
        defaultOption={options.find(option => option.key === value)}
        placeholder={placeholder}
        searchPlaceholder="Search..."
        boxStyles={getBoxStyles()}
        dropdownStyles={styles.dropdown}
        dropdownTextStyles={styles.dropdownText}
        inputStyles={styles.inputText}
        arrowicon={<Text style={styles.arrowIcon}>▼</Text>}
        searchicon={<></>}
        closeicon={<></>}
        notFoundText="No options found"
        maxHeight={200}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
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
  labelError: {
    color: colors.error || '#FF6B6B',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  selectBoxError: {
    borderColor: colors.error || '#FF6B6B',
    borderWidth: 2,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    marginTop: 5,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text.dark,
    paddingVertical: spacing.sm,
  },
  inputText: {
    ...typography.body,
    color: colors.text.dark,
  },
  arrowIcon: {
    fontSize: 12,
    color: colors.text.muted,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error || '#FF6B6B',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});

export default DropdownField;
