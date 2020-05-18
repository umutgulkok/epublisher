import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    StatusBar,
    Alert,
    Clipboard,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';

import Settings from '../components/reader/Settings';
import Nav from '../components/reader/Toc';
import HeaderBar from '../components/common/HeaderBar';
import FooterBar from '../components/common/FooterBar';
import {PreferenceKeys, initPreferences, readPreference, storePreference} from '../helpers/Preferences';
import {Themes} from '../helpers/Themes';
import Search from '../components/reader/Search';
import {getFontOrientationFactor} from '../helpers/Utils';
import {EpubStreamer} from '../components/epubjs-rn/Streamer';
import Epub from '../components/epubjs-rn/Epub';

class Reader extends Component {
    constructor(props) {
        super(props);

        initPreferences().then(() => {
            const flow = readPreference(PreferenceKeys.flow);
            const fontSize = readPreference(PreferenceKeys.fontSize);
            const theme = readPreference(PreferenceKeys.theme);
            const lastLocation = readPreference(`${PreferenceKeys.lastLocation}-${props.route.params.bookKey}`);

            this.setState({
                flow: flow,
                location: lastLocation,
                fontSize: fontSize,
                theme: theme,
                renderReader: true,
                isConnectedToInternet: false,
            });

            this._settings.setState({
                flow: flow,
                fontSize: fontSize,
                theme: theme
            });
        });

        this.state = {
            bookKey: props.route.params.bookKey,
            renderReader: false,
            src: '',
            origin: '',
            title: '',
            toc: [],
            location: 0,
            showBars: true,
            showNav: false,
            sliderDisabled: true,
            generateLocations: false,
            fontFactor: getFontOrientationFactor(Orientation.getInitialOrientation())
        };

        this.streamer = new EpubStreamer();
    }

    componentDidMount() {
        this.streamer
            .initialize(this.state.bookKey)
            .then(result => {
                const {address, authToken} = result;
                return this.setState({
                    src: address,
                    authToken
                });
            });

        setTimeout(() => this.toggleBars(), 1000);
        Orientation.addOrientationListener(this._orientationDidChange);

        // setInterval(async () => {
        //     const copiedText = await Clipboard.getString();
        //     if (copiedText.length > 200) {
        //         Clipboard.setString('');
        //     }
        // }, 1000);
    }

    componentWillUnmount() {
        this.streamer.destroy();
        Orientation.removeOrientationListener(this._orientationDidChange);
    }

    toggleBars() {
        this.setState({showBars: !this.state.showBars});
    }

    _orientationDidChange = (orientation) => {
        const location = this.state.location;
        this.setState({
            renderReader: false
        });
        this.setState({
            fontFactor: getFontOrientationFactor(orientation),
            renderReader: true,
            location
        });
    };

    render() {
        return (
            <View style={styles.container}>
                <StatusBar
                    hidden={!this.state.showBars}
                    translucent={true}
                    animated={false}
                />
                {this.state.renderReader ? (
                    <Epub
                        style={styles.reader}
                        bookId={this.state.bookKey}
                        src={this.state.src}
                        authToken={this.state.authToken}
                        flow={this.state.flow}
                        location={this.state.location}
                        fontSize={(this.state.fontSize * this.state.fontFactor) + 'px'}
                        onLocationChange={visibleLocation => {
                            this.setState({visibleLocation});
                            if (this.state.book) {
                                const percentage = visibleLocation.start.percentage.toFixed(6);
                                const cfi = this.state.book.locations.cfiFromPercentage(percentage);
                                storePreference(`${PreferenceKeys.lastLocation}-${this.state.bookKey}`, cfi);
                            }
                        }}
                        onLocationsReady={(locations) => {
                            this.setState({sliderDisabled: false});
                        }}
                        onReady={(book) => {
                            this.setState({
                                title: book.package.metadata.title,
                                toc: book.navigation.toc,
                                book: book,
                            });
                            // indexBook(this.state.book).then(() => {
                            //     console.log('Indexing completed');
                            // });
                        }}
                        onPress={(cfi, position, rendition) => {
                            this.toggleBars();
                            // console.log("press", cfi);
                        }}
                        onLongPress={(cfi, rendition) => {
                            // Alert.alert('Long Pressed');
                            // console.log("longpress", cfi);
                        }}
                        onDblPress={(cfi, position, imgSrc, rendition) => {
                            // Path relative to where the book is opened
                            // console.log(this.state.book.path.directory);
                            // imgSrc is the actual src in the img html tag
                            // console.log("dblpress", cfi, position, imgSrc);
                        }}
                        onSelected={(cfiRange, rendition) => {
                            rendition.highlight(cfiRange, {});
                        }}
                        onMarkClicked={(cfiRange, data, rendition) => {
                            rendition.unhighlight(cfiRange);
                        }}
                        themes={Themes}
                        theme={this.state.theme}
                        origin={this.state.origin}
                        onError={(message) => {
                            console.log('EPUBJS-Webview', message);
                        }}
                    />
                ) : null}
                <View style={[styles.bar, {top: 0}]}>
                    <HeaderBar
                        title={this.state.title}
                        alwaysShown={this.state.showBars}
                        leftIconName={'ios-arrow-back'}
                        rightIconName={'ios-cog'}
                        onLeftButtonPressed={() => this.props.navigation.pop()}
                        onRightButtonPressed={() => {
                            this.setState({renderReader: false});
                            this._settings.show();
                        }}
                    />
                </View>
                <View style={[styles.bar, {bottom: 0}]}>
                    <FooterBar
                        disabled={this.state.sliderDisabled}
                        value={
                            this.state.visibleLocation
                                ? this.state.visibleLocation.start.percentage
                                : 0
                        }
                        shown={this.state.showBars}
                        onSlidingComplete={(value) => {
                            const percentage = value.toFixed(6);
                            this.setState({location: percentage});
                            const cfi = this.state.book.locations.cfiFromPercentage(percentage);
                            storePreference(`${PreferenceKeys.lastLocation}-${this.state.bookKey}`, cfi);
                        }}
                        onNavButtonPressed={() => {
                            this._nav.show()
                        }}
                        onSearchButtonPressed={() => {
                            // if (this.state.isConnectedToInternet) {
                            this._search.show()
                            // } else {
                            //     Alert.alert('Arama özelliği internet bağlantısı ile kullanılabilir');
                            // }
                        }}
                        onBookmarkButtonPressed={() => {
                            // this.setState({ renderReader: false });
                            // this._settings.show();
                        }}
                    />
                </View>
                <View>
                    <Nav
                        ref={(nav) => (this._nav = nav)}
                        display={(loc) => {
                            this.setState({location: loc});
                        }}
                        toc={this.state.toc}
                    />
                </View>
                <View>
                    <Search
                        ref={(search) => (this._search = search)}
                        display={(loc) => {
                            this.setState({location: loc});
                        }}
                        bookId={this.state.bookKey}
                    />
                </View>
                <View>
                    <Settings
                        ref={(settings) => (this._settings = settings)}
                        settingsChangeHook={settings => {
                            this.setState({
                                flow: settings.flow,
                                fontSize: settings.fontSize,
                                theme: settings.theme,
                                renderReader: true
                            });
                        }}
                        flow={''}
                        fontSize={20}
                        theme={''}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    reader: {
        flex: 1,
        backgroundColor: '#3F3F3C',
    },
    bar: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 55,
    },
});

export default Reader;
