import {Platform} from 'react-native';

const FooterBarStyles = {
    backgroundColor: '#eeeeee',
        paddingTop: 0,
        bottom: 0,
        ...Platform.select({
            ios: {
                height: 74,
                paddingBottom: 10
            },
            android: {
                height: 54,
            },
        }),
        right: 0,
        left: 0,
        borderTopWidth: 1,
        borderTopColor: '#eeeeee',
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
};

const SliderStyle = {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
    marginLeft: 25,
    marginRight: 0
};

const colors = {
    'dark': {
        textColor: '#eee',
        iconColor: '#3b82f6',
        backgroundColor: '#121312',
        sliderThumbColor: '#999'
    },
    'light': {
        textColor: '#111',
        iconColor: '#3478f5',
        backgroundColor: '#f3f3f3',
        sliderThumbColor: '#ffffff'
    }
};

export {
    FooterBarStyles,
    SliderStyle,
    colors
}
