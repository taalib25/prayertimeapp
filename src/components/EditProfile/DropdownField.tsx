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
  const handleSelect = (selectedKey: string) => {
    onValueChange(selectedKey);
  };

  const getBoxStyles = () => {
    return error
      ? {...styles.selectBox, ...styles.selectBoxError}
      : styles.selectBox;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
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
  selectBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  selectBoxError: {
    borderColor: colors.error || '#FF6B6B',
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
    ...typography.bodyTiny,
    color: colors.error || '#FF6B6B',
    marginTop: 4,
  },
});

export default DropdownField;
