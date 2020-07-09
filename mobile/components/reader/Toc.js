import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableHighlight,
    Modal,
} from 'react-native';
import LocalizedStrings from 'react-native-localization';
import {initialMode as initialDarkMode} from 'react-native-dark-mode/dist/initial-mode';
import {eventEmitter as darkModeEventEmitter} from 'react-native-dark-mode/dist/event-emitter';

import HeaderBar from '../../components/common/HeaderBar';

class Toc extends Component {
    constructor(props) {
        super(props);

        this.state = {
            darkMode: initialDarkMode,
            error: '',
            dataSource: this.props.toc || [],
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

    componentWillUnmount() {
        darkModeEventEmitter.removeListener('currentModeChanged', this._darkModeChangeHandler.bind(this));
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.toc !== this.props.toc) {
            this.setState({
                dataSource: this.props.toc || []
            });
        }

        if (prevProps.shown !== this.props.shown) {
            if (this.props.shown) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    show() {
        this.setState({modalVisible: true});
    }

    hide() {
        this.setState({modalVisible: false});
    }

    _onPress(item) {
        // var item = this.props.toc[event.selectedIndex];
        if (this.props.display) {
            this.props.display(item.href);
        }
        this.hide();
    }

    _darkModeChangeHandler(newMode) {
        this.setState({darkMode: newMode});
    }

    _renderRow(row) {
        return (
            <TouchableHighlight onPress={() => this._onPress(row)}>
                <View style={{...styles.row, backgroundColor: colors[this.state.darkMode].backgroundColor}}>
                    <Text style={{...styles.title, color: colors[this.state.darkMode].textColor}}>
                        {row.label}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                    // onRequestClose={() => console.log('close requested')}
                >
                    <HeaderBar
                        title={strings.title}
                        alwaysShown={true}
                        rightIconName={'md-close'}
                        onRightButtonPressed={() => {
                            this.hide();
                        }}
                    />
                    <FlatList
                        style={{...styles.container, backgroundColor: colors[this.state.darkMode].backgroundColor}}
                        data={this.state.dataSource}
                        renderItem={row => {
                            return this._renderRow(row.item);
                        }}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={() => (
                            <View style={{
                                ...styles.separator,
                                backgroundColor: colors[this.state.darkMode].backgroundColor
                            }}/>
                        )}
                    />
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    row: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#ffffff',
        overflow: 'hidden'
    },
    separator: {
        height: 1,
        backgroundColor: '#cccccc'
    },
    title: {
        fontFamily: 'georgia'
    },
});

const colors = {
    'dark': {
        textColor: '#eee',
        backgroundColor: '#000000',
        separatorColor: '#333333'
    },
    'light': {
        textColor: '#111',
        backgroundColor: '#ffffff',
        separatorColor: '#cccccc'
    }
};

let strings = new LocalizedStrings({
    en: {
        title: 'Table of Contents'
    },
});

export default Toc;
