import { reshader } from '@maptalks/gl';
import { mat3, mat4 } from '@maptalks/gl';
import { extend } from './Util';

const vert = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;

    uniform mat4 projViewModelMatrix; //
    uniform mat4 modelMatrix;
    uniform mat3 normalMatrix; //法线矩阵

    varying vec3 vNormal;
    varying vec3 vFragPos;

    void main()
    {
        vec4 pos = vec4(aPosition, 1.0);
        gl_Position = projViewModelMatrix * pos;
        vNormal = normalMatrix * aNormal;
        vFragPos = vec3(modelMatrix * pos);
    }
`;

const frag = `
    #ifdef GL_ES
        precision mediump float;
    #endif

    //漫反射所需变量
    varying vec3 vNormal; //法线矩阵用于消除 model 变换(不等比缩放时)给法线带来的误差，其计算方法： mat3(transpose(inverse(model)))
    varying vec3 vFragPos; //物体当前表面点的世界坐标

    //镜面光照所需变量
    uniform vec3 camPos; //相机的位置，用于计算

    //材质struct
    struct Material {
        vec3 ambient;  //环境光的物体颜色
        vec3 diffuse;  //漫反射的物体颜色
        vec3 specular; //镜面光照的反射颜色
        float shininess; //反光度，镜面高光的散射/半径
        float opacity;
    };
    uniform Material material;

    //光源
    struct Light {
        vec3 direction; //光源位置的世界坐标

        vec3 ambient;  //环境光光强（颜色）
        vec3 diffuse;  //漫反射光光强（颜色）
        vec3 specular; //镜面反射光光强（颜色）
    };

    uniform Light light;

    uniform float opacity;

    //光源

    void main()
    {
        // -------------- 光照 ----------------------
        //环境光
        vec3 ambient = light.ambient * material.ambient;
        //------

        //漫反射光
        vec3 norm = normalize(vNormal);
        // vec3 lightDir = normalize(light.position - vFragPos); //计算光入射方向
        vec3 lightDir = normalize(-light.direction);

        float diff = max(dot(norm, lightDir), 0.0); //散射系数，计算光的入射方向和法线夹角，夹角越大则系数越小，去掉小于0的值（没有意义）
        vec3 diffuse = light.diffuse * (diff * material.diffuse);
        //------

        //镜面反射
        // float specularStrength = 1.0; //镜面强度(Specular Intensity)变量
        vec3 viewDir = normalize(camPos - vFragPos); //观察方向
        vec3 reflectDir = reflect(-lightDir, norm);  //反射光方向

        //blinn
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(norm, halfwayDir), 0.0), material.shininess);

        vec3 specular = light.specular * (spec * material.specular);
        //------

        vec3 result = ambient + diffuse + specular;
        gl_FragColor = vec4(result, material.opacity);
        // gl_FragColor = vec4(1.0, 0.0, 0.0, material.opacity);
    }
`;

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

class PhongPainter {
    constructor(regl, layer, sceneConfig) {
        this.layer = layer;
        this.regl = regl;
        this.sceneConfig = sceneConfig || {};
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        this._redraw = false;
        this.meshCache = {};
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
        geometry._pbrFeatures = features;
        geometry.generateBuffers(this.regl);

        return geometry;
    }

    addMesh(key, geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this.material, {
            transparent : true,
            castShadow : false,
            picking : true
        });
        mesh.setLocalTransform(transform);
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
        return mesh;
    }

    paint(context) {
        this._redraw = false;
        const layer = this.layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }

        const uniforms = this._getUniformValues(map);
        const meshes = this.scene.getMeshes();
        const currentMeshes = [],
            backgroundMeshes = [];

        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].uniforms.level === 0) {
                currentMeshes.push(meshes[i]);
            } else {
                backgroundMeshes.push(meshes[i]);
            }
        }

        this.regl.clear({
            stencil: 0xFF
        });

        this.scene.setMeshes(currentMeshes);
        this.scene.sortMeshes(context.cameraPosition);
        this.renderer.render(this.shader, uniforms, this.scene);

        this.scene.setMeshes(backgroundMeshes);
        this.scene.sortMeshes(context.cameraPosition);
        this.renderer.render(this.shader, uniforms, this.scene);

        this.scene.setMeshes(meshes);

        this._pickingRendered = false;

        return {
            redraw : false
        };
    }

    pick(x, y) {
        const map = this.layer.getMap();
        const uniforms = this._getUniformValues(map);
        if (!this._pickingRendered) {
            this._raypicking.render(this.scene.getMeshes().opaques, uniforms);
            this._pickingRendered = true;
        }
        const { meshId, pickingId, point } = this._raypicking.pick(x, y, uniforms, {
            viewMatrix : map.viewMatrix,
            projMatrix : map.projMatrix,
            returnPoint : true
        });
        if (meshId === null) {
            return {
                feature : null,
                point
            };
        }
        return {
            feature : this._raypicking.getMeshAt(meshId).geometry._pbrFeatures[pickingId],
            point
        };
    }

    updateSceneConfig(config) {
        const keys = Object.keys(config);
        if (keys.length === 1 && keys[0] === 'material') {
            this.sceneConfig.material = config.material;
            this._updateMaterial();
        } else {
            extend(this.sceneConfig, config);
            this._init();
            this._redraw = true;
        }
    }

    getMesh(key) {
        return this.meshCache[key];
    }

    delete(key) {
        const mesh = this.meshCache[key];
        if (mesh) {
            const geometry = mesh.geometry;
            geometry.dispose();
            mesh.dispose();
            delete this.meshCache[key];
        }
    }

    clear() {
        this.meshCache = {};
        this.scene.clear();
    }

    remove() {
        delete this.meshCache;
        this.material.dispose();
        this.shader.dispose();
    }

    resize() {}

    _init() {
        const regl = this.regl;

        const map = this.layer.getMap();

        this.scene = new reshader.Scene();

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.layer ? map.width : 1;
            },
            height : () => {
                return this.layer ? map.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return this.layer ? map.width : 1;
                },
                height : () => {
                    return this.layer ? map.height : 1;
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
                // cull : {
                //     enable: false,
                //     face: 'back'
                // },
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

        this.shader = new reshader.MeshShader(config);

        this._updateMaterial();


        const pickingConfig = extend({}, config);
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
        this._raypicking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }


    _updateMaterial() {
        if (this.material) {
            this.material.dispose();
        }
        const materialConfig = this.sceneConfig.material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                material[p] = materialConfig[p];
            }
        }
        this.material = new reshader.Material(material);
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
        return defines;
    }
}

export default PhongPainter;
