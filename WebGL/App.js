// App.js
import { Platform } from 'react-native';
import { Canvas } from '@react-three/fiber';

let App;
if (Platform.OS === 'web') {
  App = require('./App.web').default;
} else {
  App = require('./App.native').default;
}

export default App;
