import { vec3 } from 'gl-matrix';
import { isNumber } from './common/Util';
import BoundingBox from './BoundingBox';

const defaultDesc = {
    'primitive' : 'triangles',
    //name of position attribute
    'positionAttribute' : 'aPosition',
    'attrToKeepFromBuffer' : ['aPickingId']
};

export default class Geometry {
    constructor(data, indices, desc) {
        // this.aPosition = data.vertices;
        // this.aNormal = data.normals;
        // this.aTexCoord = data.uvs;
        // this.aColor = data.colors;
        // this.aTangent = data.tangents;
        // this.indices = data.indices;

        this.data = data;
        this.indices = indices;
        this.desc = desc || defaultDesc;
        this.updateBoundingBox();
    }

    generateBuffers(regl) {
        //generate regl buffers beforehand to avoid repeated bufferData
        const data = this.data;
        this.rawData = {};
        const attrToKeep = this.desc['attrToKeepFromBuffer'];
        const buffers = {};
        for (const p in data) {
            if (!data[p]) {
                continue;
            }
            if (attrToKeep && attrToKeep.indexOf(p) >= 0) {
                this.rawData[p] = data[p];
            }
            buffers[p] = {
                buffer : data[p].destroy ? data[p] : regl.buffer(data[p])
            };
        }
        this.data = buffers;

        if (!isNumber(this.indices)) {
            this.indices = this.indices.destroy ? this.indices : regl.elements({
                primitive: this.getPrimitive(),
                data: this.indices,
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
        return this.indices;
    }

    dispose() {
        this._forEachBuffer(buffer => {
            buffer.destroy();
        });
        delete this.indices;
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
    }

    _forEachBuffer(fn) {
        if (this.indices && this.indices.destroy)  {
            fn(this.indices);
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
