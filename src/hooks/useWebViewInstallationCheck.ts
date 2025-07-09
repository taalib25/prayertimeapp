import React, {useEffect} from 'react';
import {Alert} from 'react-native';

/**
 * A hook that provides instructions for installing react-native-webview
 * if it's missing. Call this hook at the top level of your component
 * that uses YouTube iframe to provide helpful instructions to developers.
 */
export const useWebViewInstallationCheck = () => {
  useEffect(() => {
    try {
      require('react-native-webview');
    } catch (error) {
      console.error('react-native-webview is not installed properly');

      // Only show alert in development mode
      if (__DEV__) {
        Alert.alert(
          'Missing dependency',
          'The react-native-webview package is required for YouTube videos. ' +
            'Please install it with:\n\n' +
            'npm install --save react-native-webview\n\n' +
            'Then rebuild your app.',
          [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          {cancelable: false},
        );
      }
    }
  }, []);
};
