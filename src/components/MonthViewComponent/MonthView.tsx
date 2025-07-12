import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../../utils/theme';
import {typography} from '../../utils/typography';
import {CompactChallengeCard} from './CompactChallengeCard';

interface MonthData {
  monthLabel: string;
  year: number;
  zikr: {current: number; total: number};
  quran: {current: number; total: number};
  fajr: {current: number; total: number};
  isha: {current: number; total: number};
}

interface MonthViewProps {
  monthData: MonthData;
  index: number;
  currentPage: number;
  isCurrentMonth: boolean;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const MonthView: React.FC<MonthViewProps> = React.memo(
  ({monthData, index, currentPage, isCurrentMonth}) => {
    const isVisible = currentPage === index;

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
            total={600 * 30}
            backgroundColor="#E8F5E8"
            progressColor={colors.lightBlue}
            textColor={colors.text.prayerBlue}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            id={`${monthData.monthLabel}-${monthData.year}-quran`}
            title="Quran"
            subtitle="Minutes"
            current={monthData.quran.current * 15}
            total={15 * 30}
            backgroundColor="#E3F2FD"
            progressColor={colors.lightBlue}
            textColor={colors.text.prayerBlue}
            isVisible={isVisible}
          />

          <CompactChallengeCard
            id={`${monthData.monthLabel}-${monthData.year}-fajr`}
            title="Fajr"
            subtitle="Days"
            current={monthData.fajr.current}
            total={30}
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
            total={30}
            backgroundColor="#FCE4EC"
            progressColor={colors.lightBlue}
            textColor={colors.text.prayerBlue}
            isVisible={isVisible}
          />
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // More thorough comparison for monthData
    const prevData = prevProps.monthData;
    const nextData = nextProps.monthData;

    const isSameMonthData =
      prevData.monthLabel === nextData.monthLabel &&
      prevData.year === nextData.year &&
      prevData.zikr.current === nextData.zikr.current &&
      prevData.zikr.total === nextData.zikr.total &&
      prevData.quran.current === nextData.quran.current &&
      prevData.quran.total === nextData.quran.total &&
      prevData.fajr.current === nextData.fajr.current &&
      prevData.fajr.total === nextData.fajr.total &&
      prevData.isha.current === nextData.isha.current &&
      prevData.isha.total === nextData.isha.total;

    return (
      isSameMonthData &&
      prevProps.index === nextProps.index &&
      prevProps.currentPage === nextProps.currentPage
    );
  },
);

const styles = StyleSheet.create({
  monthContainer: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md, // Add bottom padding to prevent cutoff
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
    // paddingBottom: spacing.md, // Add bottom padding for the grid
  },
});

export default MonthView;
