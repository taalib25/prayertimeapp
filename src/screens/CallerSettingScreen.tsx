import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {USER_STORAGE_KEYS} from '../types/User';

interface CallerSettingScreenProps {
  navigation: any;
}

const CallerSettingScreen: React.FC<CallerSettingScreenProps> = ({
  navigation,
}) => {
  const [fajrCallEnabled, setFajrCallEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.CALL_PREFERENCE,
      );
      if (saved !== null) {
        setFajrCallEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading caller settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const toggleFajrCall = async (value: boolean) => {
    try {
      setFajrCallEnabled(value);
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.CALL_PREFERENCE,
        JSON.stringify(value),
      );
    } catch (error) {
      console.error('Error saving caller settings:', error);
      // Revert the UI state if save failed
      setFajrCallEnabled(!value);
    }
  };
 
  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <SvgIcon name="backBtn" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caller Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Prayer Call Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Fajr Call</Text>
              <Text style={styles.settingDescription}>
                Enable fake calls during Fajr prayer time to help you wake up
              </Text>
            </View>
            <Switch
              value={fajrCallEnabled}
              onValueChange={toggleFajrCall}
              trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              thumbColor={fajrCallEnabled ? '#FFF' : '#FFF'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              When enabled, the app will simulate an incoming call during Fajr
              prayer time to help you wake up for the morning prayer. This is a
              gentle way to ensure you don't miss your prayers.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: '#666',
  },
  errorText: {
    ...typography.body,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    ...typography.button,
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: StatusBar.currentHeight || 0,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    ...typography.h2,
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Compensate for back button width
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    ...typography.bodyMedium,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  settingDescription: {
    ...typography.bodySmall,
    color: '#666',
    lineHeight: 18,
  },
  infoSection: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    ...typography.bodySmall,
    color: '#1565C0',
    lineHeight: 18,
  },
  clearButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  debugTitle: {
    ...typography.bodyMedium,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    ...typography.bodySmall,
    color: '#888',
    marginBottom: 4,
  },
});

export default CallerSettingScreen;
