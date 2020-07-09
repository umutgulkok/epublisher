import {openDatabase} from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

const tableName = 'ePubFullText';
const dbMap = {};

const getDb = (bookKey) => {
    let db = dbMap[bookKey];
    if (!db) {
        db = openDatabase({name: bookKey + '.db', location: 'default'}, null, null);
        dbMap[bookKey] = db;
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

const insertToBookIndexDb = (bookKey, indexElements) => {
    return new Promise((resolve) => {
        const db = getDb(bookKey);
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

const queryBookIndexDb = (bookKey, searchTerm, maxResults) => {
    return new Promise((resolve, reject) => {
        const db = getDb(bookKey);
        db.transaction((tx) => {
            tx.executeSql(`SELECT DISTINCT * FROM ${tableName} WHERE text LIKE ? LIMIT ?`,
                ['%' + searchTerm.trim() + '%', maxResults],
                (tx, results) => {
                resolve(results);
            });
        });
    });
};

const indexBook = (bookKey, searchIndexPath) => {
    console.log(`Start indexing for ${bookKey}...`);
    return new Promise(resolve => {
        RNFS.readFile(searchIndexPath, 'utf8')
            .then(str => {
                insertToBookIndexDb(bookKey, JSON.parse(str)).then(() => {
                    console.log(`Indexing completed for ${bookKey}`);
                    resolve();
                });
            });
    });
};

const closeDb = (bookKey) => {
    let db = dbMap[bookKey];
    if (db) {
        delete dbMap[bookKey]
        db.close();
    }
};

const searchBook = (bookKey, searchTerm, highlightLength = 100, maxResults = 200) => {
    const getIndicesOf = (searchStr, str, caseSensitive) => {
        let searchStrLen = searchStr.length;
        if (searchStrLen == 0) {
            return [];
        }
        let startIndex = 0, index, indices = [];
        if (!caseSensitive) {
            str = str.toLocaleLowerCase('tr-TR');
            searchStr = searchStr.toLocaleLowerCase('tr-TR');
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
        }
        return indices;
    }

    const leadTrailLength = Math.max(20, (highlightLength - searchTerm.length) / 2);
    return new Promise((resolve, reject) => {
        queryBookIndexDb(bookKey, searchTerm, maxResults)
            .then(queryResults => {
                const searchResults = [];
                let resultIdx = 0;

                for (let i = 0; i < queryResults.rows.length; ++i) {
                    const row = queryResults.rows.item(i);
                    const text = row.text;
                    const positions = getIndicesOf(searchTerm, text, false);

                    positions.forEach(position => {
                        const cfi = 'epubcfi(' + row.cfi + ':' + position + ')';

                        const leadDots = position === 0 ? '' : '...';
                        const trailDots = position + searchTerm.length < text.length ? '' : '...';
                        const before = leadDots + text.substring(position - leadTrailLength, position);
                        const after = text.substring(position + searchTerm.length, position + searchTerm.length + leadTrailLength) + trailDots;
                        const caseProtectedSearchTerm = text.substring(position, position + searchTerm.length);

                        searchResults.push({id: (resultIdx++).toString(), cfi, before, highlight: caseProtectedSearchTerm, after});
                    });
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
