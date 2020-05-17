import React, {Component} from 'react'
import {View, Text, TouchableOpacity, Switch} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';

import SettingsRowStyles from '../../../styles/readerSettings/SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    iconLeft,
    text,
    switchSt
} = SettingsRowStyles

class SwitchRow extends Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPressCallback}>
                <View style={containerInSection}>
                    <View style={containerInnerSection}>
                        <Ionicons name={this.props.iconName} size={24} style={iconLeft}/>
                        <Text style={text} numberOfLines={1} ellipsizeMode={'tail'}>
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
