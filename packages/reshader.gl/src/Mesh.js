import { extend } from './common/Util.js';
import { mat4 } from '@mapbox/gl-matrix';

const IDENTITY = mat4.identity(new Array(16));

/**
 * Config:
 *  transparent
 */
class Mesh {
    constructor(geometry, material, config = {}) {
        this.geometry = geometry;
        this.material = material;
        this.config = config;
        this.transparent = config.transparent;
        this.uniforms = {};
        this.localTransform = IDENTITY;
    }

    setParent() {
        this.parent = parent;
        return this;
    }

    setLocalTransform(transform) {
        this.localTransform = transform;
        return this;
    }

    setUniform(k, v) {
        this.uniforms[k] = v;
        return this;
    }

    getUniforms(regl) {
        const uniforms = {
            'model' : this.localTransform
        };
        for (const p in this.uniforms) {
            uniforms[p] = this.uniforms[p];
        }
        if (this.material) {
            const materialUniforms = this.material.getUniforms(regl);
            if (materialUniforms) {
                for (const p in materialUniforms) {
                    if (materialUniforms.hasOwnProperty(p)) {
                        uniforms[p] = materialUniforms[p];
                    }
                }
            }
        }
        return uniforms;
    }

    getMaterial() {
        return this.material;
    }

    getAttributes() {
        return this.geometry.getAttributes();
    }

    getElements() {
        return this.geometry.getElements();
    }

    getREGLProps() {
        const props = extend({}, this.geometry.data);
        props.elements = this.geometry.getElements();
        // command primitive : triangle, triangle strip, etc
        props.primitive = this.geometry.getPrimitive();
        const uniforms = this.getUniforms();
        for (const p in uniforms) {
            if (uniforms.hasOwnProperty(p)) {
                props[p] = uniforms[p];
            }
        }
        return props;
    }

    dispose() {
        delete this.geometry;
        delete this.material;
        delete this.uniforms;
        delete this.localTransform;
        return this;
    }
}

Mesh.prototype.getWorldTransform = function () {
    const worldTransform = [];
    return function () {
        if (parent) {
            return mat4.multiply(worldTransform, parent.getWorldTransform(), this.localTransform);
        }
        return this.localTransform;
    };
}();

export default Mesh;
