// Polyfills for Dynamic SDK in React Native
import '@react-native-anywhere/polyfill-base64';
import 'react-native-get-random-values';

// Polyfill for events module used by ZeroDev SDK
if (!global.EventEmitter) {
  const { EventEmitter } = require('events');
  global.EventEmitter = EventEmitter;
}

