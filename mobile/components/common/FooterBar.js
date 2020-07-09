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
import {Platform} from 'react-native';

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

const FooterBarStyle = {
    backgroundColor: '#eeeeee',
    paddingTop: 0,
    bottom: 0,
    ...Platform.select({
        ios: {
            height: 74,
            paddingBottom: 10
        },
        android: {
            height: 54,
        },
    }),
    right: 0,
    left: 0,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
};

const BarButtonStyle = {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 8,
    marginRight: 8,
};

const SliderStyle = {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
    marginLeft: 25,
    marginRight: 0
};

const styles = StyleSheet.create({
    footer: FooterBarStyle,
    slider: SliderStyle,
    button: BarButtonStyle
});

const colors = {
    'dark': {
        textColor: '#eee',
        iconColor: '#3b82f6',
        backgroundColor: '#121312',
        sliderThumbColor: '#999'
    },
    'light': {
        textColor: '#111',
        iconColor: '#3478f5',
        backgroundColor: '#f3f3f3',
        sliderThumbColor: '#ffffff'
    }
};

export default FooterBar;
