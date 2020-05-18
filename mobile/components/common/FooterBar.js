import React, {Component} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import IconFontisto from 'react-native-vector-icons/Fontisto';
import {
    StyleSheet,
    TouchableOpacity,
    Animated
} from 'react-native';
import Slider from '@react-native-community/slider';
import { initialMode as initialDarkMode, eventEmitter as darkModeEventEmitter } from 'react-native-dark-mode';

import {FooterBarStyles, SliderStyle, colors} from '../../styles/common/FooterBarStyles';
import BarButtonStyle from '../../styles/common/BarButtonStyles';

function getButtonStyle() {
    const style = JSON.parse(JSON.stringify(BarButtonStyle));
    style.width = 40;
    return style;
}

const styles = StyleSheet.create({
    footer: FooterBarStyles,
    slider: SliderStyle,
    button: getButtonStyle()
});

class FooterBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            darkMode: initialDarkMode,
            fadeAnim: new Animated.Value(1),
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));

        setTimeout(() => {
            if (this.props.shown) {
                this.show();
            } else {
                this.hide();
            }
        }, 1000);
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.shown !== this.props.shown) {
            if (this.props.shown) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    show() {
        const timing = Animated.timing;

        Animated.sequence([
            timing(this.state.fadeAnim, {
                toValue: 1,
                duration: 20,
                useNativeDriver: true
            })
        ]).start();
    }

    hide() {
        const timing = Animated.timing;

        Animated.sequence([
            timing(this.state.fadeAnim, {
                toValue: 0,
                duration: 20,
                useNativeDriver: true
            })
        ]).start();
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    render() {
        return (
            <Animated.View style={{...styles.footer, backgroundColor: colors[this.state.darkMode].backgroundColor, opacity: this.state.fadeAnim}}>
                <Slider
                    style={styles.slider}
                    disabled={this.props.disabled}
                    value={this.props.value}
                    onSlidingComplete={this.props.onSlidingComplete}
                    thumbTintColor={colors[this.state.darkMode].sliderThumbColor}
                />

                <TouchableOpacity style={styles.button} onPress={this.props.onNavButtonPressed}>
                    <Ionicons name={'ios-list'} size={25} style={{ marginLeft: 10, marginRight: 0 }}
                              color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={this.props.onSearchButtonPressed}>
                    <Ionicons name={'ios-search'} size={25} style={{ margin: 0 }}
                              color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={this.props.onBookmarkButtonPressed}>
                    <IconFontisto name={'bookmark'} size={25} style={{ marginLeft: 0, marginRight: 20 }}
                                  color={colors[this.state.darkMode].iconColor} />
                </TouchableOpacity>
            </Animated.View>
        );
    }
}

export default FooterBar;
