import {StyleSheet} from 'react-native';

export const colors = {
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

export const styles = StyleSheet.create({
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
});
