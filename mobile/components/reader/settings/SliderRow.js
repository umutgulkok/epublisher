import React, {Component} from 'react'
import {View, Text, TouchableOpacity} from 'react-native'
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';

import {SettingsRowStyles, colors} from '../../../styles/readerSettings/SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    sliderSt,
    iconLeft,
    iconRight,
    textStyle
} = SettingsRowStyles

class SliderRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            darkMode: initialDarkMode
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    render() {
        return (
            <TouchableOpacity onPress={this.props.onPressCallback}>
                <View style={{...containerInSection,
                    backgroundColor: colors[this.state.darkMode].backgroundColor,
                    borderColor: colors[this.state.darkMode].borderColor}}>
                    <View style={containerInnerSection}>
                        <Ionicons name={this.props.iconName} size={24} style={iconLeft}/>
                        <Text style={{...textStyle, color: colors[this.state.darkMode].textColor}}
                              numberOfLines={1} ellipsizeMode={'tail'}>
                            {this.props.text}
                        </Text>
                        {
                            this.props.navigate
                                ? <Ionicons name={'ios-arrow-forward'} size={24} style={iconRight}/>
                                : null
                        }
                    </View>
                </View>
                <Slider
                    style={sliderSt}
                    thumbTintColor={colors[this.state.darkMode].sliderThumbColor}
                    maximumValue={this.props._max}
                    minimumValue={this.props._min}
                    value={this.props._value}
                    onValueChange={this.props._onValueChange}/>
            </TouchableOpacity>
        )
    }
}

export {SliderRow}
