import React, {useState, useEffect} from 'react';
import {View, Text, Pressable, StyleSheet, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SvgIcon from '../SvgIcon';
import {colors, spacing, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';

interface DateFieldProps {
  label: string;
  value: string;
  onDateChange: (dateString: string) => void;
  error?: string;
}

const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onDateChange,
  error,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Initialize date from value
  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
  }, [value]);
  const handleDateChange = (event: any, pickedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (pickedDate) {
      setSelectedDate(pickedDate);
      // Save date in ISO format for consistency
      const isoDate = pickedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      onDateChange(isoDate);
    }
  };
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Format date for display
  const getDisplayDate = (dateValue: string): string => {
    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({pressed}) => [
          styles.dateInput,
          error && styles.inputError,
          pressed && styles.pressedState,
        ]}
        onPress={showDatePickerModal}>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? getDisplayDate(value) : 'Select date'}
        </Text>
        <SvgIcon name="calendar" size={20} color={colors.text.muted} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dateText: {
    ...typography.body,
    color: colors.text.dark,
  },
  placeholderText: {
    color: colors.text.muted,
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
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});

export default DateField;
