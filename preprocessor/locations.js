const path = require('path');
const jsdom = require('jsdom');
const epubjs = require('./epubjs/index');
const fs = require('fs');
const unzipper = require('unzipper');
const {v4: uuidv4} = require('uuid');
const rimraf = require('rimraf');

let extractionPath;

async function processEpub(epubDirPath) {
    const dom = new jsdom.JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.window = dom.window;
    global.document = global.window.document;

    const book = new epubjs.Book(path.join(epubDirPath, 'dummy'));
    await book.opened;
    console.log('Book opened');

    const locations = await book.locations.generate(100);
    return locations
}

async function main() {
    if (process.argv.length !== 4) {
        console.error('Usage: node locations.js {path to epub file} {output file path}');
        process.exit(-1)
    }
    const epubPath = process.argv[2];
    const outputPath = process.argv[3];
    if (!fs.existsSync(epubPath)) {
        console.error('The epub file does not exist');
        process.exit(-1)
    }
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    extractionPath = path.join(process.cwd(), uuidv4().replace(/-/g, ''));
    fs.createReadStream(epubPath)
        .pipe(unzipper.Extract({path: extractionPath}))
        .on('close', async () => {
            const locations = await processEpub(extractionPath)
            if (extractionPath) {
                rimraf.sync(extractionPath)
            }
            fs.writeFileSync(outputPath, JSON.stringify(locations));
        })
        .on('error', () => {
            handleError('Epub extraction failed')
        })
}

function handleError(error) {
    if (extractionPath) {
        rimraf.sync(extractionPath)
    }
    console.error('error', error);
    process.exit(-1)
}

try {
    main()
} catch (error) {
    handleError(error)
}
