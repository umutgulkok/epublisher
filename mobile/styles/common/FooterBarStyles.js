import {Platform} from 'react-native';

const FooterBarStyles = {
    backgroundColor: '#eeeeee',
        paddingTop: 0,
        bottom: 0,
        ...Platform.select({
            ios: {
                height: 64,
            },
            android: {
                height: 54,
            },
        }),
        right: 0,
        left: 0,
        borderTopWidth: 1,
        borderTopColor: '#BBB',
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
        marginLeft: 5,
        marginRight: 5
};

export {
    FooterBarStyles,
    SliderStyle
}
