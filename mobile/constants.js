const constants = {
    loginScreenBrandHomePageUrl: 'https://yetkin.com.tr',
    loginScreenForgotPasswordUrl: 'https://yetkin.com.tr/index.php?route=account/forgotten',
    loginScreenSignupUrl: 'https://yetkin.com.tr/index.php?route=account/register',
    mainServerAddress: 'https://ekitap.yetkin.com.tr',
    contentFileNameCover: 'cover.jpg',
    contentFileNameBook: 'book.dat',
    contentFileNameLocations: 'locations.json',
    contentFileNameSearch: 'search.json',
    bookStorageDir: 'books'
};

__DEV__ && (constants.mainServerAddress = 'https://ekitap.yetkin.com.tr');

export default constants;
