const REF_COUNT = '____pbr_ref_count';

export default class Geometry {
    constructor(data, indices) {
        // this.position = data.vertices;
        // this.normal = data.normals;
        // this.uv = data.uvs;
        // this.color = data.colors;
        // this.indices = data.indices;
        // this.tangent = data.tangents;

        this.data = data;
        this.indices = indices;
        this.refCount = 0;
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
