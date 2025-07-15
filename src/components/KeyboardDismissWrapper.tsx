import React from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';

interface KeyboardDismissWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  keyboardAvoidingViewProps?: any;
  behavior?: 'height' | 'position' | 'padding';
  keyboardVerticalOffset?: number;
  enabled?: boolean;
}

/**
 * Reusable component that provides consistent keyboard dismissal behavior
 * across the entire app for both iOS and Android
 */
const KeyboardDismissWrapper: React.FC<KeyboardDismissWrapperProps> = ({
  children,
  style,
  keyboardAvoidingViewProps,
  behavior,
  keyboardVerticalOffset,
  enabled = true,
}) => {
  const handleDismiss = () => {
    if (enabled) {
      Keyboard.dismiss();
    }
  };

  const defaultBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const defaultOffset = Platform.OS === 'ios' ? 0 : 20;

  return (
    <TouchableWithoutFeedback onPress={handleDismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={behavior || defaultBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset || defaultOffset}
        style={[{flex: 1}, style]}
        {...keyboardAvoidingViewProps}>
        {children}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default KeyboardDismissWrapper;
