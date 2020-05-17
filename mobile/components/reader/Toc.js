import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableHighlight,
    Modal,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons';

import BarButtonStyle from '../../styles/common/BarButtonStyles';
import {HeaderBarStyles, HeaderBarTitleStyle} from '../../styles/common/HeaderBarStyles';
import ModalContainerStyle from '../../styles/common/ModalContainerStyles';

class Toc extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: '',
            dataSource: this.props.toc || [],
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

    renderRow(row) {
        return (
            <TouchableHighlight onPress={() => this._onPress(row)}>
                <View style={styles.row}>
                    <Text style={styles.title}>{row.label}</Text>
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
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton}/>
                        <Text style={styles.headerTitle}>
                            İçindekiler
                        </Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => this.hide()}
                        >
                            <Icon name="close" size={34}/>
                        </TouchableOpacity>
                    </View>
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
    header: HeaderBarStyles(false, true),
    headerTitle: HeaderBarTitleStyle,
    backButton: BarButtonStyle,
    row: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden'
    },
    separator: {
        height: 1,
        backgroundColor: '#CCCCCC'
    },
    title: {
        fontFamily: 'georgia'
    },
});

export default Toc;
