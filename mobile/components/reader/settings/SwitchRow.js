import React, {Component} from 'react'
import {View, Text, TouchableOpacity, Switch} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';

import {SettingsRowStyles, colors} from './SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    iconLeft,
    textStyle,
    switchSt
} = SettingsRowStyles


class SwitchRow extends Component {
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
                        <Switch
                            style={switchSt}
                            disabled={this.props._disabled}
                            onValueChange={this.props._onValueChange}
                            value={this.props._value}/>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}

export {SwitchRow}
