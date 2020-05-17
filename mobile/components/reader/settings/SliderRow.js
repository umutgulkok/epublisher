import React, {Component} from 'react'
import {View, Text, TouchableOpacity} from 'react-native'
import {Slider} from 'react-native-elements'
import Ionicons from 'react-native-vector-icons/Ionicons';

import SettingsRowStyles from '../../../styles/readerSettings/SettingsRowStyles'

const {
    containerInSection,
    containerInnerSection,
    sliderSt,
    iconLeft,
    iconRight,
    text
} = SettingsRowStyles

class SliderRow extends Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPressCallback}>
                <View style={containerInSection}>
                    <View style={containerInnerSection}>
                        <Ionicons name={this.props.iconName} size={24} style={iconLeft}/>
                        <Text style={text} numberOfLines={1} ellipsizeMode={'tail'}>
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
                    thumbTintColor={this.props._color}
                    maximumValue={this.props._max}
                    minimumValue={this.props._min}
                    value={this.props._value}
                    onValueChange={this.props._onValueChange}/>
            </TouchableOpacity>
        )
    }
}

export {SliderRow}
