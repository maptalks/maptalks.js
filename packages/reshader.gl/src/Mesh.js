import { extend, isNil, isNumber, isFunction, isSupportVAO, hasOwn } from './common/Util.js';
import { mat4, vec3 } from 'gl-matrix';
import BoundingBox from './BoundingBox.js';

const tempMat4 = [];

let uuid = 0;
/**
 * Config:
 *  transparent, castShadow
 */
class Mesh {
    constructor(geometry, material, config = {}) {
        this._version = 0;
        this._geometry = geometry;
        this._material = material;
        // this.config = config;
        this.transparent = !!config.transparent;
        this.bloom = !!config.bloom;
        this.ssr = !!config.ssr;
        this.castShadow = isNil(config.castShadow) || config.castShadow;
        this.picking = !!config.picking;
        this.disableVAO = !!config.disableVAO;
        this.uniforms = {};
        this._localTransform = mat4.identity(new Array(16));
        this._positionMatrix = mat4.identity(new Array(16));
        this.properties = {};
        this._dirtyUniforms = true;
        Object.defineProperty(this, 'uuid', {
            value: uuid++
        });
        if (uuid > Number.MAX_VALUE - 10) {
            uuid = 0;
        }
    }

    set material(v) {
        if (this._material !== v) {
            this.setMaterial(v);
        }
    }

    get material() {
        return this._material;
    }

    set version(v) {
        throw new Error('Mesh.version is read only.');
    }

    get version() {
        return this._version;
    }

    get geometry() {
        return this._geometry;
    }

    set geometry(geo) {
        if (this._geometry !== geo) {
            this._incrVersion();
        }
        this._geometry = geo;
    }

    set localTransform(m) {
        if (!this._prevTMat) {
            this._prevTMat = [];
        }
        if (Array.isArray(m) && !mat4.exactEquals(this._prevTMat, m)) {
            this._incrVersion();
            this._prevTMat = mat4.copy(this._prevTMat, m);
        }
        this._localTransform = m;
    }

    get localTransform() {
        return this._localTransform;
    }

    set positionMatrix(m) {
        if (!this._prevPMat) {
            this._prevPMat = [];
        }
        if (Array.isArray(m) && !mat4.exactEquals(this._prevPMat, m)) {
            this._incrVersion();
            this._prevPMat = mat4.copy(this._prevPMat, m);
        }
        this._positionMatrix = m;
    }

    get positionMatrix() {
        return this._positionMatrix;
    }

    get config() {
        if (!this._cfg) {
            this._cfg = {};
        }
        this._cfg['transparent'] = this.transparent;
        this._cfg['castShadow'] = this.castShadow;
        this._cfg['bloom'] = this.bloom;
        this._cfg['ssr'] = this.ssr;
        this._cfg['picking'] = this.picking;
        return this._cfg;
    }

    get defines() {
        return this._defines;
    }

    set defines(v) {
        this.setDefines(v);
    }

    setMaterial(material) {
        this._material = material;
        this._dirtyUniforms = true;
        delete this._materialVer;
        this.dirtyDefines = true;
        return this;
    }

    setParent(parent) {
        this.parent = parent;
        return this;
    }

    setLocalTransform(transform) {
        this.localTransform = transform;
        return this;
    }

    setPositionMatrix(matrix) {
        this.positionMatrix = matrix;
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
        if (this._defines) {
            extend(defines, this._defines);
        }
        if (this._material && this._geometry) {
            this._material.appendDefines(defines, this._geometry);
        }
        return defines;
    }

    setDefines(defines) {
        const bak = this._bakDefines;
        this._defines = defines;
        this.dirtyDefines = !!bak !== !!defines || !equalDefine(bak, defines);
        if (this.dirtyDefines) {
            this._bakDefines = extend({}, defines);
        }
        return this;
    }

    hasSkinAnimation() {
        return this._material && this._material.hasSkinAnimation();
    }

    _getDefinesKey() {
        this.dirtyDefines = false;
        return this._createDefinesKey(this.getDefines());
    }

    getCommandKey() {
        if (!this._commandKey || this.dirtyDefines || (this._material && this._materialKeys !== this._material.getUniformKeys())) {
            //TODO geometry的data变动也可能会改变commandKey，但鉴于geometry一般不会发生变化，暂时不管
            let dKey = this._getDefinesKey();
            const elementType = isNumber(this.getElements()) ? 'count' : 'elements';
            dKey += '_' + elementType;
            dKey += '_' + +(!!this.disableVAO);
            this._commandKey = dKey;
            if (this._material) {
                this._materialKeys = this._material.getUniformKeys();
            }
        }

        return this._commandKey;
    }

    // getUniforms(regl) {
    //     const uniforms = {
    //         'modelMatrix': this._localTransform
    //     };
    //     if (this._material) {
    //         const materialUniforms = this._material.getUniforms(regl);
    //         extend(uniforms, materialUniforms);
    //     }
    //     extend(uniforms, this.uniforms);
    //     return uniforms;
    // }

    getUniforms(regl) {
        if (this._dirtyUniforms || this._material && this._materialVer !== this._material.version) {
            this._realUniforms = {
            };
            if (this._material) {
                const materialUniforms = this._material.getUniforms(regl);
                for (const p in materialUniforms) {
                    if (hasOwn(materialUniforms, p)) {
                        Object.defineProperty(this._realUniforms, p, {
                            enumerable: true,
                            configurable: true,
                            get: function () {
                                return materialUniforms[p];
                            }
                        });
                    }
                }
            }
            const uniforms = this.uniforms;
            for (const p in this.uniforms) {
                if (hasOwn(this.uniforms, p)) {
                    Object.defineProperty(this._realUniforms, p, {
                        enumerable: true,
                        configurable: true,
                        get: function () {
                            return uniforms[p];
                        }
                    });
                }
            }
            this._dirtyUniforms = false;
            this._materialVer = this._material && this._material.version;
        }
        this._realUniforms['modelMatrix'] = isFunction(this._localTransform) ? this._localTransform() : this._localTransform;
        this._realUniforms['positionMatrix'] = isFunction(this._positionMatrix) ? this._positionMatrix() : this._positionMatrix;
        return this._realUniforms;
    }


    getMaterial() {
        return this._material;
    }

    getElements() {
        return this._geometry.getElements();
    }

    _getREGLAttrData(regl, activeAttributes) {
        return this._geometry.getREGLData(regl, activeAttributes, this.disableVAO);
    }

    getREGLProps(regl, activeAttributes) {
        const props = this.getUniforms(regl);
        extend(props, this._getREGLAttrData(regl, activeAttributes));
        if (!isSupportVAO(regl) || this.disableVAO) {
            props.elements = this._geometry.getElements();
        }
        props.meshProperties = this.properties;
        props.meshConfig = this.config;
        props.count = this._geometry.getDrawCount();
        props.offset = this._geometry.getDrawOffset();
        // command primitive : triangle, triangle strip, etc
        props.primitive = this._geometry.getPrimitive();
        return props;
    }

    dispose() {
        delete this._geometry;
        delete this._material;
        this.uniforms = {};
        return this;
    }

    isValid() {
        return this._geometry && !this._geometry.isDisposed() && (!this._material || !this._material.isDisposed());
    }

    getBoundingBox() {
        if (!this._bbox) {
            this.updateBoundingBox();
        }
        mat4.multiply(tempMat4, this._localTransform, this._positionMatrix);
        //如果Mesh的localTransform * positionMatrix发生了变化，或者geometry的boundingBox发生变化，则需要更新bbox
        if (!mat4.exactEquals(tempMat4, this._currentTransform) || !this._geometry.boundingBox.equals(this._geoBox)) {
            this.updateBoundingBox();
        }
        return this._bboxArr;
    }

    updateBoundingBox() {
        const box = this._geometry.boundingBox;
        if (!this._bbox) {
            this._bbox = new BoundingBox();
        }
        if (!this._bboxArr) {
            this._bboxArr = [[], []];
        }
        if (!this._geoBox) {
            this._geoBox = new BoundingBox();
        }
        BoundingBox.copy(this._bbox, box);
        this._bbox.updateVertex();
        this._bbox.transform(this._positionMatrix, this._localTransform);
        this._currentTransform = mat4.multiply(this._currentTransform || [], this._localTransform, this._positionMatrix);
        BoundingBox.copy(this._geoBox, box);
        vec3.copy(this._bboxArr[0], this._bbox.min);
        vec3.copy(this._bboxArr[1], this._bbox.max);

    }

    _createDefinesKey(defines) {
        const v = [];
        for (const p in defines) {
            v.push(p, defines[p]);
        }
        return v.join(',');
    }

    _incrVersion() {
        this._version++;
    }

    getMemorySize() {
        return (this.geometry && this.geometry.getMemorySize() || 0) + (this.material && this.material.getMemorySize() || 0);
    }
}

Mesh.prototype.getWorldTransform = function () {
    const worldTransform = [];
    return function () {
        const parent = this.parent;
        if (parent) {
            return mat4.multiply(worldTransform, parent.getWorldTransform(), this._localTransform);
        }
        return this._localTransform;
    };
}();

export default Mesh;

function equalDefine(obj0, obj1) {
    if (!obj0 && !obj1) {
        return true;
    }
    const props0 = Object.getOwnPropertyNames(obj0);
    const props1 = Object.getOwnPropertyNames(obj1);
    if (props0.length !== props1.length) {
        return false;
    }
    for (let i = 0; i < props0.length; i++) {
        if (obj0[props0[i]] !== obj1[props0[i]]) {
            return false;
        }
    }
    return true;
}
