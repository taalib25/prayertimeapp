import React, {useState, useRef, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {colors} from '../../utils/theme';
import {typography} from '../../utils/typography';
import {useRecentDailyTasks, useMonthlyData} from '../../hooks/useDailyTasks';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

interface MonthData {
  monthLabel: string;
  year: number;
  zikr: {current: number; total: number};
  quran: {current: number; total: number};
  fajr: {current: number; total: number};
  isha: {current: number; total: number};
}

interface MonthlyChallengeProps {
  userGoals?: UserGoals;
}

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
  currentValue: number;
  title: string;
  subtitle: string;
  unit: string;
}

const MOCK_USER_ID = 1001;

// Generate data for the past 3 months using real database data
const getMonthlyData = (
  userGoals?: UserGoals,
  monthlyData?: any[],
): MonthData[] => {
  const defaultGoals = {
    monthlyZikrGoal: 3000,
    monthlyQuranPagesGoal: 300,
    monthlyCharityGoal: 5,
    monthlyFastingDaysGoal: 6,
  };

  const goals = userGoals || defaultGoals;

  return (
    monthlyData?.map(monthData => ({
      monthLabel: monthData.monthName,
      year: monthData.year,
      zikr: {
        current: monthData.totalZikr,
        total: goals.monthlyZikrGoal,
      },
      quran: {
        current: monthData.totalQuranPages,
        total: goals.monthlyQuranPagesGoal,
      },
      fajr: {
        current: monthData.fajrCompletedDays,
        total: monthData.totalDays,
      },
      isha: {
        current: monthData.ishaCompletedDays,
        total: monthData.totalDays,
      },
    })) || []
  );
};

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  currentValue,
  title,
  subtitle,
  unit,
}) => {
  const [tempValue, setTempValue] = useState(currentValue);

  React.useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue, visible]);

  const handleSave = () => {
    onSave(tempValue);
    onClose();
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text) || 0;
    setTempValue(Math.max(0, num));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Editable Count */}
          <View style={styles.countContainer}>
            <TextInput
              style={styles.countInput}
              value={tempValue.toString()}
              onChangeText={handleTextChange}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              textAlign="center"
            />
          </View>

          {/* Title below count */}
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Action buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CompactChallengeCard: React.FC<{
  id: string;
  title: string;
  subtitle: string;
  current: number;
  total: number;
  backgroundColor: string;
  progressColor: string;
  textColor: string;
  isVisible: boolean;
  isEditable?: boolean;
  onEdit?: () => void;
  todayValue?: number;
  shouldAnimate?: boolean;
}> = React.memo(
  ({
    id,
    title,
    subtitle,
    current,
    total,
    backgroundColor,
    progressColor,
    textColor,
    isVisible,
    isEditable = false,
    onEdit,
    todayValue = 0,
    shouldAnimate = false,
  }) => {
    const progressRef = useRef<any>(null);
    const hasAnimated = useRef(false);
    const exceededGoal = current > total;
    const actualProgressColor = exceededGoal ? colors.success : progressColor;

    // Memoize progress calculation
    const progressPercentage = useMemo(() => {
      const percentage = exceededGoal
        ? 100
        : Math.min((current / total) * 100, 100);
      return Math.round(percentage); // Round to avoid decimal issues
    }, [current, total, exceededGoal]);

    // Only animate when specifically requested and visible
    React.useEffect(() => {
      if (
        isVisible &&
        shouldAnimate &&
        progressRef.current &&
        !hasAnimated.current
      ) {
        console.log(`🎯 Animating progress for ${id}: ${progressPercentage}%`);
        progressRef.current.animate(progressPercentage, 800);
        hasAnimated.current = true;

        // Reset animation flag after some time
        setTimeout(() => {
          hasAnimated.current = false;
        }, 2000);
      }
    }, [progressPercentage, isVisible, shouldAnimate, id]);

    return (
      <Pressable
        style={[styles.compactCard, {backgroundColor}]}
        onPress={isEditable ? onEdit : undefined}
        disabled={!isEditable}>
        <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>

        <View style={styles.compactProgressContainer}>
          <AnimatedCircularProgress
            ref={progressRef}
            size={120}
            width={6}
            fill={shouldAnimate ? 0 : progressPercentage} // Start at 0 if animating, otherwise show actual value
            tintColor={actualProgressColor}
            backgroundColor={colors.background.surface}
            rotation={0}
            lineCap="round"
            duration={800}
            onAnimationComplete={() => {
              console.log(`✅ Animation completed for ${id}`);
            }}>
            {() => (
              <View style={styles.compactProgressText}>
                <Text
                  style={[
                    styles.compactProgressValue,
                    {color: exceededGoal ? colors.success : textColor},
                  ]}>
                  {current}
                  <Text
                    style={[
                      styles.compactProgressTotal,
                      {color: exceededGoal ? colors.success : textColor},
                    ]}>
                    /{total}
                  </Text>
                </Text>
              </View>
            )}
          </AnimatedCircularProgress>

          {/* Show exceeded indicator */}
          {exceededGoal && (
            <View style={styles.exceededIndicator}>
              <Text style={styles.exceededText}>Goal Exceeded! 🎉</Text>
            </View>
          )}
        </View>

        <Text style={[styles.compactSubtitle, {color: textColor}]}>
          {subtitle}
        </Text>

        {isEditable && (
          <View style={styles.todayContainer}>
            <Text style={styles.todayText}>Today: {todayValue}</Text>
            <Text style={styles.editHint}>Tap to edit</Text>
          </View>
        )}
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    // Enhanced comparison to prevent unnecessary re-renders
    return (
      prevProps.id === nextProps.id &&
      prevProps.current === nextProps.current &&
      prevProps.total === nextProps.total &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.todayValue === nextProps.todayValue &&
      prevProps.isEditable === nextProps.isEditable &&
      prevProps.shouldAnimate === nextProps.shouldAnimate
    );
  },
);

const MonthlyChallengeSelector: React.FC<MonthlyChallengeProps> = ({
  userGoals,
}) => {
  // Get monthly aggregated data
  const {monthlyData: rawMonthlyData, refetch: refetchMonthly} = useMonthlyData(
    {
      uid: MOCK_USER_ID,
      monthsBack: 3,
    },
  );

  // Get today's data for editing
  const {recentTasks, updateZikrForDate, updateQuranForDate} =
    useRecentDailyTasks({
      uid: MOCK_USER_ID,
      daysBack: 1,
    });

  // Memoize monthly data processing
  const monthlyData = useMemo(
    () => getMonthlyData(userGoals, rawMonthlyData),
    [userGoals, rawMonthlyData],
  );

  const [currentPage, setCurrentPage] = useState(() =>
    Math.max(0, monthlyData.length - 1),
  );
  const pagerRef = useRef<PagerView>(null);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'zikr' | 'quran' | null>(null);
  const [lastEditedCard, setLastEditedCard] = useState<string | null>(null);

  // Memoize today's data to prevent unnecessary re-renders
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTask = recentTasks.find(task => task.date === today);
    return {
      zikr: todayTask?.totalZikrCount || 0,
      quranPages: todayTask?.quranPagesRead || 0,
    };
  }, [recentTasks]);

  const handleEdit = useCallback((type: 'zikr' | 'quran') => {
    setEditingType(type);
    setEditModalVisible(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (value: number) => {
      const today = new Date().toISOString().split('T')[0];

      try {
        if (editingType === 'zikr') {
          await updateZikrForDate(today, value);
          setLastEditedCard('zikr');
        } else if (editingType === 'quran') {
          await updateQuranForDate(today, value);
          setLastEditedCard('quran');
        }

        // Refetch data after a short delay
        setTimeout(() => {
          refetchMonthly();
          // Clear the edited card marker after animation completes
          setTimeout(() => setLastEditedCard(null), 1200);
        }, 300);
      } catch (error) {
        Alert.alert('Error', 'Failed to update progress');
      }
    },
    [editingType, updateZikrForDate, updateQuranForDate, refetchMonthly],
  );

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  // Optimized data update with stable references
  const updatedMonthlyData = useMemo(() => {
    if (!monthlyData.length) return monthlyData;

    const updated = [...monthlyData];
    const currentMonthIndex = updated.length - 1;

    if (currentMonthIndex >= 0) {
      const currentMonth = updated[currentMonthIndex];

      updated[currentMonthIndex] = {
        ...currentMonth,
        zikr: {
          ...currentMonth.zikr,
          current: Math.max(0, todayData.zikr),
        },
        quran: {
          ...currentMonth.quran,
          current: Math.max(0, todayData.quranPages),
        },
      };
    }

    return updated;
  }, [monthlyData, todayData.zikr, todayData.quranPages]);

  // Optimized MonthView component
  const MonthView = React.memo<{monthData: MonthData; index: number}>(
    ({monthData, index}) => {
      const isVisible = currentPage === index;
      const isCurrentMonth = index === updatedMonthlyData.length - 1;
      const displayData = isCurrentMonth
        ? updatedMonthlyData[index]
        : monthData;

      // Generate stable unique IDs for each card
      const cardIds = useMemo(
        () => ({
          zikr: `${displayData.monthLabel}-${displayData.year}-zikr`,
          quran: `${displayData.monthLabel}-${displayData.year}-quran`,
          fajr: `${displayData.monthLabel}-${displayData.year}-fajr`,
          isha: `${displayData.monthLabel}-${displayData.year}-isha`,
        }),
        [displayData.monthLabel, displayData.year],
      );

      return (
        <View style={styles.monthContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.monthTitle}>
              {displayData.monthLabel} {displayData.year}
            </Text>
          </View>

          <View style={styles.compactCardsGrid}>
            <CompactChallengeCard
              id={cardIds.zikr}
              title="Zikr"
              subtitle="Monthly"
              current={displayData.zikr.current}
              total={displayData.zikr.total}
              backgroundColor="#E8F5E8"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              isEditable={isCurrentMonth}
              onEdit={() => handleEdit('zikr')}
              todayValue={isCurrentMonth ? todayData.zikr : 0}
              shouldAnimate={lastEditedCard === 'zikr' && isCurrentMonth}
            />

            <CompactChallengeCard
              id={cardIds.quran}
              title="Quran"
              subtitle="Pages"
              current={displayData.quran.current}
              total={displayData.quran.total}
              backgroundColor="#E3F2FD"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              isEditable={isCurrentMonth}
              onEdit={() => handleEdit('quran')}
              todayValue={isCurrentMonth ? todayData.quranPages : 0}
              shouldAnimate={lastEditedCard === 'quran' && isCurrentMonth}
            />

            <CompactChallengeCard
              id={cardIds.fajr}
              title="Fajr"
              subtitle="Days"
              current={displayData.fajr.current}
              total={displayData.fajr.total}
              backgroundColor="#FFF3E0"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              shouldAnimate={false} // Never animate prayer cards
            />

            <CompactChallengeCard
              id={cardIds.isha}
              title="Isha"
              subtitle="Days"
              current={displayData.isha.current}
              total={displayData.isha.total}
              backgroundColor="#FCE4EC"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              shouldAnimate={false} // Never animate prayer cards
            />
          </View>
        </View>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if essential data actually changed
      const prevData = prevProps.monthData;
      const nextData = nextProps.monthData;

      return (
        prevProps.index === nextProps.index &&
        prevData.monthLabel === nextData.monthLabel &&
        prevData.year === nextData.year &&
        prevData.zikr.current === nextData.zikr.current &&
        prevData.zikr.total === nextData.zikr.total &&
        prevData.quran.current === nextData.quran.current &&
        prevData.quran.total === nextData.quran.total &&
        prevData.fajr.current === nextData.fajr.current &&
        prevData.fajr.total === nextData.fajr.total &&
        prevData.isha.current === nextData.isha.current &&
        prevData.isha.total === nextData.isha.total
      );
    },
  );

  const getModalProps = () => {
    if (editingType === 'zikr') {
      return {
        title: 'Update Zikr Count',
        subtitle: 'Adjust your daily zikr progress',
        unit: 'dhikr',
        currentValue: todayData.zikr,
      };
    } else if (editingType === 'quran') {
      return {
        title: 'Update Quran Pages',
        subtitle: 'Adjust your daily Quran reading progress',
        unit: 'pages',
        currentValue: todayData.quranPages,
      };
    }
    return {
      title: '',
      subtitle: '',
      unit: '',
      currentValue: 0,
    };
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={updatedMonthlyData.length - 1}
        onPageSelected={handlePageSelected}
        pageMargin={8}>
        {updatedMonthlyData.map((monthData, index) => (
          <View
            key={`${monthData.monthLabel}-${monthData.year}`}
            style={styles.pageContainer}>
            <MonthView monthData={monthData} index={index} />
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicator */}
      {updatedMonthlyData.length > 1 && (
        <View style={styles.paginationContainer}>
          {updatedMonthlyData.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => pagerRef.current?.setPage(index)}>
              <View
                style={[
                  styles.paginationDot,
                  currentPage === index && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Edit Modal */}
      <EditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        {...getModalProps()}
      />
    </View>
  );
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const styles = StyleSheet.create({
  container: {
    height: 550,
    backgroundColor: colors.background.light,
    borderRadius: 20,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  monthContainer: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  titleContainer: {
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  monthTitle: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    textAlign: 'left',
  },
  compactCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  compactCard: {
    width: '48%',
    aspectRatio: 1.0,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    // alignItems: 'flex-start',
    // justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactTitle: {
    ...typography.h3,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 6,
  },
  compactSubtitle: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  compactProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  compactProgressText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProgressValue: {
    ...typography.h3,
    textAlign: 'center',
    fontSize: 16,
  },
  compactProgressTotal: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  exceededIndicator: {
    position: 'absolute',
    bottom: -25,
    alignItems: 'center',
  },
  exceededText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
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
  todayContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  todayText: {
    ...typography.caption,
    color: colors.text.prayerBlue,
    fontWeight: '600',
  },
  editHint: {
    ...typography.caption,
    color: colors.text.prayerBlue,
    opacity: 0.7,
    fontSize: 10,
  },

  // Simplified Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  countContainer: {
    marginBottom: 24,
  },
  countInput: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.muted,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
  },

  // Remove unused styles
  // bigNumberContainer, bigNumber, manualEditInput, unitContainer, unitLabel,
  // pencilButton, pencilIcon, controlsContainer, minusButton, plusButton,
  // buttonText, numberDisplay, incrementLabel styles are now removed
});

export default MonthlyChallengeSelector;
