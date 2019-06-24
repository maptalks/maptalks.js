import { extend, isNil } from './common/Util.js';
import { mat4 } from 'gl-matrix';

/**
 * Config:
 *  transparent, castShadow
 */
class Mesh {
    constructor(geometry, material, config = {}) {
        this.geometry = geometry;
        this.material = material;
        this.config = config;
        this.transparent = !!config.transparent;
        this.castShadow = isNil(config.castShadow) || config.castShadow;
        this.picking = !!config.picking;
        this.uniforms = {};
        this.localTransform = mat4.identity(new Array(16));
        this.properties = {};
        this._dirtyUniforms = true;
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
        if (this.uniforms[k] === undefined) {
            this._dirtyUniforms = true;
        }
        this.uniforms[k] = v;
        return this;
    }

    getUniform(k) {
        return this.uniforms[k];
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
        if (this._definesKey !== undefined && !this.dirtyDefines && (!this.material || !this.material.dirtyDefines)) {
            return this._definesKey;
        }
        //refresh defines
        this._definesKey = this._createDefinesKey(this.getDefines());
        this.dirtyDefines = false;
        return this._definesKey;
    }

    // getUniforms(regl) {
    //     const uniforms = {
    //         'modelMatrix': this.localTransform
    //     };
    //     if (this.material) {
    //         const materialUniforms = this.material.getUniforms(regl);
    //         extend(uniforms, materialUniforms);
    //     }
    //     extend(uniforms, this.uniforms);
    //     return uniforms;
    // }

    getUniforms(regl) {
        if (this._dirtyUniforms || this.material && this.material.isDirty()) {
            this._realUniforms = {
            };
            const uniforms = this.uniforms;
            for (const p in this.uniforms) {
                if (this.uniforms.hasOwnProperty(p)) {
                    Object.defineProperty(this._realUniforms, p, {
                        enumerable: true,
                        configurable: true,
                        get: function () {
                            return uniforms && uniforms[p];
                        }
                    });
                }
            }
            if (this.material) {
                const materialUniforms = this.material.getUniforms(regl);
                for (const p in materialUniforms) {
                    if (materialUniforms.hasOwnProperty(p)) {
                        Object.defineProperty(this._realUniforms, p, {
                            enumerable: true,
                            configurable: true,
                            get: function () {
                                return materialUniforms && materialUniforms[p];
                            }
                        });
                    }
                }
            }
            this._dirtyUniforms = false;
        }
        this._realUniforms['modelMatrix'] = this.localTransform;
        return this._realUniforms;
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

    getREGLProps(regl) {
        const props = this.getUniforms(regl);
        extend(props, this.geometry.data);
        props.elements = this.geometry.getElements();
        props.count = this.geometry.getDrawCount();
        props.offset = this.geometry.getDrawOffset();
        // command primitive : triangle, triangle strip, etc
        props.primitive = this.geometry.getPrimitive();
        return props;
    }

    dispose() {
        delete this.geometry;
        delete this.material;
        this.uniforms = {};
        return this;
    }

    isValid() {
        return this.geometry && !this.geometry.isDisposed() && (!this.material || !this.material.isDisposed());
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
