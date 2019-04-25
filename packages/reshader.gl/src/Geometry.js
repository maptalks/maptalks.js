import { vec3 } from 'gl-matrix';
import { isNumber, extend, isArray } from './common/Util';
import BoundingBox from './BoundingBox';

const defaultDesc = {
    'positionSize': 3,
    'primitive': 'triangles',
    //name of position attribute
    'positionAttribute': 'aPosition',
    'normalAttribute': 'aNormal',
    'uv0Attribute': 'aTexCoord'
};

export default class Geometry {
    constructor(data, elements, count, desc) {
        this.data = data;
        this.elements = elements;
        this.desc = extend({}, defaultDesc, desc) || defaultDesc;
        const pos = data[this.desc.positionAttribute];
        if (!count) {
            if (elements) {
                count = getElementLength(elements);
            } else if (pos && pos.length) {
                count = pos.length / this.desc.positionSize;
            }
        }
        this.count = count;
        if (!this.elements) {
            this.elements = count;
        }
        this.properties = {};
        this._buffers = {};
        this.updateBoundingBox();
    }

    generateBuffers(regl) {
        //generate regl buffers beforehand to avoid repeated bufferData
        const allocatedBuffers = this._buffers;
        for (const p in allocatedBuffers) {
            if (!allocatedBuffers[p].buffer) {
                allocatedBuffers[p].buffer = regl.buffer(allocatedBuffers[p].data);
            }
            delete allocatedBuffers[p].data;
        }
        const data = this.data;
        const buffers = {};
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            if (data[key].buffer !== undefined && !(data[key].buffer instanceof ArrayBuffer)) {
                if (data[key].buffer.destroy) {
                    buffers[key] = data[key];
                } else if (allocatedBuffers[data[key].buffer]) {
                    buffers[key] = extend({}, data[key]);
                    buffers[key].buffer = allocatedBuffers[data[key].buffer].buffer;
                }
            } else {
                buffers[key] = {
                    buffer : regl.buffer(data[key])
                };
            }
        }
        this.data = buffers;

        if (this.elements && !isNumber(this.elements)) {
            this.elements = this.elements.destroy ? this.elements : regl.elements({
                primitive: this.getPrimitive(),
                data: this.elements,
                //type : 'uint16' // type is inferred from data
            });
        }
    }

    addBuffer(key, data) {
        this._buffers[key] = {
            data
        };
        return this;
    }

    updateBuffer(key, data) {
        if (!this._buffers[key]) {
            throw new Error(`invalid buffer ${key} in geometry`);
        }
        // this._buffers[key].data = data;
        if (this._buffers[key].buffer) {
            this._buffers[key].buffer.subdata(data);
        } else {
            this._buffers[key].data = data;
        }
        return this;
    }

    /**
     * Replace data or refill attribute data buffer
     * @param {String} name - data's name
     * @param {Number[] | Object} data - data to update
     * @returns this
     */
    updateData(name, data) {
        const buf = this.data[name];
        if (!buf) {
            return this;
        }
        let buffer;
        this.data[name] = data;
        if (buf.buffer && buf.buffer.destroy) {
            buffer = buf;
        }
        if (name === this.desc.positionAttribute) {
            this.updateBoundingBox();
        }
        if (buffer) {
            buffer.buffer.subdata(data);
            this.data[name] = buffer;
        }
        return this;
    }

    getPrimitive() {
        return this.desc.primitive;
    }

    getAttributes() {
        return Object.keys(this.data);
    }

    getElements() {
        return this.elements;
    }

    setElements(elements, count) {
        if (!elements) {
            throw new Error('elements data is invalid');
        }
        const e = this.elements;
        this.count = count === undefined ? getElementLength(elements) : count;

        if (e.destroy) {
            this.elements = e.subdata(elements);
        } else {
            this.elements = elements;
        }
        return this;
    }

    setDrawCount(count) {
        this.count1 = count;
        return this;
    }

    getDrawCount() {
        return this.count1 || this.count;
    }

    setDrawOffset(offset) {
        this.offset = offset;
        return this;
    }

    getDrawOffset() {
        return this.offset || 0;
    }

    dispose() {
        this._forEachBuffer(buffer => {
            if (!buffer['__reshader_disposed']) {
                buffer['__reshader_disposed'] = true;
                buffer.destroy();
            }
        });
        this.data = {};
        this._buffers = {};
        this.count = 0;
        this.elements = [];
        this._disposed = true;
    }

    isDisposed() {
        return !!this._disposed;
    }

    /**
     * Update boundingBox of Geometry
     */
    updateBoundingBox() {
        let bbox = this.boundingBox;
        if (!bbox) {
            bbox = this.boundingBox = new BoundingBox();
        }
        const posAttr = this.desc.positionAttribute;
        let posArr = this.data[posAttr];
        if (!isArray(posArr)) {
            // form of object: { usage : 'static', data : [...] }
            posArr = posArr.data;
        }
        if (posArr && posArr.length) {
            //TODO only support size of 3 now
            const min = bbox.min;
            const max = bbox.max;
            vec3.set(min, posArr[0], posArr[1], posArr[2]);
            vec3.set(max, posArr[0], posArr[1], posArr[2]);
            for (let i = 3; i < posArr.length;) {
                const x = posArr[i++];
                const y = posArr[i++];
                const z = posArr[i++];
                if (x < min[0]) { min[0] = x; }
                if (y < min[1]) { min[1] = y; }
                if (z < min[2]) { min[2] = z; }

                if (x > max[0]) { max[0] = x; }
                if (y > max[1]) { max[1] = y; }
                if (z > max[2]) { max[2] = z; }
            }
            bbox.dirty();
        }
    }

    createTangent(name = 'aTangent') {
        this.data[name] = computeTangents(
            this.data[this.desc.positionAttribute],
            this.data[this.desc.normalAttribute],
            this.data[this.desc.uv0Attribute],
            this.elements
        );
    }

    /**
     * Create barycentric attribute data
     * @param {String} name - attribute name for barycentric attribute
     */
    createBarycentric(name = 'aBarycentric') {
        const position = this.data[this.desc.positionAttribute];
        if (!isArray(position)) {
            throw new Error('Position data must be an array to create bary centric data');
        } else if (this.desc.primitive !== 'triangles') {
            throw new Error('Primitive must be triangles to create bary centric data');
        }
        const bary = new Uint8Array(position.length / this.desc.positionSize * 3);
        for (let i = 0, l = this.elements.length; i < l;) {
            for (let j = 0; j < 3; j++) {
                const ii = this.elements[i++];
                bary[ii * 3 + j] = 1;
            }
        }
        this.data[name] = bary;
    }

    /**
     * Build unique vertex data for each attribute
     */
    buildUniqueVertex() {
        const data = this.data;
        const indices = this.elements;
        if (!isArray(indices)) {
            throw new Error('elements must be array to build unique vertex.');
        }

        const keys = Object.keys(data);
        const oldData = {};

        const pos = data[this.desc.positionAttribute];
        if (!isArray(pos)) {
            throw new Error(this.desc.positionAttribute + ' must be array to build unique vertex.');
        }
        const vertexCount = pos.length / this.desc.positionSize;

        const l = indices.length;
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];
            const size = data[name].length / vertexCount;
            if (!isArray(data[name])) {
                throw new Error(name + ' must be array to build unique vertex.');
            }
            oldData[name] = data[name];
            oldData[name].size = size;
            data[name] = new data[name].constructor(l * size);
        }

        let cursor = 0;
        for (let i = 0; i < l; i++) {
            const idx = indices[i];
            for (let ii = 0; ii < keys.length; ii++) {
                const name = keys[ii];
                const array = data[name];
                const size = oldData[name].size;

                for (let k = 0; k < size; k++) {
                    array[cursor * size + k] = oldData[name][idx * size + k];
                }
            }
            indices[i] = cursor++;
        }
    }

    getMemorySize() {
        let size = 0;
        for (const p in this.data) {
            if (this.data.hasOwnProperty(p)) {
                const buffer = this.data[p];
                if (buffer.data) {
                    size += buffer.data.length * buffer.data.BYTES_PER_ELEMENT;
                } else {
                    size += buffer.length * buffer.BYTES_PER_ELEMENT;
                }
            }
        }
        return size;
    }

    _forEachBuffer(fn) {
        if (this.elements && this.elements.destroy)  {
            fn(this.elements);
        }
        for (const p in this.data) {
            if (this.data.hasOwnProperty(p)) {
                if (this.data[p] && this.data[p].buffer && this.data[p].buffer.destroy) {
                    fn(this.data[p].buffer);
                }
            }
        }

        for (const p in this._buffers) {
            if (this._buffers.hasOwnProperty(p)) {
                if (this._buffers[p] && this._buffers[p].buffer && this._buffers[p].buffer.destroy) {
                    fn(this._buffers[p].buffer);
                }
            }
        }
    }
}

function getElementLength(elements) {
    if (isNumber(elements)) {
        return elements;
    } else if (elements.length !== undefined) {
        return elements.length;
    } else if (elements.data) {
        return elements.data.length;
    }
    throw new Error('invalid elements length');
}

function computeTangents(positions, normals, uvs, indices) {
    const nVertices = positions.length / 3;

    const tangents = new Array(4 * nVertices);

    const tan1 = [], tan2 = [];

    for (let i = 0; i < nVertices; i++) {

        tan1[ i ] = [0, 0, 0];
        tan2[ i ] = [0, 0, 0];

    }

    const vA = [0, 0, 0],
        vB = [0, 0, 0],
        vC = [0, 0, 0],

        uvA = [0, 0],
        uvB = [0, 0],
        uvC = [0, 0],

        sdir = [0, 0, 0],
        tdir = [0, 0, 0];

    function handleTriangle(a, b, c) {

        fromArray3(vA, positions, a * 3);
        fromArray3(vB, positions, b * 3);
        fromArray3(vC, positions, c * 3);

        fromArray2(uvA, uvs, a * 2);
        fromArray2(uvB, uvs, b * 2);
        fromArray2(uvC, uvs, c * 2);

        const x1 = vB[0] - vA[0];
        const x2 = vC[0] - vA[0];

        const y1 = vB[1] - vA[1];
        const y2 = vC[1] - vA[1];

        const z1 = vB[2] - vA[2];
        const z2 = vC[2] - vA[2];

        const s1 = uvB[0] - uvA[0];
        const s2 = uvC[0] - uvA[0];

        const t1 = uvB[1] - uvA[1];
        const t2 = uvC[1] - uvA[1];

        const r = 1.0 / (s1 * t2 - s2 * t1);

        vec3.set(
            sdir,
            (t2 * x1 - t1 * x2) * r,
            (t2 * y1 - t1 * y2) * r,
            (t2 * z1 - t1 * z2) * r
        );

        vec3.set(
            tdir,
            (s1 * x2 - s2 * x1) * r,
            (s1 * y2 - s2 * y1) * r,
            (s1 * z2 - s2 * z1) * r
        );

        vec3.add(tan1[ a ], tan1[ a ], sdir);
        vec3.add(tan1[ b ], tan1[ b ], sdir);
        vec3.add(tan1[ c ], tan1[ c ], sdir);

        vec3.add(tan2[ a ], tan2[ a ], tdir);
        vec3.add(tan2[ b ], tan2[ b ], tdir);
        vec3.add(tan2[ c ], tan2[ c ], tdir);

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleTriangle(
            indices[ j + 0 ],
            indices[ j + 1 ],
            indices[ j + 2 ]
        );

    }

    const tmp = [], tmp2 = [];
    const n = [], n2 = [];
    let w, t, test;

    function handleVertex(v) {

        fromArray3(n, normals, v * 3);
        vec3.copy(n2, n);
        // n2.copy(n);

        t = tan1[ v ];

        // Gram-Schmidt orthogonalize

        vec3.copy(tmp, t);
        vec3.sub(tmp, tmp, vec3.scale(n, n, vec3.dot(n, t)));
        vec3.normalize(tmp, tmp);
        // tmp.sub(n.multiplyScalar(n.dot(t))).normalize();

        // Calculate handedness

        vec3.cross(tmp2, n2, t);
        test = vec3.dot(tmp2, tan2[ v ]);
        // tmp2.crossVectors(n2, t);
        // test = tmp2.dot(tan2[ v ]);
        w = (test < 0.0) ? -1.0 : 1.0;

        tangents[ v * 4 ] = tmp[0];
        tangents[ v * 4 + 1 ] = tmp[1];
        tangents[ v * 4 + 2 ] = tmp[2];
        tangents[ v * 4 + 3 ] = w;

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleVertex(indices[ j + 0 ]);
        handleVertex(indices[ j + 1 ]);
        handleVertex(indices[ j + 2 ]);

    }

    return tangents;
}

function fromArray3(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    out[2] = array[offset + 2];
    return out;
}

function fromArray2(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    return out;
}
