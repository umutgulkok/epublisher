import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { CheckBox } from 'react-native-elements'
import Ionicons from 'react-native-vector-icons/Ionicons';

import SettingsRowStyles from '../../../styles/readerSettings/SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    checkSt,
    iconLeft,
    text,
} = SettingsRowStyles

class CheckRow extends Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPressCallback}>
                <View style={containerInSection}>
                    <View style={containerInnerSection}>
                        <Ionicons name={this.props.iconName} size={24} style={iconLeft} />
                        <Text style={text} numberOfLines={1} ellipsizeMode={'tail'}>
                            {this.props.text}
                        </Text>
                        <CheckBox
                            style={checkSt}
                            checkedIcon='check'
                            uncheckedIcon={null}
                            checkedColor={this.props._color ? this.props._color : '#90caf9'}
                            checked={this.props._value}
                            onPress={this.props._onValueChange} />
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}

export { CheckRow }
