// index.js  ← debe estar en la raíz del proyecto
import 'react-native-gesture-handler';      // si usas react-navigation
import { registerRootComponent } from 'expo';
import App from './src/App'; 

registerRootComponent(App);