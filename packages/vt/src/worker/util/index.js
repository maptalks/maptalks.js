//return MB size of arraybuffer
export function calArrayBufferSize(buffer) {
    if (!buffer) {
        return 0;
    }
    if (!(buffer instanceof ArrayBuffer)) {
        return 0;
    }
    return buffer.byteLength / 1048576;
}

export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

// https://gist.github.com/leommoore/f9e57ba2aa4bf197ebc5
// https://stackoverflow.com/questions/30063196/gzipstream-complains-magic-number-in-header-is-not-correct
export function arraybufferIsGZip(buffer) {
    if (!buffer) {
        return false;
    }
    if (!(buffer instanceof ArrayBuffer)) {
        return false;
    }
    try {
        const array = new Uint8Array(buffer);
        const v1 = array[0], v2 = array[1];
        return v1 === 0x1F && v2 === 0x8B;

    } catch (error) {
        console.error('arraybufferIsGZip read buffer error:', error);
    }
    return false;
}

export function decompressGzipWithBlob(compressedArrayBuffer, callback) {
    try {
        // 创建解压缩流
        const decompressionStream = new DecompressionStream('gzip');

        // 创建 Blob 并获取可读流
        const blob = new Blob([compressedArrayBuffer]);
        const readableStream = blob.stream();

        // 管道传输
        const decompressedStream = readableStream.pipeThrough(decompressionStream);

        // 转换为响应并获取数据
        const response = new Response(decompressedStream);
        response.arrayBuffer().then(arrayBuffer => {
            callback(arrayBuffer)
        }).catch(error => {
            console.error('decompressGzipWithBlob:', error);
            callback();
        })
    } catch (error) {
        console.error('decompressGzipWithBlob:', error);
        callback();
    }
}
