import createREGL from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';

const PREFILTER_CUBE_SIZE = 256;

class LightManager {

    constructor(map) {
        this._map = map;
        this._loader = new reshader.ResourceLoader();

        this.onHDRLoaded = this._onHDRLoaded.bind(this);
    }

    getDirectionalLight() {
        return this._config && this._config.directional;
    }

    getAmbientLight() {
        return this._config && this._config.ambient;
    }

    getAmbientResource() {
        return this._iblMaps;
    }

    setConfig(config) {
        const oldConfig = this._config;
        this._config = JSON.parse(JSON.stringify(config));
        let ambientUpdate = false;
        if (!config || !config.ambient || !config.ambient.resource) {
            this._disposeCubeLight();
            ambientUpdate = oldConfig && oldConfig.ambient && oldConfig.ambient.resource;
        } else if (!oldConfig || !oldConfig.ambient || !ambientEqual(oldConfig.ambient, config.ambient)) {
            this._initAmbientResources();
            return;
        } else if (this._iblMaps && config.ambient.resource.sh) {
            this._iblMaps.sh = config.ambient.resource.sh;
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
            }
        });
        regl._temp = true;
        return regl;
    }

    _initAmbientResources() {
        const resource = this._config.ambient.resource;
        const props = {
            url: resource.url,
            arrayBuffer: true,
            hdr: true,
            // type: 'uint8',
            // format: 'rgba',
            flipY: true
        };
        this._hdr = new reshader.Texture2D(
            props,
            this._loader
        );
        this._hdr.once('complete', this.onHDRLoaded);
        return;
    }

    dispose() {
        this._disposeCubeLight();
    }

    _onHDRLoaded() {
        if (this._hdr) {
            this._iblMaps = this._createIBLMaps(this._hdr);
            this._hdr.dispose();
            delete this._hdr;
            this._map.fire('updatelights', { 'ambientUpdate': true });
        }
    }

    _createIBLMaps(hdr) {
        const config = this._config.ambient.resource;
        const cubeSize = this._config.ambient.prefilterCubeSize || PREFILTER_CUBE_SIZE;
        const regl = this._tryToGetREGLContext(this._map);
        const maps = reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: hdr.getREGLTexture(regl),
            rgbmRange: hdr.rgbmRange,
            ignoreSH: !!config['sh'],
            envCubeSize: cubeSize,
            prefilterCubeSize: cubeSize,
            format: 'array'
        });
        hdr.dispose();
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
