import SyncStorage from 'sync-storage';
import {ThemeKeys} from '../helpers/Themes';

const PreferenceKeys = {};
PreferenceKeys.flow = 'continuous';
PreferenceKeys.fontSize = 'fontSize';
PreferenceKeys.theme = 'theme';
PreferenceKeys.lastLocation = 'lastLocation';

const DefaultPreferences = {};
DefaultPreferences[PreferenceKeys.flow] = 'scrolled-continuous';
DefaultPreferences[PreferenceKeys.fontSize] = 20;
DefaultPreferences[PreferenceKeys.theme] = ThemeKeys.light;
DefaultPreferences[PreferenceKeys.lastLocation] = undefined;

const initPreferences = () => {
    return SyncStorage.init();
};

const storePreference = (key, value) => {
    try {
        SyncStorage.set('@' + key, value);
    } catch (error) {
        console.error(error);
    }
};

const readPreference = (key) => {
    let preference = null;
    try {
        preference = SyncStorage.get('@' + key);
    } catch (error) {
    }
    if (!preference) {
        preference = DefaultPreferences[key];
        if (preference) {
            storePreference(key, preference);
        }
    }
    return preference;
};

export {
    initPreferences,
    storePreference,
    readPreference,
    PreferenceKeys,
    DefaultPreferences
}
