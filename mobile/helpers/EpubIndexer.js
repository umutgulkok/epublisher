import {openDatabase} from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

const tableName = 'ePubFullText';
const dbMap = {};

const getDb = (bookId) => {
    let db = dbMap[bookId];
    if (!db) {
        db = openDatabase({name: bookId + '.db', location: 'default'}, null, null);
        dbMap[bookId] = db;
    }
    return db;
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
    return new Promise((resolve) => {
        const db = getDb(bookId);
        createBookIndexDb(db).then(() => {
            db.transaction((tx) => {
                const allPromises = [];
                for (let i = 0; i < indexElements.length; i++) {
                    const indexElement = indexElements[i];
                    indexElement.text = indexElement.text.trim();
                    if (indexElement.text.length < 3)
                        continue;
                    allPromises.push(new Promise((resolve, reject) => {
                        tx.executeSql(`INSERT INTO ${tableName} VALUES (?, ?)`,
                            [indexElement.cfi, indexElement.text],
                            (tx, results) => {
                                resolve();
                            });
                    }));
                }
                Promise.all(allPromises).then(resolve);
            });
        });
    });
};

const queryBookIndexDb = (bookId, searchTerm, maxResults) => {
    return new Promise((resolve, reject) => {
        const db = getDb(bookId);
        db.transaction((tx) => {
            tx.executeSql(`SELECT * FROM ${tableName} WHERE text LIKE ? LIMIT ?`,
                ['%' + searchTerm.trim() + '%', maxResults],
                (tx, results) => {
                resolve(results);
            });
        });
    });
};

const indexBook = (bookId, searchIndexPath) => {
    console.log('Start indexing...');
    return new Promise(resolve => {
        RNFS.readFile(searchIndexPath, 'utf8')
            .then(str => {
                insertToBookIndexDb(bookId, JSON.parse(str)).then(resolve);
            });
    });
};

const closeDb = (bookId) => {
    let db = dbMap[bookId];
    if (db) {
        delete dbMap[bookId]
        db.close();
    }
};

const searchBook = (bookId, searchTerm, highlightLength = 100, maxResults = 200) => {
    const leadTrailLength = Math.max(20, (highlightLength - searchTerm.length) / 2);
    return new Promise((resolve, reject) => {
        queryBookIndexDb(bookId, searchTerm, maxResults)
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
