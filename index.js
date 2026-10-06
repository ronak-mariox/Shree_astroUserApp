/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/services/push';

/**
 * Here rather than inside the app: FCM starts this bundle headless for a push
 * that arrives while the app is closed, and the handler must already be
 * registered by then. A no-op without Firebase in the build.
 */
registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
