import { reshader } from '@maptalks/gl';
import { mat3, mat4 } from '@maptalks/gl';
import { extend } from './Util';
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

const level0Filter = mesh => {
    return mesh.uniforms['level'] === 0;
};

const levelNFilter = mesh => {
    return mesh.uniforms['level'] > 0;
};

class PhongPainter {
    constructor(regl, layer, sceneConfig) {
        this._layer = layer;
        this._regl = regl;
        this._canvas = layer.getRenderer().canvas;
        this._sceneConfig = sceneConfig || {};
        if (!this._sceneConfig.lights) {
            this._sceneConfig.lights = {};
        }
        this._redraw = false;
        this.colorSymbol = 'polygonFill';
        this._init();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(glData, features) {
        const data = {
            aPosition : glData.vertices,
            aNormal : glData.normals,
            aColor : glData.colors,
            aPickingId : glData.featureIndexes
        };
        const geometry = new reshader.Geometry(data, glData.indices);
        geometry._features = features;
        geometry.generateBuffers(this._regl);

        return geometry;
    }

    addMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this._material, {
            transparent : true,
            castShadow : false,
            picking : true
        });
        mesh.setLocalTransform(transform);
        this._scene.addMesh(mesh);
        return mesh;
    }

    paint(context) {
        this._redraw = false;
        const layer = this._layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }

        const uniforms = this._getUniformValues(map);

        this._regl.clear({
            stencil: 0xFF
        });
        this._scene.sortMeshes(context.cameraPosition);

        this._shader.filter = level0Filter;
        this._renderer.render(this._shader, uniforms, this._scene);

        this._shader.filter = levelNFilter;
        this._renderer.render(this._shader, uniforms, this._scene);

        this._pickingRendered = false;

        return {
            redraw : false
        };
    }

    pick(x, y) {
        const map = this._layer.getMap();
        const uniforms = this._getUniformValues(map);
        if (!this._pickingRendered) {
            this._raypicking.render(this._scene.getMeshes(), uniforms);
            this._pickingRendered = true;
        }
        const { meshId, pickingId, point } = this._raypicking.pick(x, y, uniforms, {
            viewMatrix : map.viewMatrix,
            projMatrix : map.projMatrix,
            returnPoint : true
        });
        const mesh = (meshId === 0 || meshId) && this._raypicking.getMeshAt(meshId);
        if (!mesh) {
            return {
                feature : null,
                point
            };
        }
        return {
            feature : mesh.geometry._features[pickingId],
            point
        };
    }

    updateSceneConfig(config) {
        const keys = Object.keys(config);
        if (keys.length === 1 && keys[0] === 'material') {
            this._sceneConfig.material = config.material;
            this._updateMaterial();
        } else {
            extend(this._sceneConfig, config);
            this._init();
            this._redraw = true;
        }
    }

    deleteMesh(mesh) {
        if (!mesh) {
            return;
        }
        const geometry = mesh.geometry;
        geometry.dispose();
        mesh.dispose();
        this._scene.removeMesh(mesh);
    }

    clear() {
        this._scene.clear();
    }

    resize() {}

    remove() {
        this._material.dispose();
        this._shader.dispose();
    }

    _init() {
        const regl = this._regl;

        this._scene = new reshader.Scene();

        this._renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this._canvas ? this._canvas.width : 1;
            },
            height : () => {
                return this._canvas ? this._canvas.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return this._canvas ? this._canvas.width : 1;
                },
                height : () => {
                    return this._canvas ? this._canvas.height : 1;
                }
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
                    enable: true,
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
                        zpass: 'keep'
                    }
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
                viewport, scissor,
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        };

        this._shader = new reshader.MeshShader(config);

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
        this._raypicking = new reshader.FBORayPicking(this._renderer, pickingConfig, this._layer.getRenderer().pickingFBO);

    }


    _updateMaterial() {
        if (this._material) {
            this._material.dispose();
        }
        const materialConfig = this._sceneConfig.material;
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

            'material.opacity'
        ];

        return uniforms;
    }

    _getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            camPos = map.cameraPosition;
        const lightUniforms = this._getLightUniformValues();
        return extend({
            viewMatrix, projMatrix, camPos
        }, lightUniforms);
    }

    _getLightUniformValues() {
        const lightConfig = this._sceneConfig.light;
        const materialConfig = this._sceneConfig.material;

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
        return defines;
    }
}

export default PhongPainter;
