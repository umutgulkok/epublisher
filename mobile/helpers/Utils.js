import {Dimensions} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const getTitleMaxWidth = () => {
    return Dimensions.get('window').width - 130
};

const getFontOrientationFactor = (orientation) => {
    if ((orientation || Orientation.getInitialOrientation()) === 'PORTRAIT') {
        return 1;
    }
    const short = Math.min(Dimensions.get('window').width, Dimensions.get('window').height);
    const long = Math.max(Dimensions.get('window').width, Dimensions.get('window').height);
    return short / long * 1.25;
};

const generateShortUuid = () => {
    const bytes = uuidv4('binary');
    return uuidToSlug(bytes);
};

const generateUuid = () => {
    return uuidv4().replace(/-/g, '');
};

function uuidToSlug(uuidBytes) {
    const base64 =
        typeof window === 'undefined'
            ? global.Buffer.from(uuidBytes).toString('base64')
            : btoa(String.fromCharCode(...uuidBytes));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .substring(0, 22); // Drop '==' padding
}

const joinPath = (...args) => {
    let path = '';
    for (let i = 0; i < args.length; i++) {
        let part = args[i].toString();
        while (part.startsWith('/')) {
            part = part.substring(1);
        }
        while (part.endsWith('/')) {
            part = part.substring(0, part.length - 1);
        }
        path += part;
        if (i < args.length - 1) {
            path += '/';
        }
    }
    // if (!path.endsWith('/')) {
    //     path += '/';
    // }
    return path;
}

export {
    getTitleMaxWidth,
    getFontOrientationFactor,
    generateShortUuid,
    generateUuid,
    joinPath
};
