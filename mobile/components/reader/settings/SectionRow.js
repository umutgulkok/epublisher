import React, {Component} from 'react'
import {View, Text} from 'react-native'
import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';

import {SettingsRowStyles, colors} from '../../../styles/readerSettings/SettingsRowStyles'

const {
    container,
    containerSection,
    textSection,
} = SettingsRowStyles

class SectionRow extends Component {
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
            <View style={{...container,
                backgroundColor: colors[this.state.darkMode].backgroundColor,
                shadowColor: colors[this.state.darkMode].shadowColor}}>
                <View style={containerSection}>
                    <Text style={{...textSection, color: colors[this.state.darkMode].textColor}}
                          numberOfLines={1} ellipsizeMode={'tail'}>
                        {this.props.text}
                    </Text>
                </View>
                <View>{this.props.children}</View>
            </View>
        )
    }
}

export {SectionRow}
