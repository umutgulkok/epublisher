import { StyleSheet } from 'react-native'

const SettingsRowStyles = StyleSheet.create({
    container: {
        marginBottom: 8,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    containerSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50
    },
    containerInSection: {
        flex: 1, 
        height: 50,
        borderRadius: 1,
        borderBottomWidth: 0.3
    },
    containerInnerSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    containerInnerSectionMiddle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    textStyle: {
        flex: 6,
        flexDirection: 'row',
        fontSize: 15,
    },
    textSection: {
        flex: 1,
        textAlign: 'left',
        fontSize: 15,
        fontWeight: 'bold',
        paddingLeft: 8
    },
    iconRight: {
        flex: 1,
        textAlign: 'center'
    },
    iconLeft: {
        flex: 1,
        textAlign: 'center'
    },
    switchSt: {
        flex: 1,
        marginRight: 20
    },
    checkSt: {
        flex: 1,
        lineHeight: 20
    },
    sliderSt: {
        marginHorizontal: 16
    }
});

const colors = {
    'dark': {
        textColor: '#eee',
        iconColor: '#3b82f6',
        backgroundColor: '#000',
        shadowColor: "#888",
        borderColor: "#555",
        sliderThumbColor: '#999'
    },
    'light': {
        textColor: '#111',
        iconColor: '#3478f5',
        backgroundColor: '#fff',
        shadowColor: "#888",
        borderColor: "#ccc",
        sliderThumbColor: '#ffffff'
    }
};

export {
    SettingsRowStyles,
    colors
}
