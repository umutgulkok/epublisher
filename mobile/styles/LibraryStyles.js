import {StyleSheet} from 'react-native';

export const colors = {
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

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        flex: 1
    }
});
