const Book = require("./book");
const Rendition = require("./rendition");
const CFI = require("./epubcfi");
const Contents = require("./contents");
const utilsCore = require("./utils/core");
const { EPUBJS_VERSION } = require("./utils/constants");
// const * as URLpolyfill = require("url-polyfill");

const IframeView = require("./managers/views/iframe");
const DefaultViewManager = require("./managers/default");
const ContinuousViewManager = require("./managers/continuous");

/**
 * Creates a new Book
 * @param {string|ArrayBuffer} url URL, Path or ArrayBuffer
 * @param {object} options to pass to the book
 * @returns {Book} a new Book object
 * @example ePub("/path/to/book.epub", {})
 */
function ePub(url, options) {
	return new Book(url, options);
}

ePub.VERSION = EPUBJS_VERSION;

if (typeof(global) !== "undefined") {
	global.EPUBJS_VERSION = EPUBJS_VERSION;
}

ePub.Book = Book;
ePub.Rendition = Rendition;
ePub.Contents = Contents;
ePub.CFI = CFI;
ePub.utils = utils;

module.exports = ePub;
