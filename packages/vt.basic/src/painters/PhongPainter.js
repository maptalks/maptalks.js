import { reshader } from '@maptalks/gl';
import { mat3, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';
import vert from './glsl/phong.vert';
import frag from './glsl/phong.frag';

const defaultUniforms = {
    light : {
        'direction' : [1, 1, -1],
        'ambient' : [0.08, 0.08, 0.08],
        'diffuse': [0.5, 0.5, 0.5],
        'specular' : [1, 1, 1],
    },

    material : {
        'ambient' : [1.0, 0.5, 0.31],
        'diffuse' : [1.0, 0.5, 0.31],
        'specular': [0.5, 0.5, 0.5],
        'shininess' : 32,
        'opacity' : 1
    }
};

const SCALE = [1, 1, 1];

class PhongPainter extends Painter {
    constructor(regl, layer, sceneConfig) {
        super(regl, layer, sceneConfig);
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        this.colorSymbol = 'polygonFill';
    }

    createGeometry(glData, features) {
        const data = {
            aPosition : glData.vertices,
            aNormal : glData.normals,
            aColor : glData.colors,
            aPickingId : glData.featureIndexes
        };
        const extrusionOpacity = this.sceneConfig.extrusionOpacity;
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
        geometry.properties.features = features;
        geometry.generateBuffers(this.regl);

        return geometry;
    }

    createMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this._material, {
            transparent : true,
            castShadow : false,
            picking : true
        });
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
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

    deleteMesh(mesh) {
        if (!mesh) {
            return;
        }
        const geometry = mesh.geometry;
        geometry.dispose();
        mesh.dispose();
        this.scene.removeMesh(mesh);
    }

    delete(context) {
        super.delete(context);
        this._material.dispose();
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const canvas = this.canvas;
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };

        const config = {
            vert,
            frag,
            uniforms : this._getUniforms(),
            defines : this._getDefines(),
            extraCommandProps : {
                //enable cullFace
                cull : {
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
                        zpass: 'keep'
                    }
                },
                sample : {
                    alpha : true
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
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        };

        this.shader = new reshader.MeshShader(config);

        this._updateMaterial();


        const pickingConfig = {};
        pickingConfig.vert = `
            attribute vec3 aPosition;
            uniform mat4 projViewModelMatrix;
            #include <fbo_picking_vert>
            void main() {
                vec4 pos = vec4(aPosition, 1.0);
                gl_Position = projViewModelMatrix * pos;
                fbo_picking_setData(gl_Position.w);
            }
        `;
        let u;
        for (let i = 0; i < config.uniforms.length; i++) {
            if (config.uniforms[i] === 'projViewModelMatrix' || config.uniforms[i].name === 'projViewModelMatrix') {
                u = config.uniforms[i];
                break;
            }
        }
        pickingConfig.uniforms = [u];
        this.picking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }

    _updateMaterial() {
        if (this._material) {
            this._material.dispose();
        }
        const materialConfig = this.sceneConfig.material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                material[p] = materialConfig[p];
            }
        }
        this._material = new reshader.Material(material);
    }

    _getUniforms() {
        const uniforms = [
            'modelMatrix',
            'camPos',
            {
                name : 'projViewModelMatrix',
                type : 'function',
                fn : function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                    mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                    return projViewModelMatrix;
                }
            },
            {
                name : 'normalMatrix',
                type : 'function',
                fn : function (context, props) {
                    const normalMatrix = [];
                    mat4.transpose(normalMatrix, mat4.invert(normalMatrix, props['modelMatrix']));
                    return mat3.fromMat4([], normalMatrix);
                }
            },
            'light.direction',
            'light.ambient',
            'light.diffuse',
            'light.specular',

            'material.ambient',
            'material.diffuse',
            'material.specular',
            'material.shininess',
            'material.opacity',

            'extrusionOpacityRange'
        ];

        return uniforms;
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            camPos = map.cameraPosition;
        const lightUniforms = this._getLightUniformValues();
        const uniforms = extend({
            viewMatrix, projMatrix, camPos
        }, lightUniforms);
        const extrusionOpacity = this.sceneConfig.extrusionOpacity;
        if (extrusionOpacity) {
            extend(uniforms, {
                extrusionOpacityRange : extrusionOpacity.value
            });
        }
        return uniforms;
    }

    _getLightUniformValues() {
        const lightConfig = this.sceneConfig.light;
        const materialConfig = this.sceneConfig.material;

        const uniforms = {
            light : extend({}, defaultUniforms.light, lightConfig),
            material : extend({}, defaultUniforms.material, materialConfig),
            // 'light.ambient' : lightConfig.ambient,
            // 'light.diffuse' : lightConfig.diffuse,
            // 'light.specular' : lightConfig.specular,
            // 'light.position' : lightConfig.position,

            // 'material.ambient' : materialConfig.ambient,
            // 'material.diffuse' : materialConfig.diffuse,
            // 'material.specular' : materialConfig.specular,
            // 'material.shininess' : materialConfig.shininess
        };

        return uniforms;
    }

    _getDefines() {
        const defines =  {
            'USE_COLOR' : 1
        };
        if (this.sceneConfig.extrusionOpacity) {
            defines['USE_EXTRUSION_OPACITY'] = 1;
        }
        return defines;
    }
}

export default PhongPainter;
