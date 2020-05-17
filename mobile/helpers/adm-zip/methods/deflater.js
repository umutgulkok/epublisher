import Buffer from 'buffer-ponyfill';
import zlib from 'react-zlib-js';

module.exports = function (/*Buffer*/inbuf) {

    let opts = {chunkSize: (parseInt((inbuf.length / 1024).toString() + 1) * 1024)};

    return {
        deflate: function () {
            return zlib.deflateRawSync(inbuf, opts);
        },

        deflateAsync: function (/*Function*/callback) {
            let tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
            tmp.on('data', function (data) {
                parts.push(data);
                total += data.length;
            });
            tmp.on('end', function () {
                const buf = Buffer.alloc(total);
                let written = 0;
                buf.fill(0);
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    part.copy(buf, written);
                    written += part.length;
                }
                callback && callback(buf);
            });
            tmp.end(inbuf);
        }
    }
};
