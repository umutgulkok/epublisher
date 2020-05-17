import React, {Component} from 'react'
import {View, Text, TouchableOpacity} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';

import SettingsRowStyles from '../../../styles/readerSettings/SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    iconLeft,
    iconRight,
    text,
} = SettingsRowStyles

class NavigateRow extends Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPressCallback}>
                <View style={containerInSection}>
                    <View style={containerInnerSection}>
                        <Ionicons name={this.props.iconName} size={24} style={iconLeft}/>
                        <Text style={text} numberOfLines={1} ellipsizeMode={'tail'}>
                            {this.props.text}
                        </Text>
                        <Ionicons name={'ios-arrow-forward'} size={24} style={iconRight}/>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}

export {NavigateRow}
