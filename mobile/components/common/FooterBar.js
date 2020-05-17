import React, {Component} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import IconFontisto from 'react-native-vector-icons/Fontisto';
import {
    StyleSheet,
    TouchableOpacity,
    Animated
} from 'react-native';
import Slider from '@react-native-community/slider';

import {FooterBarStyles, SliderStyle} from '../../styles/common/FooterBarStyles';
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
            fadeAnim: new Animated.Value(1),
        };
    }

    componentDidMount() {
        setTimeout(() => {
            if (this.props.shown) {
                this.show();
            } else {
                this.hide();
            }
        }, 1000);
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

    render() {
        return (
            <Animated.View style={[styles.footer, {opacity: this.state.fadeAnim}]}>

                <TouchableOpacity style={styles.button} onPress={this.props.onLeftButtonPressed}>
                    <Ionicons name={'ios-search'} size={25} style={{ marginLeft: 20 }} />
                </TouchableOpacity>

                <Slider
                    style={styles.slider}
                    disabled={this.props.disabled}
                    value={this.props.value}
                    onSlidingComplete={this.props.onSlidingComplete}
                />

                <TouchableOpacity style={styles.button} onPress={this.props.onRightButtonPressed}>
                    <IconFontisto name={'bookmark'} size={25} style={{ marginRight: 20 }} />
                </TouchableOpacity>

            </Animated.View>
        );
    }
}

export default FooterBar;
