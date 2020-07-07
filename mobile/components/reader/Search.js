import React, {Component} from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View,
} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import BarButtonStyle from '../../styles/common/BarButtonStyles';
import {HeaderBarStyles, HeaderBarTitleStyle} from '../../styles/common/HeaderBarStyles';
import ModalContainerStyle from '../../styles/common/ModalContainerStyles';
import {TextInputStyle} from '../../styles/common/TextInputStyles';
import {searchBook} from '../../helpers/EpubIndexer';

const searchDebounceDelay = 500;

String.prototype.format = function() {
    let a = this;
    for (let k in arguments) {
        a = a.replace('{' + k + '}', arguments[k]);
    }
    return a;
};

class Search extends Component {
    constructor(props) {
        super(props);

        this.state = {
            bookKey: props.bookKey,
            error: '',
            modalVisible: false
        };
    }

    componentDidMount() {
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

    show() {
        this.setState({modalVisible: true});
    }

    hide() {
        this.setState({modalVisible: false});
    }

    _onPress(item) {
        if (this.props.display) {
            this.props.display(item.cfi);
        }
        this.hide();
    }

    renderRow(row) {
        return (
            <TouchableHighlight onPress={() => this._onPress(row)}>
                <View style={styles.row}>
                    <Text style={styles.title}>
                        {row.before}
                        <Text style={styles.titleHighlight}>{row.highlight}</Text>
                        {row.after}
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

    onChangeText(searchTerm) {
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

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType={'slide'}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton}/>
                        <Text style={styles.headerTitle}>
                            Ara
                        </Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => this.hide()}
                        >
                            <EvilIcons name="close" size={34}/>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={TextInputStyle}
                        onChangeText={this._debounce(this.onChangeText)}
                        // value={value}
                    />
                    <FlatList
                        style={styles.container}
                        data={this.state.dataSource}
                        renderItem={row => {
                            return this.renderRow(row.item);
                        }}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={() => (
                            <View style={styles.separator}/>
                        )}
                    />
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: ModalContainerStyle,
    headerTitle: HeaderBarTitleStyle,
    header: HeaderBarStyles(false, true),
    backButton: BarButtonStyle,
    row: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    separator: {
        height: 1,
        backgroundColor: '#CCCCCC'
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
