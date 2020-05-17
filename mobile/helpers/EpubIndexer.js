import {openDatabase} from 'react-native-sqlite-storage';

const tableName = 'ePubFullText';
const dbMap = {};

const getDb = (bookId) => {
    return new Promise((resolve, reject) => {
        let db = dbMap['bookId'];
        if (db) {
            resolve(db);
        } else {
            db = openDatabase({name: bookId + '.db', location: 'default'}, null, reject);
            dbMap['bookId'] = db;
            createBookIndexDb(db).then(resolve).catch(reject);
        }
    });
};

const createBookIndexDb = (db) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS ${tableName} (cfi VARCHAR, text VARCHAR)`, [], (tx, results) => {
                tx.executeSql(`DELETE FROM ${tableName}`, [], (tx, results) => {
                    resolve(db);
                });
            });
        });
    });
};

const insertToBookIndexDb = (bookId, indexElements) => {
    return new Promise((resolve, reject) => {
        getDb(bookId).then(db => {
            db.transaction((tx) => {
                const allPromises = [];
                for (let i = 0; i < indexElements.length; i++) {
                    const indexElement = indexElements[i];
                    allPromises.push(new Promise((resolve, reject) => {
                        tx.executeSql(`INSERT INTO ${tableName} VALUES (?, ?)`,
                            [indexElement.cfi, indexElement.text],
                            (tx, results) => {
                            resolve();
                        });
                    }));
                }
                Promise.all(allPromises).then(resolve).catch(reject);
            });
        });
    });
};

const queryBookIndexDb = (bookId, searchTerm) => {
    return new Promise((resolve, reject) => {
        getDb(bookId).then(db => {
            db.transaction((tx) => {
                tx.executeSql(`SELECT * FROM ${tableName} WHERE text LIKE ?`,
                    ['%' + searchTerm.trim() + '%'],
                    (tx, results) => {
                    resolve(results);
                });
            });
        });
    });
};

const processNode = (node, parentStep, indexElements, section) => {
    if (!node.childNodes) {
        return;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        const currentStep = parentStep + '/' + (i + 1).toString();
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

const indexBook = (book) => {
    console.log('Start indexing...');
    return new Promise((resolve, reject) => {
        const bookId = 'moby-dick';
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

        Promise.all(sectionProcessingPromises)
            .then(_ => {
                insertToBookIndexDb(bookId, indexElements).then(resolve).catch(reject);
            })
            .catch(reject);
    });
};

const closeDb = (bookId) => {
    return new Promise((resolve, reject) => {
        let db = dbMap['bookId'];
        if (db) {
            db.close().then(resolve).catch(reject);
        }
    });
};

const searchBook = (bookId, searchTerm, highlightLength = 100, maxResults = 500) => {
    const leadTrailLength = Math.max(20, (highlightLength - searchTerm.length) / 2);
    return new Promise((resolve, reject) => {
        queryBookIndexDb(bookId, searchTerm)
            .then(queryResults => {
                const searchResults = [];
                for (let i = 0; i < queryResults.rows.length; ++i) {
                    const row = queryResults.rows.item(i);
                    const text = row.text;

                    const textLowerCase = text.toLocaleLowerCase('tr-TR')
                    const searchTermLowerCase = searchTerm.toLocaleLowerCase('tr-TR')
                    const position = textLowerCase.indexOf(searchTermLowerCase);

                    const cfi = 'epubcfi(' + row.cfi + ':' + position + ')';

                    const leadDots = position === 0 ? '' : '...';
                    const trailDots = position + searchTerm.length < text.length ? '' : '...';
                    const before = leadDots + text.substring(position - leadTrailLength, position);
                    const after = text.substring(position + searchTerm.length, position + searchTerm.length + leadTrailLength) + trailDots;
                    const caseProtectedSearchTerm = text.substring(position, position + searchTerm.length);

                    searchResults.push({id: i.toString(), cfi, before, highlight: caseProtectedSearchTerm, after});
                }
                resolve(searchResults);
            })
            .catch(reject);
    });
};

export {
    indexBook,
    searchBook,
    closeDb
}
