import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import Navigator from './routes/navigation';

AppRegistry.registerComponent(appName, () => Navigator);
