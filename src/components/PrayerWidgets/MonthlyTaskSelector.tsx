import React, {useState, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';
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
  const [isManualEdit, setIsManualEdit] = useState(false);

  React.useEffect(() => {
    setTempValue(currentValue);
    setIsManualEdit(false);
  }, [currentValue, visible]);

  const adjustValue = (amount: number) => {
    setTempValue(prev => Math.max(0, prev + amount));
  };

  const handleSave = () => {
    onSave(tempValue);
    onClose();
  };

  const handleManualEdit = () => {
    setIsManualEdit(true);
  };

  const handleManualInputChange = (text: string) => {
    const num = parseInt(text) || 0;
    setTempValue(Math.max(0, num));
  };

  const handleManualInputBlur = () => {
    setIsManualEdit(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Big Number Display */}
          <View style={styles.bigNumberContainer}>
            {isManualEdit ? (
              <TextInput
                style={styles.manualEditInput}
                value={tempValue.toString()}
                onChangeText={handleManualInputChange}
                onBlur={handleManualInputBlur}
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <TouchableOpacity onPress={handleManualEdit}>
                <Text style={styles.bigNumber}>{tempValue}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.unitContainer}>
              <Text style={styles.unitLabel}>{unit}</Text>
              {!isManualEdit && (
                <TouchableOpacity
                  style={styles.pencilButton}
                  onPress={handleManualEdit}>
                  <Text style={styles.pencilIcon}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Simple Plus/Minus Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.minusButton}
              onPress={() => adjustValue(-1)}>
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>

            <View style={styles.numberDisplay}>
              <Text style={styles.incrementLabel}>Tap number to edit</Text>
            </View>

            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => adjustValue(1)}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>

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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CompactChallengeCard: React.FC<{
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
}> = ({
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
}) => {
  const progress = useSharedValue(0);
  const exceededGoal = current > total;
  const actualProgressColor = exceededGoal ? colors.success : progressColor;

  React.useEffect(() => {
    if (isVisible) {
      const progressPercentage = exceededGoal ? 100 : (current / total) * 100;
      progress.value = withTiming(progressPercentage, {
        duration: 1200,
      });
    } else {
      progress.value = 0;
    }
  }, [current, total, isVisible, exceededGoal]);

  const animatedProps = useAnimatedProps(() => {
    const percentage = progress.value;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return {
      strokeDashoffset,
    };
  });

  return (
    <Pressable
      style={[styles.compactCard, {backgroundColor}]}
      onPress={isEditable ? onEdit : undefined}
      disabled={!isEditable}>
      <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>

      <View style={styles.compactProgressContainer}>
        <Svg height="150" width="150" viewBox="0 0 80 80">
          <Circle
            cx="40"
            cy="40"
            r="35"
            stroke={colors.background.surface}
            strokeWidth="6"
            fill="transparent"
          />
          {exceededGoal && (
            <Circle
              cx="40"
              cy="40"
              r="35"
              stroke={colors.background.surface}
              strokeWidth="6"
              strokeDasharray="3,3"
              fill="transparent"
            />
          )}
          <AnimatedCircle
            cx="40"
            cy="40"
            r="35"
            stroke={actualProgressColor}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 35}`}
            strokeLinecap="round"
            fill="transparent"
            transform="rotate(-90, 40, 40)"
            animatedProps={animatedProps}
          />
        </Svg>

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
};

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

  const monthlyData = useMemo(
    () => getMonthlyData(userGoals, rawMonthlyData),
    [userGoals, rawMonthlyData],
  );

  const [currentPage, setCurrentPage] = useState(monthlyData.length - 1);
  const pagerRef = useRef<PagerView>(null);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'zikr' | 'quran' | null>(null);

  const todayData = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTask = recentTasks.find(task => task.date === today);
    return {
      zikr: todayTask?.totalZikrCount || 0,
      quranPages: todayTask?.quranPagesRead || 0,
    };
  }, [recentTasks]);

  const handleEdit = (type: 'zikr' | 'quran') => {
    setEditingType(type);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (value: number) => {
    const today = new Date().toISOString().split('T')[0];

    try {
      if (editingType === 'zikr') {
        await updateZikrForDate(today, value);
      } else if (editingType === 'quran') {
        await updateQuranForDate(today, value);
      }

      // Refetch monthly data to update progress bars immediately
      setTimeout(() => {
        refetchMonthly();
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setCurrentPage(position);
  };

  const MonthView: React.FC<{monthData: MonthData; index: number}> = ({
    monthData,
    index,
  }) => {
    const isVisible = currentPage === index;
    const isCurrentMonth = index === updatedMonthlyData.length - 1;

    // Use updated data for current month, original for past months
    const displayData = isCurrentMonth ? updatedMonthlyData[index] : monthData;

    return (
      <View style={styles.monthContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.monthTitle}>
            {displayData.monthLabel} {displayData.year}
          </Text>
        </View>

        <View style={styles.compactCardsGrid}>
          <CompactChallengeCard
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
          />

          <CompactChallengeCard
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
          />

          <CompactChallengeCard
            title="Fajr"
            subtitle="Days"
            current={displayData.fajr.current}
            total={displayData.fajr.total}
            backgroundColor="#FFF3E0"
            progressColor={colors.lightBlue}
            textColor={colors.text.prayerBlue}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            title="Isha"
            subtitle="Days"
            current={displayData.isha.current}
            total={displayData.isha.total}
            backgroundColor="#FCE4EC"
            progressColor={colors.lightBlue}
            textColor={colors.text.prayerBlue}
            isVisible={isVisible}
          />
        </View>
      </View>
    );
  };

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

  // Update current month data with today's values for real-time updates
  const updatedMonthlyData = useMemo(() => {
    if (!monthlyData.length) return monthlyData;

    const updated = [...monthlyData];
    const currentMonthIndex = updated.length - 1;

    if (currentMonthIndex >= 0) {
      updated[currentMonthIndex] = {
        ...updated[currentMonthIndex],
        zikr: {
          ...updated[currentMonthIndex].zikr,
          current:
            updated[currentMonthIndex].zikr.current -
            (recentTasks.find(
              t => t.date === new Date().toISOString().split('T')[0],
            )?.totalZikrCount || 0) +
            todayData.zikr,
        },
        quran: {
          ...updated[currentMonthIndex].quran,
          current:
            updated[currentMonthIndex].quran.current -
            (recentTasks.find(
              t => t.date === new Date().toISOString().split('T')[0],
            )?.quranPagesRead || 0) +
            todayData.quranPages,
        },
      };
    }

    return updated;
  }, [monthlyData, todayData, recentTasks]);

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
  },
  compactProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProgressValue: {
    ...typography.h3,
    textAlign: 'center',
  },
  compactProgressTotal: {
    ...typography.bodySmall,
  },
  exceededText: {
    ...typography.caption,
    color: colors.success,
    position: 'absolute',
    bottom: -18,
    textAlign: 'center',
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

  // Updated Modal styles
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
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  bigNumberContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 70,
    textAlign: 'center',
  },
  manualEditInput: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 70,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    minWidth: 120,
    paddingHorizontal: 8,
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  unitLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  pencilButton: {
    padding: 4,
  },
  pencilIcon: {
    fontSize: 18,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  minusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  numberDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  incrementLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
  },
});

export default MonthlyChallengeSelector;
