import {useCallback} from 'react';
import {Keyboard} from 'react-native';

/**
 * Hook that provides keyboard dismissal functionality
 * Can be used in any component that needs to handle keyboard dismissal
 */
export const useKeyboardDismiss = () => {
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    dismissKeyboard,
  };
};

export default useKeyboardDismiss;
