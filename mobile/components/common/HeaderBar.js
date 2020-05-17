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

import BarButtonStyle from '../../styles/common/BarButtonStyles';
import {HeaderBarStyles, HeaderBarTitleStyle, colors} from '../../styles/common/HeaderBarStyles';
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
            header: HeaderBarStyles(isLandscape, false),
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
                    <Ionicons name={this.props.rightIconName} size={34} color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>

            </Animated.View>
        );
    }
}

export default HeaderBar;
