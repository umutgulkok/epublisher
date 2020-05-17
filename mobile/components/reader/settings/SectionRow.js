import React, {Component} from 'react'
import {View, Text} from 'react-native'

import SettingsRowStyles from '../../../styles/readerSettings/SettingsRowStyles'

const {
    container,
    containerSection,
    textSection,
} = SettingsRowStyles

class SectionRow extends Component {
    render() {
        return (
            <View style={container}>
                <View style={containerSection}>
                    <Text style={textSection} numberOfLines={1} ellipsizeMode={'tail'}>
                        {this.props.text}
                    </Text>
                </View>
                <View>{this.props.children}</View>
            </View>
        )
    }
}

export {SectionRow}
