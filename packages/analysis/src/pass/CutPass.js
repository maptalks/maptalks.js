import { mat4 } from '@maptalks/gl';
import { reshader } from '@maptalks/gl';
import vert from './glsl/cut.vert';
import frag from './glsl/cut.frag';
import { Util } from 'maptalks';
import CutAnalysisController from './CutAnalysisController';
import CutShader from './CutShader';
import AnalysisPass from './AnalysisPass';

const clearColor = [0, 0, 0, 1];
const phongUniforms = {
    'lightAmbient': [1.0, 1.0, 1.0],
    'lightDiffuse': [1.0, 1.0, 1.0],
    'lightSpecular': [1.0, 1.0, 1.0],
    'lightDirection': [1.0, 1.0, 1.0]
};

export default class CutPass extends AnalysisPass {

    _init() {
        this._meshesFBO = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._cutShader1 = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport,
            }
        });
        this._cutShader2 = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport,
                depth: {
                    enable: true,
                    func: 'always',
                    mask: false,
                    range: [0, 0]
                }
            }
        });
        this._meshShader = new CutShader({
            extraCommandProps: {
                viewport: this._viewport,
                blend: {
                    enable: (_, props) => { return !!props.meshConfig.transparent; },
                    func: {
                        srcRGB: 'src alpha',
                        srcAlpha: 1,
                        dstRGB: 'one minus src alpha',
                        dstAlpha: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        });
        this._helperShader = new CutShader({
            extraCommandProps: {
                viewport: this._viewport,
                blend: {
                    enable: (_, props) => { return !!props.meshConfig.transparent; },
                    func: {
                        srcRGB: 'src alpha',
                        srcAlpha: 1,
                        dstRGB: 'one minus src alpha',
                        dstAlpha: 'one minus src alpha'
                    },
                    equation: 'add'
                },
                depth: {
                    enable: true,
                    func: 'always',
                    mask: false,
                    range: [0, 0]
                }
            }
        });
        this._fbo = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._meshScene = new reshader.Scene();
        this._helperScene = new reshader.Scene();
        this._scene = new reshader.Scene();
    }

    _setController(map, position, rotation, scale) {
        this.controller = new CutAnalysisController(map, this.renderer, position, rotation, scale);
    }

    _resetController(position, rotation, scale) {
        if (this.controller) {
            this.controller.updateTRS(position, rotation, scale);
            this.controller._updateMeshesLocalMatrix();
            this.controller._setToRedraw();
        }
    }

    render(meshes, config) {
        this._resize();
        this.renderer.clear({
            color : clearColor,
            depth : 1,
            framebuffer : this._fbo
        });
        const sceneMeshes = this._prepareMeshes(meshes);//外部传进来的场景meshes
        const controllerMeshes = this.controller.getAllMeshes();//辅助模型
        const projViewMatrix = this.controller.createProjViewMatrix();
        this._renderMeshes(sceneMeshes, controllerMeshes, projViewMatrix, config.map);
        this._renderCutMap(sceneMeshes, controllerMeshes, projViewMatrix, config.map);
        return { meshesMap: this._meshesFBO, invisibleMap: this._fbo };
    }

    _prepareMeshes(meshes) {
        const renderMeshes = [];
        for (let i = 0; i < meshes.length; i++) {
            const uniforms = Util.extend({}, meshes[i].material.uniforms, phongUniforms);
            const material = new reshader.PhongMaterial(uniforms);
            const mesh = new reshader.Mesh(meshes[i].geometry, material);
            const defines = mesh.getDefines();
            defines['HAS_CUT'] = 1;
            mesh.setDefines(defines);
            mesh.localTransform = meshes[i].localTransform;
            renderMeshes.push(mesh);
        }
        return renderMeshes;
    }

    // _calPlane(modelMatrix) {
    //     const m = helperPos.slice(0, 3);
    //     const n = helperPos.slice(3, 6);
    //     const p = helperPos.slice(6, 9);
    //     const center = [0, 0, 0];
    //     vec3.transformMat4(m, m, modelMatrix);
    //     vec3.transformMat4(n, n, modelMatrix);
    //     vec3.transformMat4(p, p, modelMatrix);
    //     vec3.transformMat4(center, center, modelMatrix);

    //     const B = ((n[0] - p[0]) * (m[2] - n[2]) - (m[0] - n[0]) * (n[2] - p[2])) / ((m[0] - n[0]) * (n[1] - p[1]) - (n[0] - p[0]) * (m[1] - n[1]));
    //     const A = (-(m[2] - n[2]) - (m[1] - n[1]) * B) / (m[0] - n[0]);
    //     const normal = vec3.set(VEC3, A, B, 1);
    //     const lookPoint = vec3.set([], center[0] - normal[0], center[1] - normal[1], center[2] - normal[2]);
    //     return lookPoint;
    // }

    //渲染cut贴图
    _renderCutMap(sceneMeshes, helperMeshes, projViewMatrixFromViewpoint, map) {
        this.renderer.clear({
            color : [0, 0, 0, 0],
            depth : 1,
            framebuffer : this._fbo
        });
        const uniforms = {
            cut_projViewMatrixFromViewpoint: projViewMatrixFromViewpoint,
            projViewMatrix: map.projViewMatrix
        };
        this._scene.setMeshes(sceneMeshes);
        this.renderer.render(
            this._cutShader1,
            uniforms,
            this._scene,
            this._fbo
        );
        this._scene.setMeshes(helperMeshes);
        this.renderer.render(
            this._cutShader2,
            uniforms,
            this._scene,
            this._fbo
        );
    }

    _renderMeshes(sceneMeshes, helperMeshes, projViewMatrixFromViewpoint, map) {
        this.renderer.clear({
            color : [0, 0, 0, 0],
            depth : 1,
            framebuffer : this._meshesFBO
        });
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        const uniforms = {
            'projMatrix': map.projMatrix,
            'cut_projViewMatrixFromViewpoint': projViewMatrixFromViewpoint,
            'projViewMatrix' : map.projViewMatrix,
            'viewMatrix': map.viewMatrix,
            'cameraPosition' : map.cameraPosition,
            'altitudeScale': 1,
            'outSize': [width, height],
            'halton': [0.2107, -0.0202],
            'polygonFill': [1, 1, 1, 1],
            'polygonOpacity': 1
        };
        updateLightUniforms(uniforms, this.renderer.canvas, map);
        this._meshScene.setMeshes(sceneMeshes);
        this.renderer.render(
            this._meshShader,
            uniforms,
            this._meshScene,
            this._meshesFBO
        );
        this._helperScene.setMeshes(helperMeshes);
        this.renderer.render(
            this._helperShader,
            uniforms,
            this._helperScene,
            this._meshesFBO
        );
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._depthShader) {
            this._depthShader.dispose();
        }
        if (this._cutShader) {
            this._cutShader.dispose();
        }
        if (this.controller) {
            this.controller._remove();
        }
    }

    _resize() {
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
        if (this._meshesFBO && (this._meshesFBO.width !== width || this._meshesFBO.height !== height)) {
            this._meshesFBO.resize(width, height);
        }
        if (this.controller) {
            this.controller.resize(width, height);
        }
    }
}

function updateLightUniforms(uniforms, canvas, map, context) {
    const { iblTexes, dfgLUT } = reshader.pbr.PBRUtils.getIBLResOnCanvas(canvas);
    if (map && map.getLights()) {
        // 获取 pbr 灯光设置相关的 uniforms
        const pbrUniforms = reshader.pbr.PBRUtils.getPBRUniforms(map, iblTexes, dfgLUT, context && context.ssr, context && context.jitter);
        const lightConfig = map.getLights();
        //phong光照需要设置ambientColor
        const ambientColor = (lightConfig.ambient && lightConfig.ambient.color) ? lightConfig.ambient.color : [1, 1, 1];
        uniforms['ambientColor'] = ambientColor;
        if (pbrUniforms) {
            Util.extend(uniforms, pbrUniforms);
        }
    } else {
        const lightUniforms = reshader.pbr.PBRUtils.getPBRUniforms(map, null, dfgLUT, context && context.ssr, context && context.jitter);
        Util.extend(uniforms, lightUniforms);
    }
}
