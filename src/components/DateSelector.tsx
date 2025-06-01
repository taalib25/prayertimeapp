import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {colors} from '../utils/theme';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  daysToShow?: number;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  daysToShow = 7,
}) => {
  const [dates, setDates] = useState<Array<{date: string; display: string}>>(
    [],
  );

  useEffect(() => {
    generateDates();
  }, [selectedDate]);

  const generateDates = () => {
    const dateArray: Array<{date: string; display: string}> = [];
    const currentDate = new Date();

    // Add dates before current date
    for (let i = -Math.floor(daysToShow / 2); i < 0; i++) {
      const date = new Date();
      date.setDate(currentDate.getDate() + i);
      dateArray.push({
        date: formatDateToString(date),
        display: formatDisplayDate(date),
      });
    }

    // Add current date
    dateArray.push({
      date: formatDateToString(currentDate),
      display: 'Today',
    });

    // Add dates after current date
    for (let i = 1; i <= Math.floor(daysToShow / 2); i++) {
      const date = new Date();
      date.setDate(currentDate.getDate() + i);
      dateArray.push({
        date: formatDateToString(date),
        display: formatDisplayDate(date),
      });
    }

    setDates(dateArray);
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = date.getDate();
    const dayName = dayNames[date.getDay()];
    return `${dayName} ${day}`;
  };

  const isSelectedDate = (dateStr: string): boolean => {
    return dateStr === selectedDate;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {dates.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              isSelectedDate(item.date) && styles.selectedDateItem,
            ]}
            onPress={() => onDateChange(item.date)}>
            <Text
              style={[
                styles.dateText,
                isSelectedDate(item.date) && styles.selectedDateText,
              ]}>
              {item.display}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  dateItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  selectedDateItem: {
    backgroundColor: colors.accent,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  selectedDateText: {
    color: colors.white,
  },
});

export default DateSelector;
