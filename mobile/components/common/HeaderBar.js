import React, {Component} from 'react';
import TextTicker from 'react-native-text-ticker'
import Orientation from 'react-native-orientation-locker';
import {
    StyleSheet,
    TouchableOpacity,
    Animated,
    Text
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { initialMode as initialDarkMode, eventEmitter as darkModeEventEmitter } from 'react-native-dark-mode';
import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {getStatusBarHeight} from 'react-native-status-bar-height';

import {getTitleMaxWidth} from '../../helpers/Utils';

class HeaderBar extends Component {
    constructor(props) {
        super(props);

        this.initialHideTimeout = null;
        this.barsShown = true;

        const isLandscape = Orientation.getInitialOrientation().startsWith('LANDSCAPE');
        this.styles = this._getStyles(isLandscape);
        
        this.state = {
            darkMode: initialDarkMode,
            fadeAnim: new Animated.Value(1),
            measurementMode: true,
            useTextTicker: true,
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));
        Orientation.addOrientationListener(this._orientationDidChange);

        this.initialHideTimeout = setTimeout(() => {
            if (this.props.alwaysShown) {
                this.show();
            } else {
                this.hide();
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearTimeout(this.initialHideTimeout);
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
        Orientation.removeOrientationListener(this._orientationDidChange);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.alwaysShown !== this.props.alwaysShown) {
            if (this.props.alwaysShown) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    show() {
        const timing = Animated.timing;

        timing(this.state.fadeAnim, {
            toValue: 1,
            duration: 20,
            useNativeDriver: true
        }).start();

        this.barsShown = true;
    }

    hide() {
        const timing = Animated.timing;

        timing(this.state.fadeAnim, {
            toValue: 0,
            duration: 20,
            useNativeDriver: true
        }).start();

        this.barsShown = false;
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    _orientationDidChange = (orientation) => {
        this.styles = this._getStyles(orientation.startsWith('LANDSCAPE'));
        this.setState({
            measurementMode: true
        });
        this.forceUpdate();
    }

    _getStyles = (isLandscape) => {
        return StyleSheet.create({
            headerTitle: HeaderBarTitleStyle,
            header: HeaderBarStyle(isLandscape, false),
            button: BarButtonStyle,
        });
    }

    _decideUsingTextTicker(width) {
        if (width > getTitleMaxWidth()) {
            this.setState({
                measurementMode: false,
                useTextTicker: true
            });
        } else {
            this.setState({
                measurementMode: false,
                useTextTicker: false
            });
        }
    }

    _getHeadingBarStyle() {
        let style = JSON.parse(JSON.stringify(this.styles.header));
        return [style, {opacity: this.state.fadeAnim}];
    }

    render() {
        return (
            <Animated.View
                style={[...this._getHeadingBarStyle(), {
                    backgroundColor: colors[this.state.darkMode].backgroundColor
                }]}
            >
                <TouchableOpacity style={this.styles.button} onPress={this.props.onLeftButtonPressed}>
                    <Ionicons name={this.props.leftIconName} size={30} color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>

                {this.props.title.length > 0 ?
                    this.state.measurementMode ?
                        <Text style={{...this.styles.headerTitle, color: colors[this.state.darkMode].textColor}}
                              onLayout={(event) => {
                                  this._decideUsingTextTicker(event.nativeEvent.layout.width);
                              }}>
                            {this.props.title}
                        </Text>
                        :
                        this.state.useTextTicker ?
                            <TextTicker
                                style={{width: getTitleMaxWidth(), ...this.styles.headerTitle, color: colors[this.state.darkMode].textColor}}
                                duration={this.props.title.length * 200}
                                loop={true}
                                repeatSpacer={50}
                                marqueeDelay={1000}
                            >
                                {this.props.title}
                            </TextTicker>
                            :
                            <Text style={{...this.styles.headerTitle, color: colors[this.state.darkMode].textColor}} >
                                {this.props.title}
                            </Text>
                    : null}

                <TouchableOpacity style={this.styles.button} onPress={this.props.onRightButtonPressed}>
                    <Ionicons name={this.props.rightIconName} size={30} color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>

            </Animated.View>
        );
    }
}

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

const HeaderBarStyle = (isLandscape = false, isModal = false) => {
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

const BarButtonStyle = {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 8,
    marginRight: 8,
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

export default HeaderBar;
