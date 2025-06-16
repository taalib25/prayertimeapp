import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {colors, spacing, borderRadius, shadows} from '../utils/theme';
import {typography} from '../utils/typography';

interface MosqueStreakChartProps {
  title?: string;
}

const MosqueStreakChart: React.FC<MosqueStreakChartProps> = ({
  title = '40 Day Challenge',
}) => {
  const screenWidth = Dimensions.get('window').width;
  // Simple dummy data for 40-day challenge showing 10 data points
  // Each point represents 4 days, showing mosque attendance streak (1-10 scale)
  const streakData = [2, 7, 8, 3, 5, 9, 4, 6, 8, 5];

  // Labels showing day ranges (4-day intervals)
  const labels = [
    '25/05',
    '26/05',
    '27/05',
    '28/05',
    '29/05',
    '30/05',
    '31/05',
    '01/06',
    '02/06',
    '03/06',
  ];
  const data = {
    labels: labels,
    datasets: [
      {
        data: streakData,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      },
    ],
  };
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.text.muted,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '0', // Hide dots for cleaner look
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.background.light,
      strokeWidth: 1,
    },
    decimalPlaces: 0,
    formatYLabel: (value: string) => `${value}`,
    style: {
      borderRadius: 0,
    },
    yAxisMin: 1,
    yAxisMax: 10,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier={false}
          style={styles.chart}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withDots={false}
          withShadow={false}
          withScrollableDot={false}
          withInnerLines={true}
          withOuterLines={false}
          withHorizontalLines={false}
          withVerticalLines={false}
          fromZero={false}
          segments={9}
          yAxisMin={1}
          yAxisMax={10}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  title: {
    ...typography.h3,
    color: colors.text.prayerBlue,
    marginBottom: 16,
    textAlign: 'left',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  chart: {
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
});

export default MosqueStreakChart;
