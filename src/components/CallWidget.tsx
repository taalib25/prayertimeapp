import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import SvgIcon from './SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import UserService from '../services/UserService';

interface CallWidgetProps {
  onCallPreferenceSet: (needsCall: boolean) => void;
}

const CallWidget: React.FC<CallWidgetProps> = ({onCallPreferenceSet}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const userService = UserService.getInstance();

  useEffect(() => {
    checkIfFirstTimeUser();
  }, []);

  const checkIfFirstTimeUser = async () => {
    try {
      const systemData = await userService.getSystemData();

      // Show widget only if callPreference is null (user hasn't made a choice yet)
      if (systemData.callPreference === null) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking first time user status:', error);
    }
  };

  const handlePreference = async (needsCall: boolean) => {
    try {
      // Start fade-out animation immediately
      setIsFadingOut(true);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        // Save preference using the proper SystemData structure
        await userService.updateSystemData({
          callPreference: needsCall,
        });

        setIsVisible(false);
        onCallPreferenceSet(needsCall);
      });
    } catch (error) {
      console.error('Error saving call preference:', error);
      // Reset animation on error
      fadeAnim.setValue(1);
      setIsFadingOut(false);
    }
  };
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      {/* Header row with moon icon and title */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Do you want a wake-up call for daily Fajr prayer?
        </Text>
        <View style={styles.iconContainer}>
          <SvgIcon name="callMoon" size={78} color="#FFD700" />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.yesButton}
          onPress={() => handlePreference(true)}
          disabled={isFadingOut}>
          <Text style={styles.yesButtonText}>Yes, I need a call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.noButton}
          onPress={() => handlePreference(false)}
          disabled={isFadingOut}>
          <Text style={styles.yesButtonText}>No, I'll wake up myself</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2554',
    borderRadius: 12,
    padding: 20,
    paddingTop: 9,
    paddingBottom: 26,
    marginHorizontal: 5,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    // gap: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: '#FFFFFF',
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  yesButton: {
    backgroundColor: colors.primary,
    borderRadius: 120,
    padding: 12,
  },
  yesButtonText: {
    ...typography.headerProfile,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
  },
  noButton: {
    backgroundColor: '#3498db',
    borderRadius: 120,
    padding: 12,
  },
  noButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CallWidget;
