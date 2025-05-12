import createREGL from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';

const PREFILTER_CUBE_SIZE = 512;

class LightManager {

    constructor(map) {
        this._map = map;
        this._loader = new reshader.ResourceLoader();
    }

    getDirectionalLight() {
        return this._config && this._config.directional || {};
    }

    getAmbientLight() {
        return this._config && this._config.ambient || {};
    }

    getAmbientResource() {
        return this._iblMaps;
    }

    setConfig(config) {
        const oldConfig = this._config;
        this._urlModifier = config.urlModifier;
        this._config = JSON.parse(JSON.stringify(config));
        let ambientUpdate = false;
        if (!config || !config.ambient || !config.ambient.resource) {
            this._disposeCubeLight();
            ambientUpdate = oldConfig && oldConfig.ambient && oldConfig.ambient.resource;
        } else if (!oldConfig || !oldConfig.ambient || !ambientEqual(oldConfig.ambient, config.ambient)) {
            this._initAmbientResources();
            return;
        } else if (this._iblMaps) {
            if (config.ambient.prefilterCubeSize !== oldConfig.ambient && oldConfig.ambient.prefilterCubeSize) {
                this._onHDRLoaded();
            }
            ambientUpdate = true;
            if (config.ambient.resource.sh) {
                this._iblMaps.sh = config.ambient.resource.sh;
            }
        }
        this._map.fire('updatelights', { ambientUpdate });
    }

    _tryToGetREGLContext(map) {
        const layers = map.getLayers();
        for (let i = 0; i < layers.length; i++) {
            const renderer = layers[i] && layers[i].getRenderer();
            if (!renderer) {
                continue;
            }
            if (renderer.regl) {
                return renderer.regl;
            }
        }
        const canvas = document.createElement('canvas');
        const regl = createREGL({
            canvas,
            attributes: {
                depth: false,
                stencil: false,
                alpha: false
            },
            optionalExtensions: [
                'OES_standard_derivatives',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'OES_texture_float',
                'OES_texture_float_linear',
            ]
        });
        regl._temp = true;
        return regl;
    }

    _initAmbientResources() {
        const resource = this._config.ambient.resource;
        const url = resource && resource.url;
        if (!url) {
            return;
        }
        const images = [];
        let count = 0;
        let currentCount = 0;
        const onload = () => {
            currentCount++;
            if (currentCount >= count) {
                this._onSkyboxLoaded(images);
            }
        }
        const onerror = function() {
            throw new Error(`skybox image with url(${this.src}) failed to load, please check the image's url.`);
        }
        const urlModifier = this._urlModifier;
        if (url.top || url.nx) {
            // ambient with 6 images
            const { front, back, right, left, top, bottom } = url;
            const { nx, ny, px, py, nz, pz } = url;
            let envUrls;
            if (front) {
                envUrls = [left, right, back, front, top, bottom];
            } else {
                envUrls = [nx, px, nz, pz, py, ny];
            }
            count = envUrls.length;
            for (let i = 0; i < count; i++) {
                const img = new Image();
                img.onload = onload;
                img.onerror = onerror;
                img.src = urlModifier && urlModifier(envUrls[i]) || envUrls[i];
                images[i] = img;
            }
        } else {
            const props = {
                url: resource.url,
                arrayBuffer: true,
                hdr: true,
                // type: 'uint8',
                // format: 'rgba',
                flipY: true
            };
            this._loader.setURLModifier(urlModifier);
            this._hdr = new reshader.Texture2D(
                props,
                this._loader
            );
            this._hdr.once('complete', () => {
                this._onHDRLoaded();
            });
            this._hdr.once('error', () => {
                this._onHDRError();
            });
        }
    }

    dispose() {
        this._disposeCubeLight();
    }

    _onHDRLoaded() {
        if (this._hdr) {
            this._iblMaps = this._createIBLMaps(this._hdr);
            // this._hdr.dispose();
            // delete this._hdr;
            this._map.fire('updatelights', { 'ambientUpdate': true });
        }
    }

    _onHDRError() {
        this._map.fire('hdrerror');
    }

    _onSkyboxLoaded(images) {
        this._iblMaps = this._createIBLMaps(images);
        this._map.fire('updatelights', { 'ambientUpdate': true });
    }

    _createIBLMaps(envTexture) {
        const config = this._config.ambient.resource;
        const cubeSize = config.prefilterCubeSize || PREFILTER_CUBE_SIZE;
        const regl = this._tryToGetREGLContext(this._map);
        const maps = reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: Array.isArray(envTexture) ? envTexture : envTexture.getREGLTexture(regl),
            ignoreSH: !!config['sh'],
            envCubeSize: cubeSize,
            prefilterCubeSize: cubeSize,
            environmentExposure: this._config.ambient.exposure,
            format: 'array'
        });
        // hdr.dispose();
        if (config['sh']) {
            maps.sh = config['sh'];
            //兼容老的[[], [], ..]形式的sh
            if (Array.isArray(maps['sh'][0])) {
                const sh = maps['sh'];
                const flatten = [];
                for (let i = 0; i < sh.length; i++) {
                    flatten.push(...sh[i]);
                }
                maps['sh'] = flatten;
            }
        }/* else {
            console.log(JSON.stringify(maps.sh));
        }*/
        if (regl._temp) {
            delete this._hdr;
            regl.destroy();
        }
        return maps;
    }

    _disposeCubeLight() {
        if (this._hdr) {
            this._hdr.dispose();
            delete this._hdr;
        }
        delete this._iblMaps;
    }
}

export default LightManager;

function ambientEqual(config0, config1) {
    if (!config0.resource) {
        return false;
    }
    if (config0.resource.url !== config1.resource.url) {
        return false;
    }
    return true;
}
