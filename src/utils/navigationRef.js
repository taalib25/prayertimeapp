import { navigationRef } from '../../App';

// Navigation utilities that can be used from anywhere in the app
export function navigate(routeName, params) {
  navigationRef.current?.navigate(routeName, params);
}

export function goBack() {
  navigationRef.current?.goBack();
}

export function reset(routeName, params) {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: routeName, params }],
  });
}

export function getCurrentRoute() {
  return navigationRef.current?.getCurrentRoute();
}

// Specific navigation functions for your app
export function navigateToFakeCall() {
  navigate('FakeCallScreen');
}

export function navigateToLogin() {
  reset('Login');
}

export function navigateToMainApp() {
  reset('MainApp');
}
