import React, {Component} from 'react';
import {Alert, AppState, FlatList, TouchableHighlight, View} from 'react-native';
import {initialMode as initialDarkMode, eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode';
import {ListItem, SearchBar} from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import RNFetchBlob from 'rn-fetch-blob'
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import LocalizedStrings from 'react-native-localization';
import {StyleSheet} from 'react-native';

import constants from '../constants';
import {joinPath} from '../helpers/Utils';
import HeaderBar from '../components/common/HeaderBar';
import LoginScreen from './LoginScreen';
import {indexBook} from '../helpers/EpubIndexer';
import RNFS from 'react-native-fs';

const contentKeyCover = 'cover';
const contentKeyBook = 'book';
const contentKeyLocations = 'locations';
const contentKeySearch = 'search';

class LibraryScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            darkMode: initialDarkMode,
            data: [],
            error: null,
            appState: AppState.currentState
        };

        this.deviceInfo = null;
        this.deviceAuth = null;
        this.loadingLibrary = false;
        this.lastLoadLibraryTime = null;
        this.isConnectedToInternet = false;
        this.arrayholder = [];
    }

    componentDidMount() {
        darkModeEventEmitter.setMaxListeners(100);
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));

        AsyncStorage.getItem('@deviceAuth', (error, value) => {
            if (error) {
                console.log('An error occurred while reading the auth token from the storage');
            }

            if (value) {
                this.deviceAuth = JSON.parse(value);
                this._loginScreen.hide();

                AsyncStorage.getItem('@deviceInfo', (error, value) => {
                    if (error) {
                        console.log('An error occurred while reading the device info from the storage');
                    }
                    if (value) {
                        this.deviceInfo = JSON.parse(value);
                        AsyncStorage.getItem('@library', (error, value) => {
                            if (error) {
                                console.log('An error occurred while reading the library from the storage');
                            }
                            if (value) {
                                this.setState({data: JSON.parse(value)});
                            }
                            this._refreshLibrary();
                        });
                    }
                });
            } else {
                this._loginScreen.show();
            }
        });

        this.unsubscribeConnectionChecker = NetInfo.addEventListener(state => {
            if (!this.isConnectedToInternet && state.isConnected && (state.type === 'wifi' || state.type === 'cellular')) {
                // Alert.alert('Connected');
                this.isConnectedToInternet = true;
                this._refreshLibrary();
            } else if (this.isConnectedToInternet && !state.isConnected && state.type === 'none') {
                // Alert.alert('Disconnected');
                this.isConnectedToInternet = false;
            }
        });

        AppState.addEventListener('change', this._handleAppStateChange);
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
        this.unsubscribeConnectionChecker();
        AppState.removeEventListener('change', this._handleAppStateChange);
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    _handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            if (!this.lastLoadLibraryTime || new Date() - this.lastLoadLibraryTime > 30000) {
                this.lastLoadLibraryTime = new Date();
                this._refreshLibrary();
            }
        }
        this.setState({appState: nextAppState});
    };

    _refreshLibrary = () => {
        if (this.loadingLibrary || !this.isConnectedToInternet || !this.deviceAuth || !this.deviceInfo) {
            return;
        }
        this.loadingLibrary = true;

        const url = `${joinPath(constants.mainServerAddress, 'mybooks')}?auth_token=${this.deviceAuth.auth_token}` +
            `&fingerprint=${this.deviceInfo.deviceFingerprint}`;

        fetch(url)
            .then((response) => {
                if (!response.ok || response.status !== 200) {
                    if (response.status === 403) {
                        console.log('Failed to fetch my books: unauthorized');
                        Alert.alert(strings.authorizationError, strings.tryLogoutLoginAgain);
                        this.loadingLibrary = false;
                    } else if (response.status === 429) {
                        console.log('Failed to fetch my books: throttled');
                        setTimeout(() => {
                            this.loadingLibrary = false;
                        }, 60000)
                    } else {
                        console.log(`Unexpected status from my books API: ${response.status}`);
                        Alert.alert(strings.unableToFetchBookList, strings.tryLoginAgainOrCommunicate);
                        this.loadingLibrary = false;
                    }
                } else {
                    return response.json();
                }
            })
            .then(library => {
                if (library) {
                    let newAdditionCount = 0;
                    const oldBooks = {};
                    for (let i = 0; i < this.state.data.length; i++) {
                        const book = this.state.data[i];
                        oldBooks[book.key] = book;
                    }
                    for (let i = 0; i < library.length; i++) {
                        const book = library[i];
                        const oldBook = oldBooks[book.key];
                        if (!oldBook) {
                            newAdditionCount++;
                        }
                        this._putAuxFieldsOnBook(book, oldBook);
                    }
                    AsyncStorage.setItem('@library', JSON.stringify(library), error => {
                        if (error) {
                            console.log('An error occurred while saving the library to the storage');
                            Alert.alert(strings.error, strings.errorSavingLibrary);
                        }
                    });
                    this.arrayholder = library;
                    this.setState({data: library}, () => {
                        this._loadBooksFromServer(library)
                            .then(() => {
                                this.loadingLibrary = false;
                            });
                    });
                    if (newAdditionCount > 0) {
                        Alert.alert(newAdditionCount.toString() +
                            (newAdditionCount === 1 ? strings.newBooksLoaded : strings.newBooksLoadedPlural));
                    }
                } else {
                    this.loadingLibrary = false;
                }
            })
            .catch((error) => {
                this.loadingLibrary = false;
                console.log('Error while accessing the my books API: ' + error);
                Alert.alert(strings.failedToLoadLibrary, strings.checkInternet);
            });
    };

    _loadBooksFromServer() {
        return new Promise((resolve, reject) => {
            const promises = [];
            for (const book of this.state.data) {
                if (!this._isBookReady(book)) {
                    promises.push(this._fetchBookContent(book.key, contentKeyCover));
                    promises.push(this._fetchBookContent(book.key, contentKeyLocations));
                    promises.push(this._fetchBookContent(book.key, contentKeySearch));
                    promises.push(this._fetchBookContent(book.key, contentKeyBook));
                }
            }
            Promise.all(promises).then(resolve).catch(reject);
        });
    }

    _putAuxFieldsOnBook(book, oldBook) {
        if (oldBook) {
            book.progress = oldBook.progress;
            book.isCoverReady = oldBook.isCoverReady;
            book.isBookReady = oldBook.isBookReady;
            book.isLocationsReady = oldBook.isLocationsReady;
            book.isSearchReady = oldBook.isSearchReady;
        } else {
            book.progress = 0.0;
            book.isCoverReady = false;
            book.isBookReady = false;
            book.isLocationsReady = false;
            book.isSearchReady = false;
        }
    }

    _isBookReady(book) {
        return book && book.isCoverReady && book.isBookReady && book.isLocationsReady && book.isSearchReady;
    }

    _getContentFileName(bookKey, contentKey) {
        let bookContentDir = joinPath(RNFetchBlob.fs.dirs.DocumentDir, constants.bookStorageDir);
        if (contentKey === contentKeyCover) {
            return joinPath(joinPath(bookContentDir, bookKey), constants.contentFileNameCover);
        } else if (contentKey === contentKeyBook) {
            return joinPath(joinPath(bookContentDir, bookKey), constants.contentFileNameBook);
        } else if (contentKey === contentKeyLocations) {
            return joinPath(joinPath(bookContentDir, bookKey), constants.contentFileNameLocations);
        } else if (contentKey === contentKeySearch) {
            return joinPath(joinPath(bookContentDir, bookKey), constants.contentFileNameSearch);
        }
        return null;
    }

    _fetchBookContent(bookKey, contentKey) {
        return new Promise((resolve, reject) => {
            const url = `${joinPath(constants.mainServerAddress, 'content')}?auth_token=${this.deviceAuth.auth_token}` +
                `&fingerprint=${this.deviceInfo.deviceFingerprint}&book_key=${bookKey}&content_key=${contentKey}`;

            RNFetchBlob
                .config({
                    path: this._getContentFileName(bookKey, contentKey)
                })
                .fetch('GET', url)
                .progress({count: 10}, (received, total) => {
                    const book = this._getBookFromState(bookKey);
                    if (contentKey === contentKeyBook && book) {
                        book.progress = received / total;
                        this.setState({data: this.state.data}, () => {
                            AsyncStorage.setItem('@library', JSON.stringify(this.state.data));
                        });
                    }
                })
                .then((res) => {
                    if (res.info().status !== 200) {
                        console.log(`Unexpected response code ${res.info().status} for URL: ${url}`);
                        Alert.alert(strings.error, strings.failedToLoadBook);
                        resolve();
                    }

                    if (contentKey === contentKeySearch) {
                        console.log(`The content file ${contentKey} saved for book ${bookKey}`);
                        indexBook(bookKey, this._getContentFileName(bookKey, contentKeySearch))
                            .then(() => {
                                const book = this._getBookFromState(bookKey);
                                book.isSearchReady = true;
                                this.setState({data: this.state.data}, () => {
                                    AsyncStorage.setItem('@library', JSON.stringify(this.state.data));
                                });
                                resolve();
                            });
                    } else {
                        if (contentKey === contentKeyCover) {
                            this._getBookFromState(bookKey).isCoverReady = true;
                        } else if (contentKey === contentKeyBook) {
                            this._getBookFromState(bookKey).isBookReady = true;
                        } else if (contentKey === contentKeyLocations) {
                            this._getBookFromState(bookKey).isLocationsReady = true;
                        }
                        this.setState({data: this.state.data}, () => {
                            AsyncStorage.setItem('@library', JSON.stringify(this.state.data));
                        });
                        console.log(`The content file ${contentKey} saved for book ${bookKey}`);
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    _getBookFromState(bookKey) {
        for (const book of this.state.data) {
            if (book.key === bookKey) {
                return book;
            }
        }
        return null;
    }

    _renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: '86%',
                    backgroundColor: colors[this.state.darkMode].separatorColor,
                    marginLeft: '14%',
                }}
            />
        );
    };

    _searchFilterFunction = text => {
        this.setState({
            value: text,
        });
        const newData = this.arrayholder.filter(item => {
            const itemData = `${item.name.toLowerCase()} ${item.author.toLowerCase()}`;
            const textData = text.toLowerCase();
            return itemData.indexOf(textData) > -1;
        });
        this.setState({
            data: newData,
        });
    };

    _renderSearchBar = () => {
        return (
            <SearchBar
                placeholder={strings.searchPlaceHolder}
                lightTheme={this.state.darkMode === 'light'}
                round={true}
                onChangeText={text => this._searchFilterFunction(text)}
                autoCorrect={false}
                value={this.state.value}
            />
        );
    };

    _onBookSelect = (item) => {
        for (const book of this.state.data) {
            if (book.key === item.key) {
                if (this._isBookReady(book)) {
                    this.props.navigation.navigate('reader', {bookKey: book.key})
                } else {
                    Alert.alert(strings.bookNotReady)
                }
                return;
            }
        }
    };

    _resetState = () => {
        this.deviceInfo = null;
        this.deviceAuth = null;
        this.loadingLibrary = false;
        this.lastLoadLibraryTime = null;
        this.isConnectedToInternet = false;
        this.arrayholder = [];
    };

    _logOut = () => {
        let searchDbPath = joinPath(RNFetchBlob.fs.dirs.LibraryDir, 'LocalDatabase');
        for (const book of this.state.data) {
            RNFS.unlink(joinPath(searchDbPath, book.key + '.db')).then();
            RNFS.unlink(joinPath(searchDbPath, book.key + '.db-wal')).then();
            RNFS.unlink(joinPath(searchDbPath, book.key + '.db-shm')).then();
        }
        RNFS.unlink(joinPath(RNFetchBlob.fs.dirs.DocumentDir, constants.bookStorageDir)).then();

        this.deviceInfo = null;
        this.deviceAuth = null;
        this.loadingLibrary = false;
        this.arrayholder = [];
        this._loginScreen.resetState();
        this.setState({data: []});
        AsyncStorage.setItem('@deviceAuth', '');
        AsyncStorage.setItem('@library', '');
        this._loginScreen.show();
    };

    render() {
        return (
            <View
                style={styles.container}
                backgroundColor={colors[this.state.darkMode].containerBackgroundColor}
            >
                <HeaderBar
                    title={strings.title}
                    alwaysShown={true}
                    rightIconName={'md-person'}
                    onRightButtonPressed={() => {
                        Alert.alert(
                            strings.logoutTitle,
                            strings.logoutConfirm,
                            [
                                {text: strings.yes, onPress: () => {this._logOut();}},
                                {text: strings.no}
                            ]
                        );
                    }}
                />
                <FlatList
                    style={styles.list}
                    data={this.state.data}
                    backgroundColor={colors[this.state.darkMode].listItemBackgroundColor}
                    renderItem={({item}) => (
                        <TouchableHighlight
                            key={item.key}
                            onPress={() => this._onBookSelect(item)}>
                            <ListItem
                                leftAvatar={this._isBookReady(item) ? {source: {uri: 'file:///' + this._getContentFileName(item.key, contentKeyCover)}} :
                                    <AnimatedCircularProgress
                                        size={30}
                                        width={5}
                                        fill={100 * item.progress}
                                        rotation={0}
                                        tintColor={colors[this.state.darkMode].progressColor}
                                        backgroundColor={colors[this.state.darkMode].containerBackgroundColor}
                                    />}
                                title={item.name}
                                subtitle={item.author}
                                titleStyle={{color: colors[this.state.darkMode].listItemTitleColor}}
                                subtitleStyle={{color: colors[this.state.darkMode].listItemSubtitleColor}}
                                containerStyle={[{backgroundColor: colors[this.state.darkMode].listItemBackgroundColor}]}
                            />
                        </TouchableHighlight>
                    )}
                    keyExtractor={item => {
                        return item.key;
                    }}
                    ItemSeparatorComponent={this._renderSeparator}
                    ListHeaderComponent={this._renderSearchBar}
                />
                <LoginScreen
                    ref={(loginScreen) => (this._loginScreen = loginScreen)}
                    loginSuccessHook={(deviceAuth, deviceInfo) => {
                        this.deviceAuth = deviceAuth;
                        this.deviceInfo = deviceInfo;
                        this._refreshLibrary();
                    }}
                />
            </View>
        );
    }
}

let strings = new LocalizedStrings({
    en: {
        title: 'Library',
        searchPlaceHolder: 'Search...',
        failedToLoadLibrary: 'Failed to load the library',
        failedToLoadBook: 'Failed to load a book content\nTry logging out and in again or communicate with the provider',
        checkInternet: 'Couldn\'t access the server\nCheck the Internet connection',
        newBooksLoaded: ' new book have been added',
        newBooksLoadedPlural: ' new books have been added',
        error: 'Error',
        errorSavingLibrary: 'An error occurred while saving the library',
        authorizationError: 'Authorization error',
        tryLogoutLoginAgain: 'Please try logging out and login again',
        unableToFetchBookList: 'Unable to fetch the book list',
        tryLoginAgainOrCommunicate: 'Try logging out and in again or communicate with the provider',
        logoutTitle: 'Log Out',
        logoutConfirm: 'Are you sure to log out?',
        yes: 'Yes',
        no: 'No',
        bookNotReady: 'Book is not ready yet'
    },
});

const colors = {
    'dark': {
        listItemTitleColor: '#fff',
        listItemSubtitleColor: '#8e8d93',
        listItemBackgroundColor: '#000',
        containerBackgroundColor: '#000',
        separatorColor: '#323136',
        progressColor: '#808080'
    },
    'light': {
        listItemTitleColor: '#000',
        listItemSubtitleColor: '#8a898e',
        listItemBackgroundColor: '#fff',
        containerBackgroundColor: '#fff',
        separatorColor: '#8a898e',
        progressColor: '#A0A0A0'
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        flex: 1
    }
});

export default LibraryScreen;
