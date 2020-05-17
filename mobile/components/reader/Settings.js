import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
} from 'react-native';
import ReactNativeSettingsPage, {
    SectionRow,
    SwitchRow,
    CheckRow,
    SliderRow
} from './settings/ReactNativeSettingsPage'
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import {PreferenceKeys, storePreference} from '../../helpers/Preferences';
import {ThemeKeys} from '../../helpers/Themes';
import BarButtonStyle from '../../styles/common/BarButtonStyles';
import {HeaderBarStyles, HeaderBarTitleStyle} from '../../styles/common/HeaderBarStyles';
import ModalContainerStyle from '../../styles/common/ModalContainerStyles';

const continuousFlowKey = 'scrolled-continuous';
const paginatedFlowKey = 'paginated';

class Settings extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: '',
            flow: props.flow,
            fontSize: props.fontSize,
            theme: props.theme,
            modalVisible: false
        };
    }

    componentDidMount() {
        if (this.props.shown) {
            this.setState({modalVisible: true});
        } else {
            this.setState({modalVisible: false});
        }
    }

    show() {
        this.setState({modalVisible: true});
    }

    hide() {
        this.saveSettings();
        this.props.settingsChangeHook({
            flow: this.state.flow,
            fontSize: this.state.fontSize,
            theme: this.state.theme,
        });
        this.setState({modalVisible: false});
    }

    saveSettings() {
        storePreference(PreferenceKeys.flow, this.state.flow)
        storePreference(PreferenceKeys.fontSize, this.state.fontSize)
        storePreference(PreferenceKeys.theme, this.state.theme)
    }

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton}/>
                        <Text style={styles.headerTitle}>Okuma Ayarları</Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => this.hide()}
                        >
                            <EvilIcons name="close" size={34}/>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.container}>
                        <ReactNativeSettingsPage>
                            <SwitchRow
                                text="  Aşağı Doğru Kaydır"
                                _value={this.state.flow === continuousFlowKey}
                                _onValueChange={value => {
                                    this.setState({
                                        flow: value ? continuousFlowKey : paginatedFlowKey
                                    });
                                }}
                            />
                            <SliderRow
                                text="Metin Boyutu"
                                _min={10}
                                _max={50}
                                _value={this.state.fontSize}
                                _onValueChange={(value) => {
                                    this.setState({
                                        fontSize: value
                                    });
                                }}
                            />
                            <SectionRow text='Renk Teması'>
                                <CheckRow
                                    text='Beyaz Zemin'
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
                                    text='Sarı Zemin'
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
                                    text='Siyah Zemin'
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
    container: ModalContainerStyle,
    headerTitle: HeaderBarTitleStyle,
    header: HeaderBarStyles(false, true),
    backButton: BarButtonStyle,
});

export default Settings;
