import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';

const SCALE = [1, 1, 1];

class PhongPainter extends Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        this.colorSymbol = 'polygonFill';
        this.opacitySymbol = 'polygonOpacity';
    }

    createGeometry(glData) {
        const data = {
            aPosition: glData.data.aPosition,
            aNormal: glData.data.aNormal,
            aTangent: glData.data.aTangent,
            aColor: glData.data.aColor,
            aPickingId: glData.data.aPickingId
        };
        const extrusionOpacity = this.getSymbol().material && this.getSymbol().material.extrusionOpacity;
        if (extrusionOpacity) {
            const aExtrusionOpacity = new Uint8Array(data.aPosition.length / 3);
            for (let i = 0; i < data.aPosition.length; i += 3) {
                if (data.aPosition[i + 2] > 0) {
                    //top
                    aExtrusionOpacity[i / 3] = 0;
                } else {
                    aExtrusionOpacity[i / 3] = 1;
                }
            }
            data.aExtrusionOpacity = aExtrusionOpacity;
        }

        const geometry = new reshader.Geometry(data, glData.indices);
        geometry.generateBuffers(this.regl);

        return geometry;
    }

    createMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this._material, {
            transparent: true,
            castShadow: false,
            picking: true
        });
        mesh.setUniform('tileExtent', geometry.properties.tileExtent);
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        const defines = {};
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aNormal && !geometry.data.aTangent) {
            defines['HAS_NORMAL'] = 1;
        }
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
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

        this.scene.addMesh(mesh);
        return this;
    }

    updateSceneConfig(config) {
        const keys = Object.keys(config);
        if (keys.length === 1 && keys[0] === 'material') {
            this.sceneConfig.material = config.material;
            this._updateMaterial();
        } else {
            extend(this.sceneConfig, config);
            this.init();
            this.setToRedraw();
        }
    }

    delete(context) {
        super.delete(context);
        this._material.dispose();
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const config = this.getShaderConfig();

        this.shader = new reshader.PhongShader(config);

        this._updateMaterial();


        const pickingConfig = {
            vert: this.getPickingVert(),
            uniforms: [
                'projViewMatrix',
                'modelMatrix',
                'positionMatrix',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ]
        };
        this.picking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }

    getShaderConfig() {
        const canvas = this.canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };
        return {
            extraCommandProps: {
                //enable cullFace
                cull: {
                    enable: () => {
                        const cull = this.sceneConfig.cullFace;
                        if (cull === false) {
                            return false;
                        }
                        return true;
                    },
                    face: () => {
                        let cull = this.sceneConfig.cullFace;
                        if (cull === true) {
                            cull = 'back';
                        }
                        return cull || 'back';
                    }
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
                sample: {
                    alpha: true
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        // srcAlpha: 1,
                        dst: 'one minus src alpha',
                        // dstAlpha: 1
                    },
                    equation: 'add',
                    // color: [0, 0, 0, 0]
                },
                viewport,
                polygonOffset: {
                    enable: true,
                    offset: {
                        factor: -(this.pluginIndex + 1),
                        units: -(this.pluginIndex + 1)
                    }
                }
            }
        };
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

    _updateMaterial() {
        if (this._material) {
            this._material.dispose();
        }
        const materialConfig = this.getSymbol().material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                material[p] = materialConfig[p];
            }
        }
        this._material = new reshader.PhongMaterial(material);
    }


    getUniformValues(map, context) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            cameraPosition = map.cameraPosition;
        const lightUniforms = this._getLightUniformValues();
        const uniforms = extend({
            viewMatrix, projMatrix, cameraPosition,
            projViewMatrix: map.projViewMatrix
        }, lightUniforms);
        if (context && context.jitter) {
            uniforms['halton'] = context.jitter;
        } else {
            uniforms['halton'] = [0, 0];
        }
        const canvas = this.layer.getRenderer().canvas;
        uniforms['globalTexSize'] = [canvas.width, canvas.height];
        return uniforms;
    }

    getPickingVert() {
        // return `
        //     attribute vec3 aPosition;
        //     uniform mat4 projViewModelMatrix;
        //     #include <fbo_picking_vert>
        //     void main() {
        //         vec4 pos = vec4(aPosition, 1.0);
        //         gl_Position = projViewModelMatrix * pos;
        //         fbo_picking_setData(gl_Position.w, true);
        //     }
        // `;
        return `
            attribute vec3 aPosition;
            uniform mat4 projViewModelMatrix;
            uniform mat4 modelMatrix;
            uniform mat4 positionMatrix;
            //引入fbo picking的vert相关函数
            #include <fbo_picking_vert>
            #include <get_output>
            void main()
            {
                frameUniforms.modelMatrix = getModelMatrix();
                gl_Position = projViewModelMatrix * frameUniforms.modelMatrix * getPosition(aPosition);
                //传入gl_Position的depth值
                fbo_picking_setData(gl_Position.w, true);
            }
        `;
    }

    _getLightUniformValues() {
        const lightConfig = this.sceneConfig.light;

        const uniforms = {
            'lightAmbient': lightConfig.ambient,
            'lightDiffuse': lightConfig.diffuse,
            'lightSpecular': lightConfig.specular,
            'lightDirection': lightConfig.direction
        };

        return uniforms;
    }

}

export default PhongPainter;
