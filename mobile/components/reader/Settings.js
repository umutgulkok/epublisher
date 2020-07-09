import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Modal,
} from 'react-native';
import ReactNativeSettingsPage, {
    SectionRow,
    SwitchRow,
    CheckRow,
    SliderRow
} from './settings/ReactNativeSettingsPage'
import LocalizedStrings from 'react-native-localization';
import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';

import {PreferenceKeys, storePreference} from '../../helpers/Preferences';
import {ThemeKeys} from '../../helpers/Themes';
import HeaderBar from '../../components/common/HeaderBar';

const continuousFlowKey = 'scrolled-continuous';
const paginatedFlowKey = 'paginated';

class Settings extends Component {
    constructor(props) {
        super(props);

        this.state = {
            darkMode: initialDarkMode,
            error: '',
            flow: props.flow,
            fontSize: props.fontSize,
            theme: props.theme,
            modalVisible: false
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));
        if (this.props.shown) {
            this.setState({modalVisible: true});
        } else {
            this.setState({modalVisible: false});
        }
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    show() {
        this.setState({modalVisible: true});
    }

    hide() {
        this._saveSettings();
        this.props.settingsChangeHook({
            flow: this.state.flow,
            fontSize: this.state.fontSize,
            theme: this.state.theme,
        });
        this.setState({modalVisible: false});
    }

    _saveSettings() {
        storePreference(PreferenceKeys.flow, this.state.flow);
        storePreference(PreferenceKeys.fontSize, this.state.fontSize);
        storePreference(PreferenceKeys.theme, this.state.theme)
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                >
                    <HeaderBar
                        title={strings.title}
                        alwaysShown={true}
                        rightIconName={'md-close'}
                        onRightButtonPressed={() => {
                            this.hide();
                        }}
                    />
                    <View style={styles.container}>
                        <ReactNativeSettingsPage>
                            <SwitchRow
                                text={strings.scrolling}
                                _value={this.state.flow === continuousFlowKey}
                                _onValueChange={value => {
                                    this.setState({
                                        flow: value ? continuousFlowKey : paginatedFlowKey
                                    });
                                }}
                            />
                            <SliderRow
                                text={strings.fontSize}
                                _min={10}
                                _max={50}
                                _value={this.state.fontSize}
                                _onValueChange={(value) => {
                                    this.setState({
                                        fontSize: value
                                    });
                                }}
                            />
                            <SectionRow text={strings.backgroundTheme}>
                                <CheckRow
                                    text={strings.lightBackground}
                                    onPressCallback={() => {
                                        this.setState({
                                            theme: ThemeKeys.light
                                        });
                                    }}
                                    _onValueChange={() => {
                                        this.setState({
                                            theme: ThemeKeys.light
                                        });
                                    }}
                                    _value={this.state.theme === ThemeKeys.light}
                                />
                                <CheckRow
                                    text={strings.sepiaBackground}
                                    onPressCallback={() => {
                                        this.setState({
                                            theme: ThemeKeys.yellow
                                        });
                                    }}
                                    _onValueChange={() => {
                                        this.setState({
                                            theme: ThemeKeys.yellow
                                        });
                                    }}
                                    _value={this.state.theme === ThemeKeys.yellow}
                                />
                                <CheckRow
                                    text={strings.darkBackground}
                                    onPressCallback={() => {
                                        this.setState({
                                            theme: ThemeKeys.dark
                                        });
                                    }}
                                    _onValueChange={() => {
                                        this.setState({
                                            theme: ThemeKeys.dark
                                        });
                                    }}
                                    _value={this.state.theme === ThemeKeys.dark}
                                />
                            </SectionRow>
                        </ReactNativeSettingsPage>
                    </View>
                </Modal>
            </View>
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

let strings = new LocalizedStrings({
    en: {
        lightBackground: 'Light',
        sepiaBackground: 'Sepia',
        darkBackground: 'Dark',
        backgroundTheme: 'Background Theme',
        fontSize: 'Font Size',
        scrolling: '  Scrolling',
        title: 'Reading Preferences'
    },
});

export default Settings;
