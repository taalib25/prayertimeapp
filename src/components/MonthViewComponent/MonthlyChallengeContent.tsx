import React, {useState, useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {MonthView} from './MonthView';
import {PaginationIndicator} from './PaginationIndicator';
import { MonthlyTaskProvider, useMonthlyTask } from '../../contexts/MonthlyTaskContext';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
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

  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // Update current page when monthly data loads
  useEffect(() => {
    if (monthlyData.length > 0) {
      const initialPage = getCurrentMonthIndex();
      setCurrentPage(initialPage);
      setTimeout(() => {
        pagerRef.current?.setPage(initialPage);
      }, 100);
    }
  }, [monthlyData, getCurrentMonthIndex]);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePagePress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  if (monthlyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        pageMargin={8}>
        {monthlyData.map((monthData: any, index: number) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView
              monthData={monthData}
              index={index}
              currentPage={currentPage}
              isCurrentMonth={index === monthlyData.length - 1}
            />
          </View>
        ))}
      </PagerView>

      <PaginationIndicator
        monthlyData={monthlyData}
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
    height: 597,
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
