import { extend, isNil } from './common/Util.js';
import { mat4 } from '@mapbox/gl-matrix';

/**
 * Config:
 *  transparent, castShadow
 */
class Mesh {
    constructor(geometry, material, config = {}) {
        this.geometry = geometry;
        this.material = material;
        this.config = config;
        this.transparent = config.transparent;
        this.castShadow = isNil(config.castShadow) || config.castShadow;
        this.uniforms = {};
        this.localTransform = mat4.identity(new Array(16));
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

    getDefines() {
        const defines = {};
        if (this.defines) {
            extend(defines, this.defines);
        }
        if (this.material) {
            const mDefines = this.material.getDefines();
            if (mDefines) {
                extend(defines, mDefines);
            }
        }
        return defines;
    }

    setDefines(defines) {
        this.defines = defines;
        this.dirtyDefines = true;
        return this;
    }

    getDefinesKey() {
        if (this._definesKey && !this.dirtyDefines && (!this.material || !this.material.dirtyDefines)) {
            return this._definesKey;
        }
        //refresh defines
        this._definesKey = this._createDefinesKey(this.getDefines());
        this.dirtyDefines = false;
        return this._definesKey;
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

    _createDefinesKey(defines) {
        const v = [];
        for (const p in defines) {
            v.push(p, defines[p]);
        }
        return v.join(',');
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
