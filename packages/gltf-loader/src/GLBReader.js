const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

export default class GLBReader {
    static read(glb, glbOffset = 0, byteLength = 0) {
        if (!byteLength) {
            byteLength = glb.byteLength;
        }
        const dataView = new DataView(glb, glbOffset, byteLength);
        //const magic = dataView.getUint32(0); // 'gltf'
        const version = dataView.getUint32(4, true);
        if (version === 1) {
            return GLBReader.readV1(dataView, glbOffset);
        } else if (version === 2) {
            return GLBReader.readV2(glb, glbOffset);
        } else {
            throw new Error('Unsupported glb version : ' + version);
        }
    }

    //magic(uint32) version(uint32) length(uint32)
    //contentLength(uint32) contentFormat(uint32) JSON
    // binaryData (length - contentLength)
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
    static readV1(dataView, glbOffset) {
        const length = dataView.getUint32(8, true);
        const contentLength = dataView.getUint32(12, true);

        if (length !== dataView.byteLength) {
            throw new Error('Length in GLB header is inconsistent with glb\'s byte length.');
        }

        const json = readString(dataView.buffer, 20 + glbOffset, contentLength);

        return {
            json : JSON.parse(json),
            glbBuffer : {
                byteOffset : 20 + glbOffset + contentLength,
                buffer : dataView.buffer,
                byteLength: length
            }
        };
    }

    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
    // reference to https://github.com/mrdoob/three.js/blob/r101/examples/js/loaders/GLTFLoader.js
    static readV2(glb, bufOffset) {
        let json, glbByteLength, glbOffset;
        const chunkView = new DataView(glb, bufOffset + BINARY_EXTENSION_HEADER_LENGTH);
        let chunkIndex = 0;
        while (chunkIndex + 8 < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;
            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;
            if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                json = readString(glb, bufOffset + BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
            } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                glbOffset = bufOffset + BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                glbByteLength = chunkLength;
                break;
            }
            chunkIndex += chunkLength;
        }
        return {
            json : JSON.parse(json),
            glbBuffer : {
                byteOffset: glbOffset,
                buffer: glb,
                byteLength: glbByteLength
            }
        };
    }
}

function readString(buffer, offset, byteLength) {
    if (textDecoder) {
        const arr = new Uint8Array(buffer, offset, byteLength);
        return textDecoder.decode(arr);
    } else {
        const arr = new Uint8Array(buffer, offset, byteLength);
        return stringFromUTF8Array(arr);
    }
}

const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];

function stringFromUTF8Array(data) {
    const count = data.length;
    let str = '';

    for (let index = 0; index < count;) {
        let ch = data[index++];
        if (ch & 0x80) {
            let extra = extraByteMap[(ch >> 3) & 0x07];
            if (!(ch & 0x40) || !extra || ((index + extra) > count))
                return null;

            ch = ch & (0x3F >> extra);
            for (;extra > 0; extra -= 1) {
                const chx = data[index++];
                if ((chx & 0xC0) !== 0x80)
                    return null;

                ch = (ch << 6) | (chx & 0x3F);
            }
        }

        str += String.fromCharCode(ch);
    }
    return str;
}
