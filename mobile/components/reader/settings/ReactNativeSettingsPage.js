import React, {Component} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'

import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';
import {colors} from './SettingsRowStyles'

class ReactNativeSettingsPage extends Component {
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
        return (<ScrollView style={{...styles.container, backgroundColor: colors[this.state.darkMode].backgroundColor}}>
                <View style={styles.content}>
                    {this.props.children}
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    }
});

export * from './SectionRow'
export * from './NavigateRow'
export * from './SwitchRow'
export * from './CheckRow'
export * from './SliderRow'
export default ReactNativeSettingsPage
