import { TYPE_BYTES } from '../../Util';

const TYPES = {
    'int8': Int8Array,
    'int16': Int16Array,
    'int32': Int32Array,
    'uint8': Uint8Array,
    'uint16': Uint16Array,
    'uint32': Uint32Array,
    'float': Float32Array,
    'float32': Float32Array
};

const GETTERS = {
    'int8': 'getInt8',
    'int16': 'getInt16',
    'int32': 'getInt32',
    'uint8': 'getUint8',
    'uint16': 'getUint16',
    'uint32': 'getUint32',
    'float': 'getFloat32',
    'float32': 'getFloat32'
};

const SETTERS = {
    'int8': 'setInt8',
    'int16': 'setInt16',
    'int32': 'setInt32',
    'uint8': 'setUint8',
    'uint16': 'setUint16',
    'uint32': 'setUint32',
    'float': 'setFloat32',
    'float32': 'setFloat32'
};


export default class DataAccessor {
    constructor(arraybuffer, { type, size, offset, stride }) {
        this.arraybuffer = arraybuffer;
        this._byteLength = TYPE_BYTES[type];
        this._size = size;
        this._offset = offset;
        this._stride = stride;
        this._view = new TYPES[type](arraybuffer);
        this._getter = GETTERS[type];
        this._setter = SETTERS[type];
        this._endian = true;
        //TODO endian的判断
    }

    isAccessor() {
        return true;
    }

    _getIdx(i) {
        return (Math.floor(i / this._size) * this._stride + (i % this._size) * this._byteLength + this._offset) / this._byteLength;
    }

    get(i) {
        const idx = this._getIdx(i);
        return this._view[idx];
    }

    set(i, value) {
        const idx = this._getIdx(i);
        this._view[idx] = value;
        return this;
    }
}
