import React, {Component} from 'react'
import {
    Dimensions,
    AppState
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-community/async-storage';
import ePub from 'epubjs';
import RNFS from 'react-native-fs';

if (!global.Blob) {
    global.Blob = RNFetchBlob.polyfill.Blob;
}
global.JSZip = global.JSZip || require('jszip');
global.URL = require('epubjs/libs/url/url-polyfill.js');
if (!global.btoa) {
    global.btoa = require('base-64').encode;
}

import Rendition from './Rendition';
import {joinPath} from '../../components/epubjs-rn/Streamer';
import constants from '../../constants';

class Epub extends Component {

    constructor(props) {
        super(props);

        let bounds = Dimensions.get('window');

        this.state = {
            toc: [],
            show: false,
            width: bounds.width,
            height: bounds.height,
            orientation: 'PORTRAIT'
        }
    }

    componentDidMount() {
        this.active = true;
        this._isMounted = true;
        AppState.addEventListener('change', this._handleAppStateChange.bind(this));

        Orientation.addOrientationListener(this._orientationDidChange.bind(this));
        let orientation = Orientation.getInitialOrientation();
        if (orientation && (orientation === 'PORTRAIT-UPSIDEDOWN' || orientation === 'UNKNOWN')) {
            orientation = 'PORTRAIT';
            this.setState({orientation})
        } else if (orientation) {
            this.setState({orientation})
        } else if (orientation === null) {
            // Android starts as null
            orientation = this.state.width > this.state.height ? 'LANDSCAPE' : 'PORTRAIT';
            this.setState({orientation})
        }

        if (this.props.src) {
            this._loadBook(this.props.src);
        }
    }

    componentWillUnmount() {
        this._isMounted = false;

        AppState.removeEventListener('change', this._handleAppStateChange);
        Orientation.removeOrientationListener(this._orientationDidChange);
        clearTimeout(this.orientationTimeout);

        this.destroy();
    }

    shouldComponentUpdate(nextProps, nextState) {

        if (nextState.show !== this.state.show) {
            return true;
        }

        if ((nextProps.width !== this.props.width) ||
            (nextProps.height !== this.props.height)) {
            return true;
        }

        if ((nextState.width !== this.state.width) ||
            (nextState.height !== this.state.height)) {
            return true;
        }


        if (nextProps.color !== this.props.color) {
            return true;
        }

        if (nextProps.backgroundColor !== this.props.backgroundColor) {
            return true;
        }

        if (nextProps.size !== this.props.size) {
            return true;
        }

        if (nextProps.flow !== this.props.flow) {
            return true;
        }

        if (nextProps.origin !== this.props.origin) {
            return true;
        }

        if (nextProps.orientation !== this.props.orientation) {
            return true;
        }

        if (nextProps.src !== this.props.src) {
            return true;
        }

        if (nextProps.onPress !== this.props.onPress) {
            return true;
        }

        if (nextProps.onLongPress !== this.props.onLongPress) {
            return true;
        }

        if (nextProps.onDblPress !== this.props.onDblPress) {
            return true;
        }

        if (nextProps.stylesheet !== this.props.stylesheet) {
            return true;
        }

        if (nextProps.javascript !== this.props.javascript) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps) {

        if (prevProps.src !== this.props.src) {
            this.destroy();
            this._loadBook(this.props.src);
        } else if (prevProps.orientation !== this.props.orientation) {
            _orientationDidChange(this.props.orientation);
        }
    }

    _orientationDidChange(orientation) {
        let wait = 10;
        let _orientation = orientation;

        if (!this.active || !this._isMounted) return;

        if (orientation === 'PORTRAIT-UPSIDEDOWN' || orientation === 'UNKNOWN') {
            _orientation = 'PORTRAIT';
        }

        if (orientation === 'LANDSCAPE-RIGHT' || orientation === 'LANDSCAPE-LEFT') {
            _orientation = 'LANDSCAPE';
        }

        if (this.state.orientation === _orientation) {
            return;
        }

        __DEV__ && console.log('orientation', _orientation);

        this.setState({orientation: _orientation});
        this.props.onOrientationChanged && this.props.onOrientationChanged(_orientation);
    }

    _loadBook(bookUrl) {
        this.book = ePub({
            replacements: this.props.base64 || 'none',
            requestHeaders: {
                'Authorization': `Bearer ${this.props.authToken}`
            }
        });

        return this._openBook(bookUrl);
    }

    _openBook(bookUrl, useBase64) {
        let type = useBase64 ? 'base64' : null;

        if (!this.rendition) {
            this.needsOpen = [bookUrl, useBase64];
            return;
        }

        this.book.open(bookUrl)
            .catch((err) => {
                console.error(err);
            });

        this.book.ready.then(() => {
            this.isReady = true;
            this.props.onReady && this.props.onReady(this.book);
        });

        this.book.loaded.navigation.then((nav) => {
            if (!this.active || !this._isMounted) return;
            this.setState({toc: nav.toc});
            this.props.onNavigationReady && this.props.onNavigationReady(nav.toc);
        });

        if (this.props.generateLocations !== false) {
            this.loadLocations().then((locations) => {
                this.rendition.setLocations(locations);
                // this.rendition.reportLocation();
                this.props.onLocationsReady && this.props.onLocationsReady(this.book.locations);
            });
        }
    }

    loadLocations() {
        return new Promise((resolve, reject) => {
            this.book.ready
                .then(() => {
                    let bookContentDir = joinPath(RNFS.DocumentDirectoryPath, constants.bookStorageDir);
                    const locationsFilePath = 'file:///' + joinPath(joinPath(bookContentDir, this.props.bookId), constants.contentFileNameLocations);

                    RNFS.exists(locationsFilePath)
                        .then(exists => {
                            if (exists) {
                                RNFS.readFile(locationsFilePath, 'utf8')
                                    .then(str => {
                                        resolve(this.book.locations.load(str));
                                    });
                            } else {
                                let key = this.book.key() + '-locations';
                                AsyncStorage.getItem(key)
                                    .then((stored) => {
                                        if (!this.props.regenerateLocations && stored) {
                                            resolve(this.book.locations.load(stored));
                                        } else {
                                            this.book.locations.generate(this.props.locationsCharBreak || 3000)
                                                .then(locations => {
                                                    // Save out the generated locations to JSON
                                                    AsyncStorage.setItem(key, this.book.locations.save());
                                                    resolve(locations);
                                                });
                                        }
                                    });
                            }
                        });
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    onRelocated(visibleLocation) {
        this._visibleLocation = visibleLocation;

        if (this.props.onLocationChange) {
            this.props.onLocationChange(visibleLocation);
        }
    }

    visibleLocation() {
        return this._visibleLocation;
    }

    getRange(cfi) {
        return this.book.getRange(cfi);
    }

    _handleAppStateChange(appState) {
        if (appState === 'active') {
            this.active = true;
        }

        if (appState === 'background') {
            this.active = false;
        }

        if (appState === 'inactive') {
            this.active = false;
        }
    }

    destroy() {
        if (this.book) {
            this.book.destroy();
        }
    }

    render() {
        return (
            <Rendition
                ref={(r) => {
                    this.rendition = r;

                    if (this.needsOpen) {
                        this._openBook.apply(this, this.needsOpen);
                        this.needsOpen = undefined;
                    }
                }}
                url={this.props.src}
                authToken={this.props.authToken}
                flow={this.props.flow}
                minSpreadWidth={this.props.minSpreadWidth}
                stylesheet={this.props.stylesheet}
                webviewStylesheet={this.props.webviewStylesheet}
                script={this.props.script}
                onSelected={this.props.onSelected}
                onMarkClicked={this.props.onMarkClicked}
                onPress={(this.props.onPress)}
                onLongPress={(this.props.onLongPress)}
                onDblPress={(this.props.onDblPress)}
                onViewAdded={this.props.onViewAdded}
                beforeViewRemoved={this.props.beforeViewRemoved}
                themes={this.props.themes}
                theme={this.props.theme}
                fontSize={this.props.fontSize}
                font={this.props.font}
                display={this.props.location}
                onRelocated={this.onRelocated.bind(this)}
                orientation={this.state.orientation}
                backgroundColor={this.props.backgroundColor}
                onError={this.props.onError}
                onDisplayed={this.props.onDisplayed}
                width={this.props.width}
                height={this.props.height}
                resizeOnOrientationChange={this.props.resizeOnOrientationChange}
            />
        );
    }
}

export default Epub;
