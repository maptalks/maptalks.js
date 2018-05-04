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
        this.loader = new reshader.ResourceLoader(regl.texture(2));
        this.hdr = null;
        this.loader.on('complete', () => {
            if (this.hdr && this.hdr.isReady() && !this._isIBLRecreated) {
                //环境光纹理载入，重新生成ibl纹理
                this.iblMaps = this._createIBLMaps(this.hdr);
                this._isIBLRecreated = true;
            }
            this._redraw = true;
        });
        this._init();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(data, indices) {
        const geometry = new reshader.Geometry(data, indices);
        geometry.generateBuffers(this.regl);
        return geometry;
    }

    addMesh(key, geometry) {
        const mesh = new reshader.Mesh(geometry, this.material);
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
        return mesh;
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

    // debugBRDF() {
    //     const debug = document.getElementById('debugc').getContext('2d');
    //     const pixels = this.regl.read({
    //         // x: 0,
    //         // y: 0,
    //         // width: 1024,
    //         // height: 512,
    //         framebuffer : this.iblMaps.brdfLUT
    //     });
    //     const width = 256, height = 1024;
    //     var halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
    //     var bytesPerRow = width * 4;

    //     // make a temp buffer to hold one row
    //     var temp = new Uint8Array(width * 4);
    //     for (var y = 0; y < halfHeight; ++y) {
    //         var topOffset = y * bytesPerRow;
    //         var bottomOffset = (height - y - 1) * bytesPerRow;

    //         // make copy of a row on the top half
    //         temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

    //         // copy a row from the bottom half to the top
    //         pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

    //         // copy the copy of the top half row to the bottom half
    //         pixels.set(temp, bottomOffset);
    //     }

    //     // This part is not part of the answer. It's only here
    //     // to show the code above worked
    //     // copy the pixels in a 2d canvas to show it worked
    //     var imgdata = new ImageData(width, height);
    //     imgdata.data.set(pixels);
    //     debug.putImageData(imgdata, 0, 0);
    // }

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
        // for (const p in this.meshCache) {
        //     if (this.meshCache.hasOwnProperty(p)) {
        //         this.delete(p);
        //     }
        // }
        delete this.meshCache;
        this.material.dispose();
        this.shader.dispose();
    }

    _init() {
        const regl = this.regl;
        this.shader = new reshader.MeshShader({
            vert : reshader.pbr.StandardVert,
            frag : reshader.pbr.StandardFrag,
            uniforms : this._getUniforms(),
            defines : this._getDefines(),
            extraCommandProps : {
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
                // },
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        });
        this.scene = new reshader.Scene();
        this.renderer = new reshader.Renderer(regl);

        this._updateMaterial();

        const cubeLightConfig = this.sceneConfig.lights.ambientCubeLight;
        if (cubeLightConfig) {

            if (!cubeLightConfig.url && !cubeLightConfig.data) {
                throw new Error('Must provide url or data(ArrayBuffer) for ambientCubeLight');
            }
            const props = {
                url : cubeLightConfig.url,
                arrayBuffer : true,
                hdr : true,
                type : 'float',
                format : 'rgba',
                flipY : true
            };
            this._isIBLRecreated = !!cubeLightConfig.data;
            if (cubeLightConfig.data) {
                let data = cubeLightConfig.data;
                if (cubeLightConfig.data instanceof ArrayBuffer) {
                    // HDR raw data
                    data = reshader.HDR.parseHDR(cubeLightConfig.data);
                    props.data = data.pixels;
                    props.width = data.width;
                    props.height = data.height;
                } else {
                    props.data = data;
                }
            }
            this.hdr = new reshader.Texture2D(
                props,
                this.loader
            );

            //生成ibl纹理
            this.iblMaps = this._createIBLMaps(this.hdr);
        }
    }

    _createIBLMaps(hdr) {
        const regl = this.regl;
        return reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture : hdr.getREGLTexture(regl),
            // prefilterCubeSize : 256
        });
    }

    _updateMaterial() {
        if (this.material) {
            this.material.dispose();
        }
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
            uniforms['prefilterMap'] = this.iblMaps.prefilterMap;
            uniforms['brdfLUT'] = this.iblMaps.brdfLUT;
        }

        return uniforms;
    }

    _getDefines() {
        const defines =  {
            'USE_COLOR' : 1,
            'SUPPORT_TEXTURE_LOD' : 1
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
