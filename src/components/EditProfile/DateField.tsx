import React, {useState, useEffect} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import DatePicker from 'react-native-date-picker';
import SvgIcon from '../SvgIcon';
import {colors, spacing, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';
import {formatDateString} from '../../utils/helpers';

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
  
  // Only initialize date from value when component mounts or when value changes from empty to filled
  useEffect(() => {
    if (value && value.trim() !== '') {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    } else {
      // If no initial value, set to a reasonable default (e.g., 25 years ago for date of birth)
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() - 25);
      setSelectedDate(defaultDate);
    }
  }, []); // Remove 'value' from dependency array to prevent constant resets

  // Separate effect to handle external value changes (if parent component updates the value)
  useEffect(() => {
    // Only update if there's a significant difference and the picker is not open
    if (value && !showDatePicker) {
      const parsedDate = new Date(value);
      const currentSelected = selectedDate.toDateString();
      const newSelected = parsedDate.toDateString();
      
      if (!isNaN(parsedDate.getTime()) && currentSelected !== newSelected) {
        setSelectedDate(parsedDate);
      }
    }
  }, [value, showDatePicker]); // Only react to external value changes when picker is closed

  const handleDateConfirm = (pickedDate: Date) => {
    setShowDatePicker(false);
    setSelectedDate(pickedDate);
    // Save date in ISO format for consistency
    const isoDate = formatDateString(pickedDate); // YYYY-MM-DD format
    onDateChange(isoDate);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
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
      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        maximumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
      />
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