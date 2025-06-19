import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {colors, spacing} from '../../utils/theme';

interface PaginationDotsProps {
  totalPages: number;
  currentPage: number;
  pagerRef: React.RefObject<PagerView | null>;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({
  totalPages,
  currentPage,
  pagerRef,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.paginationContainer}>
      {Array.from({length: totalPages}, (_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paginationDot,
            currentPage === index && styles.paginationDotActive,
          ]}
          onPress={() => pagerRef.current?.setPage(index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default PaginationDots;
