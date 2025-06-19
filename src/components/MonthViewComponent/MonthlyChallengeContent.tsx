import React, {useState, useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import PagerView from 'react-native-pager-view';
import {
  useMonthlyTask,
  MonthlyTaskProvider,
} from '../../contexts/MonthlyTaskContext';
import {MonthView} from './MonthView';
import {PaginationIndicator} from './PaginationIndicator';
import {EditModal} from './EditModal';

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
  const {
    monthlyData,
    todayData,
    isLoading,
    updateZikr,
    updateQuran,
    getCurrentMonthIndex,
  } = useMonthlyTask();

  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'zikr' | 'quran' | null>(null);

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

  const handleEdit = useCallback((type: 'zikr' | 'quran') => {
    // setEditingType(type);
    // setEditModalVisible(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (value: number) => {
      if (editingType === 'zikr') {
        await updateZikr(value);
      } else if (editingType === 'quran') {
        await updateQuran(value);
      }
    },
    [editingType, updateZikr, updateQuran],
  );

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePagePress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  const getModalProps = () => {
    if (editingType === 'zikr') {
      return {
        title: 'Update Zikr Count',
        currentValue: todayData.zikr,
      };
    } else if (editingType === 'quran') {
      return {
        title: 'Update Quran Minutes',
        currentValue: todayData.quranPages,
      };
    }
    return {
      title: '',
      currentValue: 0,
    };
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        pageMargin={8}>
        {monthlyData.map((monthData, index) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView
              monthData={monthData}
              index={index}
              currentPage={currentPage}
              isCurrentMonth={index === monthlyData.length - 1}
              todayData={todayData}
              onEdit={handleEdit}
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

      <EditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        isLoading={isLoading}
        {...getModalProps()}
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
    // backgroundColor: colors.background.light,
    borderRadius: 20,
    // marginVertical: spacing.md,
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
