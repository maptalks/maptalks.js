import * as reshader from 'reshader.gl';
import { mat4 } from '@mapbox/gl-matrix';
import { extend } from './Util';

class PBRScenePainter {
    constructor(regl, sceneConfig) {
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

    createMesh(key, data, indices) {
        const geometry = new reshader.Geometry(data, indices);
        geometry.generateBuffers(this.regl);
        const mesh = new reshader.Mesh(geometry, this.material);
        this.addMesh(key, mesh);
        return mesh;
    }

    addMesh(key, mesh) {
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
    }

    paint(layer) {
        this._redraw = false;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }
        //TODO implement shadow pass
        this.renderer.render(this.shader, this._getUniformValues(map), this.scene);
        return {
            redraw : false
        };
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
        for (const p in this.meshCache) {
            if (this.meshCache.hasOwnProperty(p)) {
                this.delete(p);
            }
        }
        this.material.dispose();
        this.shader.dispose();
    }

    _init() {
        const regl = this.regl;
        this.loader = new reshader.ResourceLoader(regl.texture(2));
        this.shader = new reshader.MeshShader(
            reshader.pbr.StandardVert, reshader.pbr.StandardFrag,
            this._getUniforms(),
            this._getDefines(),
            {
                //enable cullFace
                cull : {
                    enable: true,
                    face: 'back'
                },
                // stencil: {
                //     enable: false,
                //     mask: 0x0,
                //     func: {
                //         cmp: '=',
                //         ref: regl.prop('stencilRef'),
                //         mask: 0xff
                //     }
                // }
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        );
        this.scene = new reshader.Scene();
        this.renderer = new reshader.Renderer(regl);

        const materialConfig = this.sceneConfig.material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Map') > 0) {
                    //a texture image
                    material[p] = new reshader.Texture2D({
                        url : materialConfig[p],
                        wrapS : 'repeat', wrapT : 'repeat'
                    }, this.loader);
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        /* {
            metallic : 1,
            roughness : 0.2,
            albedoColor : [1, 1, 1],
            albedoMap : new reshader.Texture2D({
                url : './resources/rusted_iron/albedo.png'
            }, loader),
            normalMap : new reshader.Texture2D({
                url : './resources/rusted_iron/normal.png'
            }, loader),
            occulusionRoughnessMetallicMap : new reshader.Texture2D({
                url : './resources/rusted_iron/occulusionRoughnessMetallicMap-1024.png'
            }, loader)
        } */
        this.material = new reshader.pbr.StandardMaterial(material);

        if (this.sceneConfig.lights.ambientCubeLight) {
            if (!this.sceneConfig.lights.ambientCubeLight.url) {
                throw new Error('Must provide url for ambientCubeLight');
            }
            const hdr = new reshader.Texture2D(
                {
                    url : this.sceneConfig.lights.ambientCubeLight.url,
                    arrayBuffer : true,
                    hdr : true,
                    type : 'float',
                    format : 'rgba',
                    flipY : true
                },
                this.loader
            );
            if (!hdr.isReady()) {
                this.loader.on('complete', () => {
                    if (hdr.isReady()) {
                        //环境光纹理载入，重新生成ibl纹理
                        this.iblMaps = createMaps(hdr);
                        this._redraw = true;
                    }
                });
            }

            //生成ibl纹理
            this.iblMaps = createMaps(hdr);
        }
        function createMaps(hdr) {
            return reshader.pbr.PBRHelper.createIBLMaps(regl, {
                envTexture : hdr.getREGLTexture(regl)
            });
        }
    }

    _getUniforms() {
        const uniforms = [
            'model',
            'ambientColor',

            // 'lightPositions[0]', 'lightPositions[1]', 'lightPositions[2]', 'lightPositions[3]',
            // 'lightColors[0]', 'lightColors[1]', 'lightColors[2]', 'lightColors[3]',
            // 'irradianceMap', 'prefilterMap', 'brdfLUT'
            {
                name : 'projectionViewModel',
                type : 'function',
                fn : function (context, props) {
                    const projectionViewModel = [];
                    mat4.multiply(projectionViewModel, props['view'], props['model']);
                    mat4.multiply(projectionViewModel, props['projection'], projectionViewModel);
                    return projectionViewModel;
                }
            },
            {
                name : 'viewModel',
                type : 'function',
                fn : function (context, props) {
                    const viewModel = [];
                    mat4.multiply(viewModel, props['view'], props['model']);
                    return viewModel;
                }
            }
        ];

        const lightConfig = this.sceneConfig.lights;

        if (lightConfig.dirLights) {
            lightConfig.dirLights.forEach((light, idx) => {
                uniforms.push(`dirLightDirections[${idx}]`);
                uniforms.push(`dirLightColors[${idx}]`);
            });
        }
        if (lightConfig.spotLights) {
            lightConfig.spotLights.forEach((light, idx) => {
                uniforms.push(`spotLightPositions[${idx}]`);
                uniforms.push(`spotLightColors[${idx}]`);
            });
        }
        if (lightConfig.ambientCubeLight) {
            uniforms.push('irradianceMap', 'prefilterMap', 'brdfLUT');
        }
        return uniforms;
    }

    _getUniformValues(map) {
        const view = map.viewMatrix,
            projection = map.projMatrix,
            camPos = map.cameraPosition;
        const lightUniforms = this._getLightUniforms();
        return extend({
            view, projection, camPos
            // spotLightPositions : {
            //     '0' : lightPositions[0],
            //     '1' : lightPositions[1],
            //     '2' : lightPositions[2],
            //     '3' : lightPositions[3],
            // },
            // spotLightColors : {
            //     '0' : lightColors[0],
            //     '1' : lightColors[1],
            //     '2' : lightColors[2],
            //     '3' : lightColors[3],
            // }
            // irradianceMap : iblMaps.irradianceCubeMap,
            // prefilterMap : iblMaps.prefilterCubeMap,
            // brdfLUT : iblMaps.brdfLUT,
        }, lightUniforms);
    }

    _getLightUniforms() {
        const lightConfig = this.sceneConfig.lights;

        const ambientColor = lightConfig.ambientColor || [0.08, 0.08, 0.08];
        const uniforms = {
            ambientColor
        };

        if (lightConfig.dirLights) {
            uniforms['dirLightDirections'] = {};
            uniforms['dirLightColors'] = {};
            lightConfig.dirLights.forEach((light, idx) => {
                uniforms['dirLightDirections'][idx + ''] = light.direction;
                uniforms['dirLightColors'][idx + ''] = light.color;
            });
        }
        if (lightConfig.spotLights) {
            uniforms['spotLightPositions'] = {};
            uniforms['spotLightColors'] = {};
            lightConfig.spotLights.forEach((light, idx) => {
                uniforms['spotLightPositions'][idx + ''] = light.position;
                uniforms['spotLightColors'][idx + ''] = light.color;
            });
        }
        if (lightConfig.ambientCubeLight) {
            uniforms['irradianceMap'] = this.iblMaps.irradianceMap;
            uniforms['prefilterCubeMap'] = this.iblMaps.prefilterCubeMap;
            uniforms['brdfLUT'] = this.iblMaps.brdfLUT;
        }

        return uniforms;
    }

    _getDefines() {
        const defines =  {
            'USE_COLOR' : 1
        };

        const lightConfig = this.sceneConfig.lights;

        if (lightConfig.dirLights) {
            defines['USE_DIR_LIGHT'] = 1;
            defines['NUM_OF_DIR_LIGHTS'] = `(${lightConfig.dirLights.length})`;
        }
        if (lightConfig.spotLights) {
            defines['USE_SPOT_LIGHT'] = 1;
            defines['NUM_OF_SPOT_LIGHTS'] = `(${lightConfig.spotLights.length})`;
        }
        if (lightConfig.ambientCubeLight) {
            defines['USE_AMBIENT_CUBEMAP'] = 1;
        }
        return defines;
    }
}

export default PBRScenePainter;
