const path = require('path');
const jsdom = require('jsdom');
const epubjs = require('./epubjs/index');
const fs = require('fs');
const unzipper = require('unzipper');
const {v4: uuidv4} = require('uuid');
const rimraf = require('rimraf');

let extractionPath;

const processNode = (node, parentStep, indexElements, section) => {
    if (!node.childNodes) {
        return;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        let currentStep = parentStep;
        if (parentStep === '') {
            currentStep += '/' + (i + 2).toString();
        } else {
            currentStep += '/' + (i + 1).toString();
        }
        const child = node.childNodes[i.toString()];
        if (child.traversedWhileIndexing) {
            continue;
        }
        const text = child.data;
        if (text && text.length > 5) {
            const cfi = section.cfiBase + '!' + currentStep;
            indexElements.push({cfi, text});
        }
        child.traversedWhileIndexing = true;
        processNode(child, currentStep, indexElements, section);
    }
};

async function processEpub(epubDirPath) {
    const dom = new jsdom.JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.window = dom.window;
    global.document = global.window.document;

    const book = new epubjs.Book(path.join(epubDirPath, 'dummy'));
    await book.opened;
    console.log('Book opened, start indexing...');

    const indexElements = [];
    const sectionProcessingPromises = [];
    const request = book.locations.request;

    book.spine.each(section => {
        sectionProcessingPromises.push(new Promise((resolve, reject) => {
            section.load(request).then(contents => {
                try {
                    processNode(contents, '', indexElements, section);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        }));
    });

    await Promise.all(sectionProcessingPromises)
    return indexElements;
}

async function main() {
    if (process.argv.length !== 4) {
        console.error('Usage: node search.js {path to epub file} {output file path}');
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
            const searchIndex = await processEpub(extractionPath)
            if (extractionPath) {
                rimraf.sync(extractionPath)
            }
            fs.writeFileSync(outputPath, JSON.stringify(searchIndex));
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
