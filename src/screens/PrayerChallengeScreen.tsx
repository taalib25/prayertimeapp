import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';

const PrayerChallengeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Salah Screen</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
  },
});

export default PrayerChallengeScreen;
