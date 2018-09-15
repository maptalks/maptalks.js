import { vec3 } from 'gl-matrix';
import { isNumber, extend } from './common/Util';
import BoundingBox from './BoundingBox';

const defaultDesc = {
    'positionSize' : 3,
    'primitive' : 'triangles',
    //name of position attribute
    'positionAttribute' : 'aPosition'
};

export default class Geometry {
    constructor(data, elements, count, desc) {
        // this.aPosition = data.vertices;
        // this.aNormal = data.normals;
        // this.aTexCoord = data.uvs;
        // this.aColor = data.colors;
        // this.aTangent = data.tangents;
        // this.elements = data.elements;

        this.data = data;
        this.elements = elements;
        this.desc = extend({}, defaultDesc, desc) || defaultDesc;
        const pos = data[this.desc.positionAttribute];
        if (!count) {
            if (elements) {
                count = elements.length;
            } else if (pos && pos.length) {
                count = pos.length / this.desc.positionSize;
            }
        }
        this.count = count;
        this.updateBoundingBox();
    }

    generateBuffers(regl) {
        //generate regl buffers beforehand to avoid repeated bufferData
        const data = this.data;
        const buffers = {};
        for (const p in data) {
            if (!data[p]) {
                continue;
            }
            buffers[p] = {
                buffer : data[p].destroy ? data[p] : regl.buffer(data[p])
            };
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

    getPrimitive() {
        return this.desc.primitive;
    }

    getAttributes() {
        return Object.keys(this.data);
    }

    getElements() {
        return this.elements;
    }

    setDrawCount(count) {
        this.count1 = count;
        return this;
    }

    getDrawCount() {
        return this.count1 || this.count;
    }

    setOffset(offset) {
        this.offset = offset;
        return this;
    }

    getOffset() {
        return this.offset || 0;
    }

    dispose() {
        this._forEachBuffer(buffer => {
            buffer.destroy();
        });
        delete this.elements;
        delete this.data;
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
        const posArr = this.data[posAttr];
        if (posArr && posArr.length) {
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
        }
        bbox.dirty();
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
    }
}
