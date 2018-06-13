import { vec3 } from '@mapbox/gl-matrix';
import { isNumber } from './common/Util';
import BoundingBox from './BoundingBox';

const defaultDesc = {
    'primitive' : 'triangles',
    'aPosition' : {
        size : 3
    },
    'aNormal' : {
        size : 3
    },
    'aTexCoord' : {
        size : 2
    },
    'aColor' : {
        size : 3
    },
    'aTangent' : {
        size : 3
    },
    'aBarycentric' : {
        size : 3
    }
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
        const buffers = {
            'aPosition' : {
                buffer : data.aPosition.destroy ? data.aPosition : regl.buffer(data.aPosition)
            }
        };

        if (data.aNormal) {
            buffers.aNormal = data.aNormal.destroy ? data.aNormal : {
                buffer : regl.buffer(data.aNormal)
            };
        }

        if (data.aBarycentric) {
            buffers.aBarycentric = data.aBarycentric.destroy ? data.aBarycentric : {
                buffer : regl.buffer(data.aBarycentric)
            };
        }

        if (data.aTangent) {
            buffers.aTangent = data.aTangent.destroy ? data.aTangent : {
                buffer : regl.buffer(data.aTangent)
            };
        }

        if (data.aTexCoord) {
            buffers.aTexCoord = data.aTexCoord.destroy ? data.aTexCoord : {
                buffer : regl.buffer(data.aTexCoord)
            };
        }

        if (data.aColor) {
            buffers.aColor = data.aColor.destroy ? data.aColor : {
                buffer : regl.buffer(data.aColor)
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
        const posArr = this.data.aPosition;
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
