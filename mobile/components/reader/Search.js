import React, {Component} from 'react';
import {
    Alert, AppState,
    FlatList,
    Modal,
    StyleSheet,
    Text, TextInput,
    TouchableHighlight,
    View,
} from 'react-native';
import LocalizedStrings from 'react-native-localization';
import {SearchBar} from 'react-native-elements';
import {initialMode as initialDarkMode, eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode';

import {searchBook} from '../../helpers/EpubIndexer';
import HeaderBar from '../common/HeaderBar';

const searchDebounceDelay = 500;

class Search extends Component {
    constructor(props) {
        super(props);

        this.state = {
            darkMode: initialDarkMode,
            bookKey: props.bookKey,
            error: '',
            modalVisible: false
        };
    }

    componentDidMount() {
        darkModeEventEmitter.on('currentModeChanged', this._darkModeChangeHandler.bind(this));
        if (this.props.shown) {
            this.show();
        } else {
            this.hide();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.shown !== this.props.shown) {
            if (this.props.shown) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    show() {
        this.setState({modalVisible: true});

    }

    hide() {
        this.setState({modalVisible: false});
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    _onPress(item) {
        if (this.props.display) {
            this.props.display(item.cfi);
        }
        this.hide();
    }

    _renderRow(item) {
        return (
            <TouchableHighlight onPress={() => this._onPress(item)}>
                <View
                    style={styles.row}
                    backgroundColor={colors[this.state.darkMode].listItemBackgroundColor}
                >
                    <Text style={{...styles.title, color: colors[this.state.darkMode].listItemTitleColor}}>
                        {item.before}
                        <Text style={styles.titleHighlight}>
                            {item.highlight}
                        </Text>
                        {item.after}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    _debounce(func) {
        let timeoutId;
        return (...args) => {
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                timeoutId = null;
                func.apply(context, args);
            }, searchDebounceDelay);
        };
    };

    _debouncedSearch = this._debounce(this._onChangeText)
    _onChangeText(searchTerm) {
        if (!searchTerm || searchTerm.length < 3)
            return;

        searchBook(this.state.bookKey, searchTerm)
            .then(searchResults => {
                this.setState({
                    dataSource: searchResults || []
                });
            })
            .catch(error => console.error(error));
    }

    _renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: '100%',
                    backgroundColor: colors[this.state.darkMode].separatorColor,
                    marginLeft: '0%',
                }}
            />
        );
    };

    render() {
        return (
            <View
                style={styles.container}
                backgroundColor={colors[this.state.darkMode].containerBackgroundColor}
            >
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                >
                    <HeaderBar
                        title={strings.title}
                        alwaysShown={true}
                        rightIconName={'md-close'}
                        onRightButtonPressed={() => {
                            this.hide();
                        }}
                    />
                    <SearchBar
                        placeholder={strings.searchPlaceHolder}
                        lightTheme={this.state.darkMode === 'light'}
                        round={true}
                        onChangeText={text => {
                            this.setState({value: text});
                            this._debouncedSearch(text);
                        }}
                        autoCorrect={false}
                        value={this.state.value}
                    />
                    <FlatList
                        style={styles.container}
                        data={this.state.dataSource}
                        backgroundColor={colors[this.state.darkMode].containerBackgroundColor}
                        renderItem={row => {
                            return this._renderRow(row.item);
                        }}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={this._renderSeparator}
                    />
                </Modal>
            </View>
        );
    }
}

let strings = new LocalizedStrings({
    en:{
        title: 'Search',
        searchPlaceHolder: 'Search...',
    },
});

const colors = {
    'dark': {
        listItemTitleColor: '#fff',
        listItemBackgroundColor: '#000',
        containerBackgroundColor: '#000',
        separatorColor: '#323136',
    },
    'light': {
        listItemTitleColor: '#000',
        listItemBackgroundColor: '#fff',
        containerBackgroundColor: '#fff',
        separatorColor: '#8a898e',
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    row: {
        flexDirection: 'row',
        padding: 10,
        overflow: 'hidden',
    },
    separator: {
        height: 1,
    },
    title: {
        fontFamily: 'georgia'
    },
    titleHighlight: {
        fontFamily: 'georgia',
        fontWeight: 'bold'
    },
});

export default Search;
