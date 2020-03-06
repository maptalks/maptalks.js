import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend, isNumber } from '../../Util';
import Painter from '../Painter';
import { setUniformFromSymbol } from '../../Util';
import { piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';

const SCALE = [1, 1, 1];

class StandardPainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);
        // this.colorSymbol = 'polygonFill';
        if (isFunctionDefinition(this.symbolDef['polygonFill'])) {
            const map = layer.getMap();
            const fn = piecewiseConstant(this.symbolDef['polygonFill']);
            this.colorSymbol = properties => fn(map.getZoom(), properties);
        } else {
            this.colorSymbol = this.getSymbol()['polygonFill'];
        }
        this._loader = new reshader.ResourceLoader();
    }

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        return geometry;
    }

    createMesh(geometry, transform) {
        if (!this.material) {
            //还没有初始化
            this.setToRedraw();
            return null;
        }
        const mesh = new reshader.Mesh(geometry, this.material);
        if (this.material['uNormalTexture']) {
            geometry.createTangent();
        }
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        const defines = this.shader.getGeometryDefines(geometry);
        if (geometry.data.aExtrude) {
            defines['IS_LINE_EXTRUSION'] = 1;
            const symbol = this.getSymbol();
            const { tileResolution, tileRatio } = geometry.properties;
            const map = this.getMap();
            Object.defineProperty(mesh.uniforms, 'linePixelScale', {
                enumerable: true,
                get: function () {
                    return tileRatio * map.getResolution() / tileResolution;
                }
            });
            setUniformFromSymbol(mesh.uniforms, 'lineWidth', symbol, 'lineWidth');
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        geometry.generateBuffers(this.regl);
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        if (this.getSymbol().ssr) {
            mesh.setUniform('ssr', 1);
        }
        return mesh;
    }

    addMesh(mesh, progress) {
        if (progress !== null) {
            const mat = mesh.localTransform;
            if (progress === 0) {
                progress = 0.01;
            }
            SCALE[2] = progress;
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, mesh.properties.tileTransform, mat);
            mesh.setLocalTransform(mat);
        } else {
            mesh.setLocalTransform(mesh.properties.tileTransform);
        }
        if (mesh.material !== this.material) {
            mesh.setMaterial(this.material);
        }
        super.addMesh(mesh, progress);
    }

    paint(context) {
        const hasShadow = !!context.shadow;
        if (this._hasShadow === undefined) {
            this._hasShadow = hasShadow;
        }
        if (this._hasShadow !== hasShadow) {
            this.shader.dispose();
            this._createShader(context);
        }
        this._hasShadow = hasShadow;
        const isSsr = !!context.ssr;
        this.shader = this.hasIBL() ? this._iblShader : this._noIblShader;
        const shader = this.shader;
        const fbo = this.getRenderFBO(context);
        if (isSsr) {
            this._renderSsrDepth(context);
            context.renderTarget.fbo = context.ssr.fbo;
            this.shader = this.hasIBL() ? this._ssrShader : this._noIblSsrShader;
        }
        super.paint(context);
        if (isSsr) {
            context.renderTarget.fbo = fbo;
            this.shader = shader;
        }
        if (this._shadowCount !== undefined && hasShadow) {
            const count = this.scene.getMeshes().length;
            if (this._shadowCount !== count) {
                this.setToRedraw();
            }
        }
        delete this._shadowCount;
    }

    hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager.getAmbientResource();
        return !!resource;
    }

    _renderSsrDepth(context) {
        this._depthShader.filter = context.sceneFilter;
        this.renderer.render(this._depthShader, this.getUniformValues(this.layer.getMap(), context), this.scene, this.getRenderFBO(context));
    }

    getShadowMeshes() {
        this._shadowCount = this.scene.getMeshes().length;
        return this.scene.getMeshes();
    }

    updateSceneConfig(config) {
        extend(this.sceneConfig, config);
        this.setToRedraw();
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                if (!keepGeometry) {
                    meshes[i].geometry.dispose();
                }
                meshes[i].dispose();
            }
        } else {
            if (!keepGeometry) {
                meshes.geometry.dispose();
            }
            meshes.dispose();
        }
    }

    delete() {
        this.getMap().off('updatelights', this._updateLights, this);
        super.delete();
        if (this._dfgLUT) {
            this._dfgLUT.destroy();
            delete this._dfgLUT;
        }
        this._disposeIblTextures();
        this.material.dispose();
        if (this._depthShader) {
            this._depthShader.dispose();
            this._ssrShader.dispose();
            this._noIblSsrShader.dispose();
        }
        if (this._iblShader) {
            this._iblShader.dispose();
        }
        if (this._noIblShader) {
            this._noIblShader.dispose();
        }
    }

    updateSymbol() {
        super.updateSymbol();
        this._updateMaterial();
    }

    init(context) {
        this.getMap().on('updatelights', this._updateLights, this);
        //保存context，updateSceneConfig时读取
        this._context = this._context || context;
        this._dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this.regl);
        const regl = this.regl;
        this.renderer = new reshader.Renderer(regl);

        this._createShader(context);

        this._bindedOnTextureLoad = this._onTextureLoad.bind(this);
        this._bindDisposeCachedTexture = this.disposeCachedTexture.bind(this);

        this._updateMaterial();

        const pickingConfig = {
            vert: `
                attribute vec3 aPosition;
                uniform mat4 projViewModelMatrix;
                #include <fbo_picking_vert>
                void main() {
                    vec4 pos = vec4(aPosition, 1.0);
                    gl_Position = projViewModelMatrix * pos;
                    fbo_picking_setData(gl_Position.w, true);
                }
            `,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ]
        };
        this.picking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }

    _updateLights(param) {
        if (param.ambientUpdate) {
            this._createIBLTextures();
        }
        this.setToRedraw();
    }

    _createShader(context) {
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };
        const uniformDeclares = [];
        if (context.shadow && context.shadow.uniformDeclares) {
            uniformDeclares.push(...context.shadow.uniformDeclares);
        }
        if (context.ssr && context.ssr.uniformDeclares) {
            uniformDeclares.push(...context.ssr.uniformDeclares);
        }
        const defines = {};
        if (context.shadow && context.shadow.defines) {
            extend(defines, context.shadow.defines);
        }
        const extraCommandProps = {
            cull: {
                enable: () => {
                    return this.sceneConfig.cullFace === undefined || !!this.sceneConfig.cullFace;
                },
                face: 'back'
            },
            stencil: {
                enable: true,
                func: {
                    cmp: '<=',
                    ref: (context, props) => {
                        return props.level;
                    },
                    // mask: 0xff
                },
                opFront: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                },
                opBack: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            viewport,
            depth: {
                enable: true,
                range: this.sceneConfig.depthRange || [0, 1],
                func: this.sceneConfig.depthFunc || '<='
            }/*,
            polygonOffset: {
                enable: false,
                offset: {
                    factor: () => { return -(this.layer.getPolygonOffset() + this.pluginIndex + 1); },
                    units: () => { return -(this.layer.getPolygonOffset() + this.pluginIndex + 1); }
                }
            }*/
        };
        const config = {
            uniforms: uniformDeclares,
            defines: this._getDefines(defines),
            extraCommandProps
        };

        this._iblShader = new reshader.pbr.StandardShader(config);
        delete config.defines['HAS_IBL_LIGHTING'];
        this._noIblShader = new reshader.pbr.StandardShader(config);
        if (reshader.SsrPass && !this._ssrShader) {
            uniformDeclares.push(...reshader.SsrPass.getUniformDeclares());
            const defines = this._getDefines(reshader.SsrPass.getDefines());
            this._ssrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines,
                extraCommandProps
            });
            delete defines['HAS_IBL_LIGHTING'];
            this._noIblSsrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines,
                extraCommandProps
            });

            // extraCommandProps.depth = {
            //     enable: true,
            //     func: 'always',
            //     range: [0, 1]
            // };
            this._depthShader = new reshader.pbr.StandardDepthShader({
                extraCommandProps
            });
        }
    }

    _onTextureLoad({ resources }) {
        for (let i = 0; i < resources.length; i++) {
            this.addCachedTexture(resources[i].url, resources[i].data);
        }
        this.setToRedraw();
    }

    _createIBLTextures() {
        const resource = this.getMap().getLightManager().getAmbientResource();
        if (this._iblTexes) {
            this._disposeIblTextures();
        }
        const regl = this.regl;
        this._iblTexes = {
            'prefilterMap': regl.cube({
                width: resource.prefilterMap.width,
                height: resource.prefilterMap.height,
                faces: resource.prefilterMap.faces,
                min: 'linear',
                mag: 'linear',
                format: 'rgba',
            }),
            'sh': resource.sh
        };
    }

    _updateMaterial() {
        if (this.material) {
            this.material.dispose();
        }
        const materialConfig = this.getSymbol().material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Texture') > 0) {
                    //纹理图片
                    let texConf = materialConfig[p];
                    if (!texConf) {
                        continue;
                    }
                    const url = typeof texConf === 'string' ? texConf : texConf.url;
                    const cachedTex = this.getCachedTexture(url);

                    if (cachedTex) {
                        //已有缓存
                        if (cachedTex.then) {
                            //是一个promise
                            if (url === texConf) {
                                texConf = {
                                    promise: cachedTex,
                                    wrap: 'repeat'
                                };
                            } else {
                                texConf.promise = cachedTex;
                            }
                        } else if (url === texConf) {
                            //已有图片数据
                            texConf = {
                                data: cachedTex,
                                wrap: 'repeat'
                            };
                        } else {
                            //已有图片数据
                            texConf.data = cachedTex;
                        }
                    } else if (url === texConf) {
                        //无缓存
                        texConf = {
                            url,
                            wrap: 'repeat'
                        };
                    }
                    material[p] = new reshader.Texture2D(texConf, this._loader);
                    material[p].once('complete', this._bindedOnTextureLoad);
                    material[p].once('disposed', this._bindDisposeCachedTexture);
                    if (material[p].promise) {
                        //把promise加入缓存，方便图片被多个纹理对象同时引用时，避免重复请求
                        this.addCachedTexture(url, material[p].promise);
                    }
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        this.material = new reshader.pbr.StandardMaterial(material);
    }

    getUniformValues(map, context) {
        const viewMatrix = map.viewMatrix;
        const projMatrix = map.projMatrix;
        const cameraPosition = map.cameraPosition;
        const canvas = this.layer.getRenderer().canvas;
        const lightUniforms = this._getLightUniforms();
        const uniforms = extend({
            viewMatrix,
            projMatrix,
            projectionMatrix: projMatrix,
            projViewMatrix: map.projViewMatrix,
            uCameraPosition: cameraPosition,
            uGlobalTexSize: [canvas.width, canvas.height],
            uNearFar: [map.cameraNear, map.cameraFar]
        }, lightUniforms);
        if (context && context.shadow && context.shadow.renderUniforms) {
            extend(uniforms, context.shadow.renderUniforms);
        }
        if (context && context.ssr && context.ssr.renderUniforms) {
            extend(uniforms, context.ssr.renderUniforms);
        }
        if (context && context.jitter) {
            uniforms['uHalton'] = context.jitter;
        } else {
            uniforms['uHalton'] = [0, 0];
        }
        return uniforms;
    }

    _getLightUniforms() {
        const lightManager = this.getMap().getLightManager();
        const iblMaps = lightManager.getAmbientResource();
        const ambientLight = lightManager.getAmbientLight();
        const directionalLight = lightManager.getDirectionalLight();
        let uniforms;
        if (iblMaps) {
            if (!this._iblTexes) {
                this._createIBLTextures();
            }
            const iblTexes = this._iblTexes;
            const cubeSize = iblTexes.prefilterMap.width;
            const mipLevel = Math.log(cubeSize) / Math.log(2);
            uniforms = {
                'sSpecularPBR': iblTexes.prefilterMap,
                'uDiffuseSPH': iblTexes.sh,
                'uTextureEnvironmentSpecularPBRLodRange': [mipLevel, mipLevel],
                'uTextureEnvironmentSpecularPBRTextureSize': [cubeSize, cubeSize],
            };
        } else {
            uniforms = {
                'uAmbientColor': ambientLight.color || [0.2, 0.2, 0.2]
            };
        }
        uniforms['uEnvironmentExposure'] = isNumber(ambientLight.exposure) ? ambientLight.exposure : 1; //2]
        uniforms['sIntegrateBRDF'] = this._dfgLUT;

        if (directionalLight) {
            uniforms['uSketchfabLight0_diffuse'] = [...(directionalLight.color || [1, 1, 1]), 1];
            uniforms['uSketchfabLight0_viewDirection'] = directionalLight.direction || [1, 1, -1];
        }
        return uniforms;
    }

    _getDefines(shadowDefines) {
        const defines = {};
        defines['HAS_IBL_LIGHTING'] = 1;

        if (shadowDefines) {
            extend(defines, shadowDefines);
        }
        return defines;
    }

    _disposeIblTextures() {
        if (!this._iblTexes) {
            return;
        }
        for (const p in this._iblTexes) {
            if (this._iblTexes[p].destroy) {
                this._iblTexes[p].destroy();
            }
        }
        delete this._iblTexes;
    }

    shouldDeleteMeshOnUpdateSymbol() {
        return false;
    }
}

export default StandardPainter;
