import { extend, isNil, isNumber, isFunction, isSupportVAO, hasOwn } from './common/Util.js';
import { mat4, vec3 } from 'gl-matrix';
import BoundingBox from './BoundingBox.js';
import Geometry from './Geometry';
import Material from './Material';
import { ActiveAttributes, MatrixFunction, MeshOptions, ShaderDefines, ShaderUniformValue, ShaderUniforms } from './types/typings';
import { Regl } from '@maptalks/regl';

const tempMat4: mat4 = new Array(16) as mat4;

let uuid = 0;


/**
 * Config:
 *  transparent, castShadow
 */
class Mesh {
    //@internal
    _version: number
    //@internal
    _geometry: Geometry
    //@internal
    _material: Material
    //@internal
    _localTransform: mat4 | MatrixFunction
    //@internal
    _positionMatrix: mat4 | MatrixFunction
    //@internal
    _currentTransform?: mat4
    //@internal
    _prevTMat?: mat4
    //@internal
    _prevPMat?: mat4
    //@internal
    _dirtyUniforms: boolean
    //@internal
    _dirtyGeometry: boolean
    //@internal
    _options?: MeshOptions
    //@internal
    _materialVer?: number
    //@internal
    _materialPropVer?: number
    //@internal
    _dirtyProps?: string[]
    //@internal
    _defines?: ShaderDefines
    //@internal
    _bakDefines?: ShaderDefines
    //@internal
    _commandKey?: string
    //@internal
    _materialKeys?: string
    //@internal
    _realUniforms?: ShaderUniforms
    //@internal
    _bbox?: BoundingBox
    //@internal
    _geoBox?: BoundingBox
    //@internal
    _bboxArr?: [vec3, vec3]
    //@internal
    _uniformDescriptors?: Set<string>

    transparent: boolean
    bloom: boolean
    ssr: boolean
    //@internal
    _castShadow: boolean
    needUpdateShadow: boolean
    picking: boolean
    disableVAO: boolean
    properties: any
    uniforms: ShaderUniforms
    dirtyDefines?: boolean
    parent?: Mesh

    constructor(geometry: Geometry, material?: Material, config: MeshOptions = {}) {
        this._version = 0;
        this._geometry = geometry;
        this._material = material;
        // this.config = config;
        this.transparent = !!config.transparent;
        this.bloom = !!config.bloom;
        this.ssr = !!config.ssr;
        this._castShadow = isNil(config.castShadow) || config.castShadow;
        this.needUpdateShadow = false;
        this.picking = !!config.picking;
        this.disableVAO = !!config.disableVAO;
        this.uniforms = {};
        this._localTransform = mat4.identity(new Array(16) as mat4);
        this._positionMatrix = mat4.identity(new Array(16) as mat4);
        this.properties = {};
        this._dirtyUniforms = true;
        this._dirtyGeometry = true;
        Object.defineProperty(this, 'uuid', {
            value: uuid++
        });
        if (uuid > Number.MAX_VALUE - 10) {
            uuid = 0;
        }
    }

    set material(v: Material) {
        if (this._material !== v) {
            this.setMaterial(v);
        }
    }

    get material() {
        return this._material;
    }

    set version(v: number) {
        throw new Error('Mesh.version is read only.');
    }

    get version() {
        return this._version;
    }

    get geometry() {
        return this._geometry;
    }

    set geometry(geo: Geometry) {
        if (this._geometry !== geo) {
            this._incrVersion();
            this._dirtyGeometry = true;
        }
        this._geometry = geo;
    }

    set localTransform(m) {
        if (!this._prevTMat) {
            this._prevTMat = new Array(16) as mat4;
        }
        if (Array.isArray(m) && !mat4.exactEquals(this._prevTMat, m)) {
            this._incrVersion();
            this._prevTMat = mat4.copy(this._prevTMat, m);
        }
        this._localTransform = m;
    }

    get localTransform() {
        return isFunction(this._localTransform) ? (this._localTransform as MatrixFunction)() : this._localTransform as mat4;
    }

    set positionMatrix(m) {
        if (!this._prevPMat) {
            this._prevPMat = new Array(16) as mat4;
        }
        if (Array.isArray(m) && !mat4.exactEquals(this._prevPMat, m)) {
            this._incrVersion();
            this._prevPMat = mat4.copy(this._prevPMat, m);
        }
        this._positionMatrix = m;
    }

    get positionMatrix() {
        return isFunction(this._positionMatrix) ? (this._positionMatrix as MatrixFunction)() : this._positionMatrix as mat4;
    }

    get config() {
        if (!this._options) {
            this._options = {};
        }
        this._options['transparent'] = this.transparent;
        this._options['castShadow'] = this.castShadow;
        this._options['bloom'] = this.bloom;
        this._options['ssr'] = this.ssr;
        this._options['picking'] = this.picking;
        return this._options;
    }

    get defines(): ShaderDefines {
        return this._getDefines();
    }

    set defines(v: ShaderDefines) {
        this.setDefines(v);
    }

    get castShadow(): boolean {
      return this._castShadow && (!this.material || !this.material.unlit);
    }

    set castShadow(v: boolean) {
      this._castShadow = v;
    }

    setMaterial(material: Material) {
        this._material = material;
        this._dirtyUniforms = true;
        delete this._materialVer;
        this.dirtyDefines = true;
        return this;
    }

    setParent(parent: Mesh) {
        this.parent = parent;
        return this;
    }

    setLocalTransform(transform: mat4) {
        this.localTransform = transform;
        return this;
    }

    setPositionMatrix(matrix: mat4) {
        this.positionMatrix = matrix;
    }

    setUniform(k: string, v: ShaderUniformValue) {
        this._updateUniformState(k);
        this.uniforms[k] = v;
        return this;
    }

    setFunctionUniform(k: string, fn: () => ShaderUniformValue): this {
      this._updateUniformState(k);
      Object.defineProperty(this.uniforms, k, {
        enumerable: true,
        get: fn
      });
      return this;
    }

    hasFunctionUniform(k: string): boolean {
      if (!this.uniforms) {
        return false;
      }
      return Object.prototype.hasOwnProperty.call(this.uniforms, k);
    }

    //@internal
    _updateUniformState(k: string) {
      if (this.uniforms[k] === undefined) {
        this._dirtyUniforms = true;
      } else {
        this._dirtyProps = this._dirtyProps || [];
        this._dirtyProps.push(k);
      }
    }

    getUniform(k: string): ShaderUniformValue {
        return this.uniforms[k];
    }

    getDefines(): ShaderDefines {
        const defines = {};
        extend(defines, this._getDefines());
        if (this._material && this._geometry) {
            this._material.appendDefines(defines, this._geometry);
        }
        return defines;
    }

    //@internal
    _getDefines(): ShaderDefines {
        if (!this._defines) {
            this._defines = {};
        }
        const geometry = this._geometry;
        const position = geometry.data[geometry.desc.positionAttribute],
            texcoord = geometry.data[geometry.desc.uv0Attribute],
            normal = geometry.data[geometry.desc.normalAttribute];
        if (position && position.quantization) {
            this._defines['HAS_DRACO_POSITION'] = 1;
        }
        if (texcoord && texcoord.quantization) {
            this._defines['HAS_DRACO_TEXCOORD'] = 1;
        }
        if (normal && normal.quantization) {
            this._defines['HAS_DRACO_NORMAL'] = 1;
        }
        return this._defines;
    }

    setDefines(defines: ShaderDefines) {
        const bak = this._bakDefines;
        this._defines = defines;
        this.dirtyDefines = this.dirtyDefines || !!bak !== !!defines || !equalDefine(bak, defines);
        if (this.dirtyDefines) {
            this._bakDefines = extend({}, defines);
        }
        return this;
    }

    hasSkinAnimation(): boolean {
        return this._material && this._material.hasSkinAnimation();
    }

    //@internal
    _getDefinesKey(): string {
        this.dirtyDefines = false;
        return this._createDefinesKey(this.getDefines());
    }

    //eslint-disable-next-line
    getCommandKey(regl: Regl): string {
        if (!this._commandKey || this.dirtyDefines || (this._material && this._materialKeys !== this._material.getUniformKeys())) {
            //TODO geometry的data变动也可能会改变commandKey，但鉴于geometry一般不会发生变化，暂时不管
            let dKey = this._getDefinesKey();
            const elementType = isNumber(this.getElements()) ? 'count' : 'elements';
            dKey += '_' + elementType;
            dKey += '_' + +(!!this.disableVAO);
            if (this._material) {
                dKey += '_' + +(!!this._material.doubleSided);
            }
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

    getUniforms(regl: Regl): ShaderUniforms {
        if (this._dirtyUniforms || this._dirtyGeometry || this._material && this._materialVer !== this._material.version) {
            this._uniformDescriptors = new Set<string>();
            this._realUniforms = {
            };
            this._prepareUniformsForDraco();
            const uniforms = this.uniforms;
            for (const p in this.uniforms) {
                if (hasOwn(this.uniforms, p)) {
                    const descriptor = Object.getOwnPropertyDescriptor(uniforms, p);
                    if (descriptor.get) {
                        this._uniformDescriptors.add(p);
                        Object.defineProperty(this._realUniforms, p, {
                            enumerable: true,
                            configurable: true,
                            get: function () {
                                return uniforms[p];
                            }
                        });
                    } else {
                        this._realUniforms[p] = uniforms[p];
                    }
                }
            }
            if (this._material) {
                const materialUniforms = this._material.getUniforms(regl);
                for (const p in materialUniforms) {
                    if (hasOwn(materialUniforms, p) && !hasOwn(this._realUniforms, p)) {
                        const descriptor = Object.getOwnPropertyDescriptor(materialUniforms, p);
                        if (descriptor.get) {
                            this._uniformDescriptors.add(p);
                            Object.defineProperty(this._realUniforms, p, {
                                enumerable: true,
                                configurable: true,
                                get: function () {
                                    return materialUniforms[p];
                                }
                            });
                        } else if (this._realUniforms[p] === undefined) {
                            this._realUniforms[p] = materialUniforms[p];
                        }
                    }
                }
            }

            this._dirtyUniforms = false;
            this._dirtyGeometry = false;
            this._materialVer = this._material && this._material.version;
            this._materialPropVer = this._material && this._material.propVersion;
            this._dirtyProps = null;
        } else if (this._dirtyProps || this._material && this._material.propVersion !== this._materialPropVer) {
            if (this._dirtyProps) {
                for (const p of this._dirtyProps) {
                    this._realUniforms[p] = this.uniforms[p];
                }
            }
            if (this._material && this._material.propVersion !== this._materialPropVer) {
              const materialUniforms = this._material.getUniforms(regl);
              for (const p in materialUniforms) {
                  if (hasOwn(materialUniforms, p) && !this._uniformDescriptors.has(p)) {
                      const descriptor = Object.getOwnPropertyDescriptor(materialUniforms, p);
                      if (!descriptor.get && this._realUniforms[p] !== materialUniforms[p]) {
                        this._realUniforms[p] = materialUniforms[p];
                      }
                  }
              }

              this._materialPropVer = this._material.propVersion;
            }
            this._dirtyProps = null;
        }
        this._realUniforms['modelMatrix'] = this.localTransform;
        this._realUniforms['positionMatrix'] = this.positionMatrix;
        return this._realUniforms;
    }

    //@internal
    _prepareUniformsForDraco() {
        const geometry = this._geometry;
        const position = geometry.data[geometry.desc.positionAttribute],
            texcoord = geometry.data[geometry.desc.uv0Attribute],
            normal = geometry.data[geometry.desc.normalAttribute];
        if (position && position.quantization) {
            const quantization = position.quantization;
            const gltf_u_dec_position_normConstant = quantization.range / (1 << quantization.quantizationBits)
            this._realUniforms['minValues_pos'] = quantization.minValues;
            this._realUniforms['gltf_u_dec_position_normConstant'] = gltf_u_dec_position_normConstant;
        }
        if (texcoord && texcoord.quantization) {
            const quantization = texcoord.quantization;
            this._realUniforms['minValues_tex'] = quantization.minValues;
            const gltf_u_dec_texcoord_0_normConstant = quantization.range / (1 << quantization.quantizationBits)
            this._realUniforms['gltf_u_dec_texcoord_0_normConstant'] = gltf_u_dec_texcoord_0_normConstant;
        }
        if (normal && normal.quantization) {
            const quantization = normal.quantization;
            const gltf_u_dec_normal_rangeConstant = (1 << quantization.quantizationBits) - 1.0;
            this._realUniforms['gltf_u_dec_normal_rangeConstant'] = gltf_u_dec_normal_rangeConstant;
        }
    }

    getMaterial() {
        return this._material;
    }

    getElements() {
        return this._geometry.getElements();
    }

    //@internal
    _getREGLAttrData(regl, activeAttributes) {
        return this._geometry.getREGLData(regl, activeAttributes, this.disableVAO);
    }

    getREGLProps(regl: Regl, activeAttributes: ActiveAttributes) {
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
        this.uniforms = null;
        return this;
    }

    isValid() {
        return this._geometry && !this._geometry.isDisposed() && (!this._material || !this._material.isDisposed());
    }

    getBoundingBox() {
        if (!this._geometry) {
            return null;
        }
        if (!this._bbox) {
            this.updateBoundingBox();
        }
        mat4.multiply(tempMat4, this.localTransform, this.positionMatrix);
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
            this._bboxArr = [[0, 0, 0], [0, 0, 0]];
        }
        if (!this._geoBox) {
            this._geoBox = new BoundingBox();
        }
        BoundingBox.copy(this._bbox, box);
        this._bbox.updateVertex();
        if (this.constructor.name === 'InstancedMesh') {
            this._bbox.transform(this.localTransform, this.positionMatrix);
            this._currentTransform = mat4.multiply(this._currentTransform || new Array(16) as mat4, this.positionMatrix, this.localTransform);
        } else {
            this._bbox.transform(this.positionMatrix, this.localTransform);
            this._currentTransform = mat4.multiply(this._currentTransform || new Array(16) as mat4, this.localTransform, this.positionMatrix);
        }
        BoundingBox.copy(this._geoBox, box);
        vec3.copy(this._bboxArr[0], this._bbox.min);
        vec3.copy(this._bboxArr[1], this._bbox.max);

    }

    //@internal
    _createDefinesKey(defines) {
        const v = [];
        for (const p in defines) {
            v.push(p, defines[p]);
        }
        return v.join(',');
    }

    //@internal
    _incrVersion() {
        this._version++;
    }

    getMemorySize() {
        return (this.geometry && this.geometry.getMemorySize() || 0) + (this.material && this.material.getMemorySize() || 0);
    }

    getWorldTransform() {
        const parent = this.parent;
        if (parent) {
            return mat4.multiply(new Array(16) as mat4, parent.getWorldTransform(), this.localTransform);
        }
        return this.localTransform;
    }
}

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
