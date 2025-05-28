import { createRef } from 'react';

export const navigationRef = createRef();

export function navigate(name, params) {
  if (navigationRef.current) {
    // Verify the screen exists in the navigator
    navigationRef.current.navigate(name, params);
  } else {
    console.log('Navigation attempted before navigation was ready:', name);
  }
}
