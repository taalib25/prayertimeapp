import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
  TouchableWithoutFeedback,
} from 'react-native';
import {LongPressGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import {colors} from '../utils/theme';
// import {
//   Menu,
//   MenuOptions,
//   MenuOption,
//   MenuTrigger,
// } from 'react-native-popup-menu';

interface WidgetCardProps {
  title: string;
  progress: number;
  count: number;
  total: number;
  onPrayJamaath?: () => void;
  onPrayAtHome?: () => void;
  onSkip?: () => void;
  enableLongPress?: boolean;
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  title = 'Fajr Prayer',
  progress = 0.7,
  count = 5,
  total = 7,
  onPrayJamaath = () => console.log('Pray Jamaath'),
  onPrayAtHome = () => console.log('Pray at Home'),
  onSkip = () => console.log('Skipped'),
  enableLongPress = true,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  const handleLongPress = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && enableLongPress) {
      Vibration.vibrate(50); // Haptic feedback
      scale.value = withSpring(0.97);
      setMenuVisible(true);
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <View style={styles.container}>
      {/* <Menu visible={menuVisible} onBackdropPress={() => setMenuVisible(false)}>
        <MenuTrigger customStyles={{triggerOuterWrapper: styles.invisible}}>
          <View />
        </MenuTrigger>

        <MenuOptions>
          <MenuOption onSelect={onPrayJamaath} text="Pray in Jamaath" />
          <MenuOption onSelect={onPrayAtHome} text="Pray at Home" />
          <MenuOption onSelect={onSkip} text="Skip Today" />
        </MenuOptions>
      </Menu> */}

      <LongPressGestureHandler
        onHandlerStateChange={handleLongPress}
        minDurationMs={800}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}>
            <View style={styles.innerContainer}>
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{title}</Text>
                  <View style={styles.smallCountContainer}>
                    <Text style={styles.smallCountText}>
                      {count}/{total}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  {' '}
                  <Progress.Bar
                    progress={progress}
                    width={null}
                    height={8}
                    color={colors.success}
                    unfilledColor={colors.background.surface}
                    borderWidth={0}
                    borderRadius={4}
                  />
                </View>
                <Text style={styles.hint}>
                  {enableLongPress ? 'Hold to show options' : ''}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </LongPressGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
  },
  invisible: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallCountContainer: {
    backgroundColor: colors.background.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  smallCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.dark,
    flex: 1,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
});

export default WidgetCard;
