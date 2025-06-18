import busboy from '../_virtual/index.js';

const parseMultipartFormData = (req, maxBodySize) => {

    return new Promise((resolve, reject) => {        
        const bb = busboy({ headers: req.headers });
        const fields = {};
        const files = [];

        let totalSize = 0;
        let aborted = false;
        const abort = () => {
            aborted = true; 
            req.unpipe(bb);
            bb.removeAllListeners();
            reject(new Error('payload_too_large'));
        };

        bb.on('field', (name, value) => {
            if(aborted) return

            fields[name] = value;

            const fieldSize = Buffer.byteLength(value, 'utf8');
            totalSize += fieldSize;
            if(totalSize > maxBodySize &&  maxBodySize > 0) abort();
        });

        bb.on('file', (name, stream, info) => {
            if(aborted) return

            const { filename, encoding, mimeType } = info;
            const chunks = [];

            stream.on('data', (chunk) => {
                if(aborted) return

                chunks.push(chunk);

                totalSize += chunk.length;
                if(totalSize > maxBodySize && maxBodySize > 0) abort();
            });

            stream.on('end', () => {
                if(aborted) return

                const buffer = Buffer.concat(chunks);
                files.push({ filename, encoding, mimeType, size: buffer.length, buffer });
            });

            stream.on('error', () => resolve(null));
        });

        bb.on('finish', () => {
            if(!aborted) resolve({ fields, files });
        });

        bb.on('error', (err) => {
            resolve(null);
        });

        req.pipe(bb);
    })

};

const parseJsonData = (req, maxBodySize) => {
    return new Promise((resolve, reject) => {        
        let body = '';
        let totalSize = 0;
        let aborted = false;
        const abort = () => {
            aborted = true;
            reject(new Error('payload_too_large'));
        };

        req.on('data', (chunk) => {
            if(aborted) return

            body += chunk.toString();
            totalSize += chunk.length;
            if(totalSize > maxBodySize && maxBodySize > 0) abort();
        });

        req.on('end', () => {
            if(aborted) return 

            try {
                resolve(JSON.parse(body));
            } catch(err) {
                resolve(null);
            }
        });

        req.on('error', (err) => {
            resolve(null);
        });
    })
};

var BodyParser = async (req, maxBodySize) => {
    if(req.headers['content-type']?.includes('multipart/form-data')) {
        return await parseMultipartFormData(req, maxBodySize)
    } else if(req.headers['content-type']?.includes('application/json')) {
        return await parseJsonData(req, maxBodySize)
    }
};

export { BodyParser as default };
//# sourceMappingURL=BodyParser.js.map
