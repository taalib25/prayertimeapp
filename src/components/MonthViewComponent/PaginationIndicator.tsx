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

  return (
    <View style={styles.paginationContainer}>
      {monthlyData.map((monthData, index) => (
        <TouchableOpacity key={index} onPress={() => onPagePress(index)}>
          <View
            style={[
              styles.paginationDot,
              currentPage === index && styles.paginationDotActive,
              index === getCurrentMonthIndex() && styles.paginationDotCurrent,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted || '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paginationDotCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
});

export default PaginationIndicator;
