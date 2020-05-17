import TcpSocket from 'react-native-tcp-socket';
import Buffer from 'buffer-ponyfill';
import base64codec from 'base64-arraybuffer';
import mime from 'mime-types';
import RNFS from 'react-native-fs';

import AdmZip from '../../helpers/adm-zip/adm-zip';
import toBuffer from '../../helpers/Buffer';
import {generateShortUuid, joinPath} from '../../helpers/Utils';
import constants from '../../constants';

const newLineSeq = '\r\n';
const closeSeq = `${newLineSeq}${newLineSeq}`;
const ok_200  = `HTTP/1.1 200 OK${newLineSeq}`;
const notFound_404 = `HTTP/1.1 404 Not Found${newLineSeq}`;
const error_500 = `HTTP/1.1 500 Internal Server Error${newLineSeq}`;
const unauthorized_403 = `HTTP/1.1 403 Unauthorized${newLineSeq}`;
const cacheDisabler = `Cache-Control: no-cache${newLineSeq}` +
    `Cache-Control: no-store${newLineSeq}` +
    `Pragma: no-cache${newLineSeq}` +
    `Expires: 0${newLineSeq}`;

class EpubStreamer {

    constructor() {
        this.files = {};
        this.zip = null;
        this.server = null;
        __DEV__ && console.log('Application dir: ', RNFS.DocumentDirectoryPath);
    }

    initialize(bookKey) {
        let bookContentDir = joinPath(RNFS.DocumentDirectoryPath, constants.bookStorageDir);
        const bookPath = '/' + joinPath(joinPath(bookContentDir, bookKey), constants.contentFileNameBook);

        return new Promise((resolve, reject) => {
            this.readBookFile(bookPath, bookKey)
                .then(res => {
                    resolve(res);
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    readBookFile(bookFilePath, bookKey) {
        return new Promise((resolve, reject) => {
            RNFS.readFile(bookFilePath, 'base64')
                .then(data => {
                    const buffer = base64codec.decode(data);
                    try {
                        this.zip = new AdmZip(toBuffer(buffer));
                        const zipEntries = this.zip.getEntries();
                        this.files = {};
                        zipEntries.forEach((entry) => {
                            if (!entry.isDirectory) {
                                const path = `/${bookKey}/` + entry.entryName;
                                this.files[path] = entry;
                            }
                        });
                        this.initializeServer()
                            .then((result) => {
                                const {port, authToken} = result;
                                const address = `http://127.0.0.1:${port}/${bookKey}/`;
                                __DEV__ && console.log('EpubStreamer ', address, authToken);
                                resolve({address, authToken});
                            })
                            .catch(error => {
                                console.error(error);
                                reject(error);
                            });
                    } catch (error) {
                        console.error(error);
                        reject(error);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    getRandomPort() {
        const min = 20000;
        const max = 60000;
        return min + Math.floor((max - min) * Math.random());
    }

    createHttpResponse(entryName, keepAlive, socket) {
        const entry = this.files[entryName];
        if (!entry) {
            socket.write(notFound_404 + cacheDisabler + newLineSeq);
            socket.destroy();
            return
        }
        const extension = entryName.split('.').pop();
        const mimeType = mime.lookup(extension);

        const entryBuffer = this.zip.readFile(entry);
        const headers = ok_200 +
            (keepAlive ? `Connection: keep-alive${newLineSeq}` : '') +
            (keepAlive ? `Keep-Alive: timeout=60, max=1000${newLineSeq}` : '') +
            (keepAlive ? `Content-Length: ${entryBuffer.length + 4}${newLineSeq}` : '') +
            cacheDisabler +
            `Content-Type: ${mimeType}${closeSeq}`;
        const headersEncoded = new Buffer(headers, 'ascii');
        const closeSeqEncoded = new Buffer(closeSeq, 'ascii');
        const responseBuffer = new Uint8Array(headersEncoded.length + entryBuffer.length + closeSeqEncoded.length);
        let i = 0;
        for (let j = 0; j < headersEncoded.length; j++) {
            responseBuffer[i++] = headersEncoded[j];
        }
        for (let j = 0; j < entryBuffer.length; j++) {
            responseBuffer[i++] = entryBuffer[j];
        }
        for (let j = 0; j < closeSeqEncoded.length; j++) {
            responseBuffer[i++] = closeSeqEncoded[j];
        }

        socket.write(responseBuffer);

        if (!keepAlive) {
            socket.destroy();
        }
    }

    initializeServer() {
        return new Promise((resolve, reject) => {
            let port = this.getRandomPort();
            let authToken = generateShortUuid();

            // __DEV__ && (() => { port = 12345 })();
            // __DEV__ && (() => { authToken = 'auth' })();

            this.server = TcpSocket.createServer((socket) => {
                    socket.on('data', (requestBuffer) => {

                        const request = Buffer.from(requestBuffer).toString('utf8');
                        // __DEV__ && console.log(request);
                        const lines = request.split('\n');

                        const firstLineTokens = lines[0].split(' ');
                        if (firstLineTokens.length !== 3) {
                            socket.write(error_500 + cacheDisabler + newLineSeq);
                            socket.destroy();
                            return;
                        }

                        const http_method = firstLineTokens[0].toUpperCase();
                        if (http_method !== 'GET') {
                            socket.write(error_500 + cacheDisabler + newLineSeq);
                            socket.destroy();
                            return;
                        }

                        let receivedAuthToken;
                        let keepAlive = false;
                        for (let i = 1; i < lines.length; i++) {
                            const tokens = lines[i].split(' ');
                            if (tokens.length >= 2 && tokens[0].trim().toLowerCase() === 'authorization:') {
                                receivedAuthToken = tokens[tokens.length === 2 ? 1 : 2].trim();
                            }
                            else if (tokens.length >= 2
                                && tokens[0].trim().toLowerCase() === 'connection:'
                                && tokens[1].trim().toLowerCase() === 'keep-alive') {
                                keepAlive = true;
                            }
                        }

                        const requested_path = firstLineTokens[1].trim();
                        const extension = requested_path.split('.').pop();
                        const mimeType = mime.lookup(extension);

                        if ((mimeType.includes('html') || mimeType.includes('xml'))
                            && authToken && authToken !== receivedAuthToken) {
                            socket.write(unauthorized_403 + cacheDisabler + newLineSeq);
                            socket.destroy();
                            return;
                        }

                        this.createHttpResponse(requested_path, keepAlive, socket);
                    });

                    socket.on('error', (error) => {
                        // __DEV__ && console.log('An error occurred with client socket ', error);
                    });

                    socket.on('close', (error) => {
                        // __DEV__ && console.log('Closed connection with ', socket.address());
                    });
                }).listen({port, host: '127.0.0.1'}, (result) => {
                    resolve({port, authToken});
                });

            this.server.on('error', (error) => {
                __DEV__ && console.log('An error occurred with the server', error);
            });

            this.server.on('close', () => {
                __DEV__ && console.log('Server closed connection');
            });
        });
    }

    destroy() {
        this.zip = null;
        this.files = {};
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}

export {
    EpubStreamer,
    joinPath
};
