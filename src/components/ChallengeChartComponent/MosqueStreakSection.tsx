import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MosqueStreakChart from './MosqueStreakChart';

interface MosqueStreakSectionProps {
  onSeeAllPress?: () => void;
}

const MosqueStreakSection: React.FC<MosqueStreakSectionProps> = ({
  onSeeAllPress,
}) => {
  return (
    <View style={styles.container}>
      <MosqueStreakChart />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});

export default MosqueStreakSection;
