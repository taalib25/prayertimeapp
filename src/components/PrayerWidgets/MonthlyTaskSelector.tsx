import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
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
import {
  MonthlyTaskProvider,
  useMonthlyTask,
} from '../../contexts/MonthlyTaskContext';

interface UserGoals {
  monthlyZikrGoal: number;
  monthlyQuranPagesGoal: number;
  monthlyCharityGoal: number;
  monthlyFastingDaysGoal: number;
}

interface MonthlyChallengeProps {
  userGoals?: UserGoals;
}

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  currentValue: number;
  title: string;
  isLoading: boolean;
}

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  currentValue,
  title,
  isLoading,
}) => {
  const [tempValue, setTempValue] = useState(currentValue);

  React.useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue, visible]);

  const handleSave = async () => {
    try {
      await onSave(tempValue);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text) || 0;
    setTempValue(Math.max(0, num));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.countContainer}>
            <TextInput
              style={styles.countInput}
              value={tempValue.toString()}
              onChangeText={handleTextChange}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              textAlign="center"
              editable={!isLoading}
            />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}>
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const CompactChallengeCard: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  backgroundColor: string;
  progressColor: string;
  textColor: string;
  isVisible: boolean;
  isEditable?: boolean;
  onEdit?: () => void;
  todayValue?: number;
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
  }) => {
    const exceededGoal = current > total;
    const actualProgressColor = exceededGoal ? colors.success : progressColor;

    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
      const percentage = exceededGoal
        ? 100
        : Math.min((current / total) * 100, 100);
      return Math.round(percentage);
    }, [current, total, exceededGoal]);

    return (
      <Pressable
        style={[styles.compactCard, {backgroundColor}]}
        onPress={isEditable ? onEdit : undefined}
        disabled={!isEditable}>
        <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>

        <View style={styles.compactProgressContainer}>
          <AnimatedCircularProgress
            size={140}
            width={12} // Increased stroke thickness
            fill={progressPercentage}
            tintColor={actualProgressColor}
            backgroundColor={colors.background.surface}
            rotation={0}
            lineCap="round"
            duration={0} // No animation - instant update
          >
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
          {/* {exceededGoal && (
            <View style={styles.exceededIndicator}>
              <Text style={styles.exceededText}>Goal Exceeded! 🎉</Text>
            </View>
          )} */}
        </View>

        {subtitle && (
          <Text style={[styles.compactSubtitle, {color: textColor}]}>
            {subtitle}
          </Text>
        )}

        {/* {isEditable && (
          <View style={styles.todayContainer}>
            <Text style={styles.todayText}>Today: {todayValue}</Text>
            <Text style={styles.editHint}>Tap to edit</Text>
          </View>
        )} */}
      </Pressable>
    );
  },
  // Simplified comparison - only re-render when essential values change
  (prevProps, nextProps) => {
    return (
      prevProps.current === nextProps.current &&
      prevProps.total === nextProps.total &&
      prevProps.todayValue === nextProps.todayValue &&
      prevProps.isVisible === nextProps.isVisible
    );
  },
);

const MonthlyChallengeContent: React.FC = () => {
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
    setEditingType(type);
    setEditModalVisible(true);
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

  const getModalProps = () => {
    if (editingType === 'zikr') {
      return {
        title: 'Update Zikr Count',
        currentValue: todayData.zikr,
      };
    } else if (editingType === 'quran') {
      return {
        title: 'Update Quran Pages',
        currentValue: todayData.quranPages,
      };
    }
    return {
      title: '',
      currentValue: 0,
    };
  };

  // Memoized MonthView component for better performance
  const MonthView = React.memo<{monthData: any; index: number}>(
    ({monthData, index}) => {
      const isVisible = currentPage === index;
      const isCurrentMonth = index === monthlyData.length - 1;

      return (
        <View style={styles.monthContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.monthTitle}>
              {monthData.monthLabel} {monthData.year}
            </Text>
          </View>

          <View style={styles.compactCardsGrid}>
            <CompactChallengeCard
              id={`${monthData.monthLabel}-${monthData.year}-zikr`}
              title="Zikr"
              subtitle="Monthly"
              current={monthData.zikr.current}
              total={monthData.zikr.total}
              backgroundColor="#E8F5E8"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              isEditable={isCurrentMonth}
              onEdit={() => handleEdit('zikr')}
              todayValue={isCurrentMonth ? todayData.zikr : 0}
            />

            <CompactChallengeCard
              id={`${monthData.monthLabel}-${monthData.year}-quran`}
              title="Quran"
              subtitle="Pages"
              current={monthData.quran.current}
              total={monthData.quran.total}
              backgroundColor="#E3F2FD"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
              isEditable={isCurrentMonth}
              onEdit={() => handleEdit('quran')}
              todayValue={isCurrentMonth ? todayData.quranPages : 0}
            />

            <CompactChallengeCard
              id={`${monthData.monthLabel}-${monthData.year}-fajr`}
              title="Fajr"
              subtitle="Days"
              current={monthData.fajr.current}
              total={monthData.fajr.total}
              backgroundColor="#FFF3E0"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
            />

            <CompactChallengeCard
              id={`${monthData.monthLabel}-${monthData.year}-isha`}
              title="Isha"
              subtitle="Days"
              current={monthData.isha.current}
              total={monthData.isha.total}
              backgroundColor="#FCE4EC"
              progressColor={colors.lightBlue}
              textColor={colors.text.prayerBlue}
              isVisible={isVisible}
            />
          </View>
        </View>
      );
    },
    (prevProps, nextProps) =>
      prevProps.monthData === nextProps.monthData &&
      prevProps.index === nextProps.index,
  );

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
            <MonthView monthData={monthData} index={index} />
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicator */}
      {monthlyData.length > 1 && (
        <View style={styles.paginationContainer}>
          {monthlyData.map((monthData, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => pagerRef.current?.setPage(index)}>
              <View
                style={[
                  styles.paginationDot,
                  currentPage === index && styles.paginationDotActive,
                  index === getCurrentMonthIndex() &&
                    styles.paginationDotCurrent,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

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

const MonthlyChallengeSelector: React.FC<MonthlyChallengeProps> = ({
  userGoals,
}) => {
  return (
    <MonthlyTaskProvider userGoals={userGoals}>
      <MonthlyChallengeContent />
    </MonthlyTaskProvider>
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
    fontSize: 28,
    lineHeight: 36,
  },
  compactProgressTotal: {
    ...typography.bodySmall,
    fontSize: 16,
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
  paginationDotCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
  saveButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
  },
});

export default MonthlyChallengeSelector;
