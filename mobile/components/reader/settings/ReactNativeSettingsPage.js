import React from 'react'
import {ScrollView, View} from 'react-native'

import SettingsStyles from '../../../styles/readerSettings/SettingsStyles'

const ReactNativeSettingsPage = props => (
    <ScrollView style={SettingsStyles.container}>
        <View style={SettingsStyles.content}>
            {props.children}
        </View>
    </ScrollView>
)

export * from './SectionRow'
export * from './NavigateRow'
export * from './SwitchRow'
export * from './CheckRow'
export * from './SliderRow'
export default ReactNativeSettingsPage
