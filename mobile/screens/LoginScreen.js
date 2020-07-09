import React from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { initialMode as initialDarkMode, eventEmitter as darkModeEventEmitter } from 'react-native-dark-mode';
import { MaterialIndicator } from 'react-native-indicators';
import AsyncStorage from '@react-native-community/async-storage';
import DeviceInfo from 'react-native-device-info';
import { JSHash, CONSTANTS } from "react-native-hash";
import LocalizedStrings from 'react-native-localization';
import {StyleSheet} from 'react-native';

import constants from '../constants';
import {joinPath} from '../helpers/Utils';
import {Platform} from 'react-native';

export default class LoginScreen extends React.Component {
    constructor(props) {
        super(props);

        this._prepareDeviceInfo();

        this.state = {
            darkMode: initialDarkMode,
            email: '',
            password: '',
            progress: false,
            modalVisible: false
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    show() {
        this.setState({
            progress: false,
            modalVisible: true,
        });
    }

    hide() {
        this.setState({
            progress: false,
            modalVisible: false,
        });
    }

    _prepareDeviceInfo() {
        AsyncStorage.getItem('@deviceInfo', (error, value) => {
            if (!error && value) {
                this.deviceInfo = JSON.parse(value);
            } else {
                const setDeviceFingerPrint = (rawFingerprint) => {
                    if (!rawFingerprint) {
                        rawFingerprint = Math.random().toString();
                    }
                    JSHash(rawFingerprint.toString(), CONSTANTS.HashAlgorithms.sha256)
                        .then(hash => {
                            this.deviceInfo.deviceFingerprint = hash;
                            persistDeviceInfo();
                        })
                        .catch(e => {
                            console.error('Device fingerprint hashing error: ', e);
                            this.deviceInfo.deviceFingerprint = rawFingerprint;
                            persistDeviceInfo();
                        })
                };

                const persistDeviceInfo = () => {
                    AsyncStorage.setItem('@deviceInfo', JSON.stringify(this.deviceInfo), error => {
                        if (error) {
                            console.error('Device info persist error: ' + error);
                        }
                    });
                };

                this.deviceInfo = {};
                this.deviceInfo.deviceType = DeviceInfo.getDeviceType();
                this.deviceInfo.deviceOs = Platform.OS + ' ' + DeviceInfo.getSystemVersion();
                persistDeviceInfo();

                DeviceInfo.getDeviceName().then(deviceName => {
                    this.deviceInfo.deviceName = deviceName;
                    persistDeviceInfo();
                });

                if (Platform.OS === 'android') {
                    DeviceInfo.getAndroidId()
                        .then(androidId => {
                            if (androidId) {
                                setDeviceFingerPrint(androidId);
                            } else {
                                DeviceInfo.getMacAddress().then(mac => setDeviceFingerPrint(mac)).catch(console.log);
                            }
                        })
                        .catch(error => {
                            console.log('Device fingerprint cannot be acquired: ' + error);
                            DeviceInfo.getMacAddress().then(mac => setDeviceFingerPrint(mac)).catch(console.log);
                        });
                } else {
                    DeviceInfo.getDeviceToken()
                        .then(deviceToken => {
                            if (deviceToken) {
                                setDeviceFingerPrint(deviceToken);
                            } else {
                                DeviceInfo.getMacAddress().then(mac => setDeviceFingerPrint(mac)).catch(console.log);
                            }
                        })
                        .catch(error => {
                            console.log('Device fingerprint cannot be acquired: ' + error);
                            DeviceInfo.getMacAddress().then(mac => setDeviceFingerPrint(mac)).catch(console.log);
                        });
                }
            }
        });
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    _onLoginPressed() {
        if (!this.state.email || !this.state.email.trim() ||
            !this.state.password || !this.state.password.trim()) {
            Alert.alert(strings.loginFailed, strings.checkCredentials);
            return;
        }
        this.setState({progress: true});
        const payload = new FormData();
        payload.append('username', this.state.email);
        payload.append('password', this.state.password);
        payload.append('device_fingerprint', this.deviceInfo.deviceFingerprint);
        payload.append('device_name', this.deviceInfo.deviceName);
        payload.append('device_type', this.deviceInfo.deviceType);
        payload.append('device_os', this.deviceInfo.deviceOs);
        const data = {
            method: 'POST',
            cache: 'no-cache',
            redirect: 'follow',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            },
            body: payload
        };
        fetch(joinPath(constants.mainServerAddress, 'auth') + '/', data)
            .then((response) => {
                if (!response.ok || response.status !== 200) {
                    setTimeout(() => {
                        this.setState({progress: false});
                        if (response.status === 403) {
                            console.log('Login failed: unauthorized');
                            Alert.alert(strings.loginFailed, strings.checkCredentials);
                        } else if (response.status === 429) {
                            console.log('Login failed: throttled');
                        } else if (response.status === 412) {
                            console.log('Login failed: device limit');
                            Alert.alert(strings.deviceLimitReached, strings.deviceLimitReachedLong);
                        } else {
                            console.log(`Unexpected status from auth API: ${response.status}`);
                            Alert.alert(strings.loginFailed);
                        }
                    }, 3000);
                } else {
                    return response.json();
                }
            })
            .then(response => {
                if (response) {
                    setTimeout(() => {
                        if (response['auth_token']) {
                            AsyncStorage.setItem('@deviceAuth', JSON.stringify(response), error => {
                                if (error) {
                                    this.setState({progress: false});
                                    console.log('An error occurred while saving the auth token to the storage');
                                    Alert.alert(strings.loginFailed, strings.systemFailure);
                                }
                                this.props.loginSuccessHook(response, this.deviceInfo);
                                this.hide();
                            });
                        } else {
                            console.log('Incorrect response structure from auth API');
                            Alert.alert(strings.loginFailed, strings.systemFailure);
                            this.setState({progress: false});
                        }
                    }, 1000);
                }
            })
            .catch((error) => {
                this.setState({progress: false});
                console.log('Error while accessing the auth API: ' + error);
                Alert.alert(strings.loginFailed, strings.checkInternetConnection);
            });
    }

    resetState = () => {
        this.setState({
            email: '',
            password: '',
            progress: false
        });
    };

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                >
                    {this.state.progress ?
                        <MaterialIndicator color={colors[this.state.darkMode].signupButtonBackgroundColor} /> :
                        <View
                            style={styles.container}
                            backgroundColor={colors[this.state.darkMode].viewBackgroundColor}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    Linking.openURL(constants.loginScreenBrandHomePageUrl).catch(console.log);
                                }}>
                                <Image
                                    source={require('../images/logo.png')}
                                    style={{width: 320, resizeMode: "contain"}}
                                />
                            </TouchableOpacity>

                            <KeyboardAvoidingView behavior={'padding'} style={styles.keyboardAvoidingView}>
                                <KeyboardAvoidingView
                                    style={styles.inputView}
                                    backgroundColor={colors[this.state.darkMode].textBackgroundColor}
                                >
                                    <TextInput
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={{...styles.inputText, color: colors[this.state.darkMode].textColor}}
                                        placeholder={strings.email}
                                        placeholderTextColor={colors[this.state.darkMode].textPlaceholderColor}
                                        onChangeText={text => this.setState({email: text})}
                                    />
                                </KeyboardAvoidingView>

                                <KeyboardAvoidingView
                                    style={styles.inputView}
                                    backgroundColor={colors[this.state.darkMode].textBackgroundColor}
                                >
                                    <TextInput
                                        ref={(passwordField) => (this._passwordField = passwordField)}
                                        secureTextEntry
                                        style={{...styles.inputText, color: colors[this.state.darkMode].textColor}}
                                        placeholder={strings.password}
                                        placeholderTextColor={colors[this.state.darkMode].textPlaceholderColor}
                                        onChangeText={text => this.setState({password: text})}
                                    />
                                </KeyboardAvoidingView>
                            </KeyboardAvoidingView>

                            <TouchableOpacity onPress={() => {
                                Linking.openURL(constants.loginScreenForgotPasswordUrl).catch(console.log);
                            }}>
                                <Text style={{...styles.forgot, color: colors[this.state.darkMode].forgotColor}}>
                                    {strings.forgot}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{...styles.loginBtn, backgroundColor: colors[this.state.darkMode].loginButtonBackgroundColor}}
                                onPress={this._onLoginPressed.bind(this)}>
                                <Text style={styles.loginText}>{strings.login}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{...styles.loginBtn, backgroundColor: colors[this.state.darkMode].signupButtonBackgroundColor}}
                                onPress={() => {
                                    Linking.openURL(constants.loginScreenSignupUrl).catch(console.log);
                                }}>
                                <Text style={styles.loginText}>{strings.register}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </Modal>
            </View>
        )
    }
}

let strings = new LocalizedStrings({
    en: {
        login: 'LOG IN',
        register: 'REGISTER',
        forgot: 'Forgot Password',
        password: 'Password',
        email: 'Email',
        loginFailed: 'Login failed',
        systemFailure: 'System failure',
        checkCredentials: 'Check email and password',
        checkInternetConnection: 'Couldn\'t access the server\nCheck the Internet connection',
        deviceLimitReached: 'Device limit has been reached',
        deviceLimitReachedLong: 'To login in this device please log out another device' +
            '\nPlease contact the provider if you don\'t have access the other devices'
    },
});

const colors = {
    'dark': {
        textColor: '#eee',
        textPlaceholderColor: '#008ebe',
        textBackgroundColor: '#212121',
        viewBackgroundColor: '#000',
        loginButtonBackgroundColor: '#a83e3e',
        signupButtonBackgroundColor: '#005c7c',
        forgotColor: '#eee'
    },
    'light': {
        textColor: '#111',
        textPlaceholderColor: '#003f5c',
        textBackgroundColor: '#eee',
        viewBackgroundColor: '#fff',
        loginButtonBackgroundColor: '#fb5b5a',
        signupButtonBackgroundColor: '#006c9f',
        forgotColor: '#111'
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyboardAvoidingView: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    inputView: {
        width: '80%',
        borderRadius: 25,
        height: 50,
        marginBottom: 20,
        justifyContent: 'center',
        padding: 20,
        maxWidth: 500
    },
    inputText: {
        height: 50
    },
    forgot: {
        fontSize: 13,
        marginBottom: 30
    },
    loginBtn: {
        width: '80%',
        borderRadius: 25,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 300,
        marginTop: 15,
        marginBottom: 15
    },
    loginText: {
        color: 'white'
    }
})
