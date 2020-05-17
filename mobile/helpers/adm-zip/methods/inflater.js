import Buffer from 'buffer-ponyfill';
import zlib from 'react-zlib-js';

module.exports = function (/*Buffer*/inbuf) {
    return {
        inflate: function () {
            return zlib.inflateRawSync(inbuf);
        },

        inflateAsync: function (/*Function*/callback) {
            let tmp = zlib.createInflateRaw(), parts = [], total = 0;
            tmp.on('data', function (data) {
                parts.push(data);
                total += data.length;
            });
            tmp.on('end', function () {
                let buf = Buffer.alloc(total), written = 0;
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
