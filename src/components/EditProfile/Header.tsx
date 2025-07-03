import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import SvgIcon from '../SvgIcon';
import {colors, spacing} from '../../utils/theme';

const Header: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Pressable
        style={({pressed}) => [
          styles.backButton,
          pressed && styles.pressedState,
        ]}
        onPress={() => navigation.goBack()}>
        <SvgIcon name="backBtn" size={28} color={colors.text.dark} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 48,
    paddingTop: spacing.xxl,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 24,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});

export default Header;
