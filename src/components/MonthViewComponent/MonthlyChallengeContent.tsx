import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {MonthView} from './MonthView';
import {PaginationIndicator} from './PaginationIndicator';
import {
  MonthlyTaskProvider,
  useMonthlyTask,
} from '../../contexts/MonthlyTaskContext';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
}

interface MonthlyChallengeContentProps {
  userGoals?: UserGoals;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const MonthlyChallengeContentInner: React.FC = () => {
  const {monthlyData, getCurrentMonthIndex} = useMonthlyTask();
  const [currentPage, setCurrentPage] = useState(0); // Will be updated to last page when data loads
  const pagerRef = useRef<PagerView>(null);

  // Remove unnecessary caching since we now have reactive updates from WatermelonDB
  const monthlyDataWithReactivity = useMemo(() => {
    console.log('📦 Monthly data updated reactively:', monthlyData.length);
    return monthlyData;
  }, [monthlyData]);

  // Get current month index
  const currentMonthIndex = useMemo(() => {
    return getCurrentMonthIndex();
  }, [getCurrentMonthIndex, monthlyDataWithReactivity]);
  // Update current page when monthly data loads - start at last page (current month)
  useEffect(() => {
    if (monthlyDataWithReactivity.length > 0) {
      const initialPage = monthlyDataWithReactivity.length - 1; // Always start at the last page (current month)
      setCurrentPage(initialPage);
      // Quick update for immediate responsiveness
      setTimeout(() => {
        pagerRef.current?.setPage(initialPage);
      }, 50);
    }
  }, [monthlyDataWithReactivity]);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePagePress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  if (monthlyDataWithReactivity.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={monthlyDataWithReactivity.length - 1} // Start at last page (current month)
        onPageSelected={handlePageSelected}
        pageMargin={8}>
        {monthlyDataWithReactivity.map((monthData: any, index: number) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView
              monthData={monthData}
              index={index}
              currentPage={currentPage}
              isCurrentMonth={index === monthlyDataWithReactivity.length - 1}
            />
          </View>
        ))}
      </PagerView>
      <PaginationIndicator
        monthlyData={monthlyDataWithReactivity}
        currentPage={currentPage}
        onPagePress={handlePagePress}
        getCurrentMonthIndex={getCurrentMonthIndex}
      />
    </View>
  );
};

// Main component with provider wrapper
const MonthlyChallengeContent: React.FC<MonthlyChallengeContentProps> = ({
  userGoals,
}) => {
  return (
    <MonthlyTaskProvider userGoals={userGoals}>
      <MonthlyChallengeContentInner />
    </MonthlyTaskProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600,
    borderRadius: 20,
    paddingVertical: spacing.sm,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});

export default MonthlyChallengeContent;
