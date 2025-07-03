import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {colors} from '../../utils/theme';

interface PaginationIndicatorProps {
  monthlyData: any[];
  currentPage: number;
  onPagePress: (index: number) => void;
  getCurrentMonthIndex: () => number;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const PaginationIndicator: React.FC<PaginationIndicatorProps> = ({
  monthlyData,
  currentPage,
  onPagePress,
  getCurrentMonthIndex,
}) => {
  if (monthlyData.length <= 1) {
    return null;
  }

  const currentMonthIndex = getCurrentMonthIndex();

  return (
    <View style={styles.paginationContainer}>
      {monthlyData.map((monthData, index) => {
        const isActive = currentPage === index;
        const isCurrentMonth = index === currentMonthIndex;
        const isCurrentAndActive = isActive && isCurrentMonth;

        return (
          <TouchableOpacity key={index} onPress={() => onPagePress(index)}>
            <View
              style={[
                styles.paginationDot,
                isActive && !isCurrentMonth && styles.paginationDotActive,
                isCurrentMonth && !isActive && styles.paginationDotCurrent,
                isCurrentAndActive && styles.paginationDotCurrentActive,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary, // Green for active (currently viewing)
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paginationDotCurrent: {
    backgroundColor: colors.text.muted, // Different green for current month
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paginationDotCurrentActive: {
    backgroundColor: colors.primary, // Primary green when both current month and active
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.emerald, // Emerald border to show it's current month
  },
});

export default PaginationIndicator;
