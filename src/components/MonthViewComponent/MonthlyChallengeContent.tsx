import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {MonthView} from './MonthView';
import {PaginationIndicator} from './PaginationIndicator';
import {
  MonthlyTaskProvider,
  useMonthlyTask,
} from '../../contexts/MonthlyTaskContext';
import {dataCache} from '../../utils/dataCache';

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

  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  // ⚡ PERFORMANCE: Cache heavy month data computations
  const cachedMonthlyData = useMemo(() => {
    // Create a better cache key that includes all relevant data
    const dataHash = monthlyData
      .map(
        month =>
          `${month.monthLabel}-${month.year}-${month.zikr.current}-${month.quran.current}-${month.fajr.current}-${month.isha.current}`,
      )
      .join('|');
    const cacheKey = `monthly-data-${dataHash}`;

    let cached = dataCache.get<any[]>(cacheKey);
    if (cached) {
      console.log('📦 Using cached monthly data');
      return cached;
    }

    console.log('🔄 Recomputing monthly data, cache key:', cacheKey);
    // Cache the monthly data for faster subsequent renders
    dataCache.set(cacheKey, monthlyData, 300000); // 5 minutes
    return monthlyData;
  }, [monthlyData]);

  // ⚡ PERFORMANCE: Cache current month index calculation
  const currentMonthIndex = useMemo(() => {
    return getCurrentMonthIndex();
  }, [getCurrentMonthIndex, cachedMonthlyData]);

  // Update current page when monthly data loads
  useEffect(() => {
    if (cachedMonthlyData.length > 0) {
      const initialPage = currentMonthIndex;
      setCurrentPage(initialPage);
      // ⚡ PERFORMANCE: Reduced timeout for faster initial render
      setTimeout(() => {
        pagerRef.current?.setPage(initialPage);
      }, 50);
    }
  }, [cachedMonthlyData, currentMonthIndex]);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePagePress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);
  if (cachedMonthlyData.length === 0) {
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
        {cachedMonthlyData.map((monthData: any, index: number) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView
              monthData={monthData}
              index={index}
              currentPage={currentPage}
              isCurrentMonth={index === cachedMonthlyData.length - 1}
            />
          </View>
        ))}
      </PagerView>

      <PaginationIndicator
        monthlyData={cachedMonthlyData}
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
