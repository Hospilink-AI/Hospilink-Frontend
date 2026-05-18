// STEP 5: Background notification handler
// This must be at the top level, before AppRegistry

import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './src/app/_layout';
import { name as appName } from './app.json';

// Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📦 Background notification received:', remoteMessage);
  
  // Process notification data
  // Update local storage or cache if needed
  // Note: You cannot update UI here, only process data
});

AppRegistry.registerComponent(appName, () => App);
