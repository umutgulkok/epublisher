const ThemeKeys = {};
ThemeKeys.light = 'light';
ThemeKeys.yellow = 'yellow';
ThemeKeys.dark = 'dark';
ThemeKeys.default = 'default';

const Themes = {
    light: {
        body: {
            'background-color': 'white',
        },
    },
    yellow: {
        body: {
            'background-color': '#f6ecce',
        },
    },
    dark: {
        body: {
            'color': '#CCC',
            'background-color': '#000',
        },
    },
};

export {
    ThemeKeys,
    Themes
}
