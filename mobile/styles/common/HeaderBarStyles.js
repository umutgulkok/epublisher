import {Alert, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getStatusBarHeight } from 'react-native-status-bar-height';

let initialIsLandScape = false;
let initialStatusBarHeight = 0;
const bugFixedGetStatusBarHeight = (isLandscape) => {
    if (!initialStatusBarHeight) {
        initialStatusBarHeight = getStatusBarHeight();
        initialIsLandScape = isLandscape;
        return initialStatusBarHeight;
    } else {
        if (initialIsLandScape == isLandscape) {
            // The library returns the correct value for the first time
            return initialStatusBarHeight;
        } else {
            // The library still returns the initial one
            if (isLandscape) {
                if (initialStatusBarHeight > 40) {
                    // Has notch
                    return initialStatusBarHeight - 20;
                }
                return initialStatusBarHeight;
            } else {
                return initialStatusBarHeight + 20;
            }
        }
    }
};

const HeaderBarStyles = (isLandscape = false, isModal = false) => {
    let notchOrStatusBarIncrement = getStatusBarHeight();
    if (!isModal) {
        notchOrStatusBarIncrement = bugFixedGetStatusBarHeight(isLandscape);
    }
    if (isLandscape && !DeviceInfo.isTablet()) {
        // status bar not visible on phones when orientation is landscape
        notchOrStatusBarIncrement -= 10;
    } else if (DeviceInfo.isTablet()) {
        // tablet adjustment
        notchOrStatusBarIncrement += 8;
    }
    return {
        padding: 10,
        ...Platform.select({
            ios: {
                paddingTop: notchOrStatusBarIncrement
            },
            android: {
                paddingTop: notchOrStatusBarIncrement - 20
            },
        }),
        height: notchOrStatusBarIncrement + 40,
        paddingBottom: 10,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    }
};

const HeaderBarTitleStyle = {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'System'
};

const colors = {
    'dark': {
        textColor: '#eee',
        iconColor: '#3b82f6',
        backgroundColor: '#121312',
    },
    'light': {
        textColor: '#111',
        iconColor: '#3478f5',
        backgroundColor: '#f3f3f3',
    }
};

export {
    HeaderBarStyles,
    HeaderBarTitleStyle,
    colors
};
