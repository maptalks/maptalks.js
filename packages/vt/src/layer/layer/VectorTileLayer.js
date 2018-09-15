import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { log2 } from '../../worker/util/Util';
import { extend } from '../core/Util';

const defaultOptions = {
    renderer: 'gl',
    fadeAnimation : false,
    altitudeProperty : 'altitude',
    forceRenderOnZooming : true,
    forceRenderOnMoving : true,
    forceRenderOnRotating : true,
    clipByPitch : false,
    extent : 8192,
    zoomBackground : true,
    tileSize : [512, 512],
    stencil : false,
    features : true,
    tileBuffer : 64
};

/**
 * Style:
 * [
 *  {
 *     type : 'plugin-foo',
 *     filter : [],
 *     symbol : ...
 *  }
 * ]
 */
class VectorTileLayer extends maptalks.TileLayer {

    constructor(id, options) {
        super(id, options);
        const tileSize = this.getTileSize();
        this.zoomOffset = -log2(tileSize.width / 256);
        this.validateStyle();
    }

    getTileUrl(x, y, z) {
        return super.getTileUrl(x, y, this.zoomOffset + z);
    }

    getWorkerOptions() {
        const map = this.getMap();
        return {
            altitudeProperty : this.options['altitudeProperty'],
            tileSize : this.options['tileSize'],
            baseRes : map.getResolution(map.getGLZoom()),
            style : this.options.style,
            extent : this.options.extent,
            features : this.options.features,
            tileBuffer : this.options.tileBuffer
        };
    }

    setStyle(style) {
        this.config('style', style);
        this.validateStyle();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setStyle();
        }
        return this;
    }

    updateSceneConfig(idx, sceneConfig) {
        extend(this.options.style[idx].sceneConfig, sceneConfig);
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateSceneConfig(idx, sceneConfig);
        }
        return this;
    }

    validateStyle() {
        const styles = this.options.style;
        if (!styles) {
            return;
        }
        //convert to array is style is an object
        styles.forEach(s => {
            if (!Array.isArray(s.style)) {
                s.style = [s.style];
            }
        });
    }

    getStyle() {
        return this.options.style;
    }

    identify(coordinate) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const cp = map.coordToContainerPoint(coordinate);
        return renderer.pick(cp.x, cp.y);
    }

    static registerPlugin(Plugin) {
        if (!VectorTileLayer.plugins) {
            VectorTileLayer.plugins = {};
        }
        VectorTileLayer.plugins[Plugin.type] = Plugin;
    }

    static getPlugins() {
        return VectorTileLayer.plugins || {};
    }
}

VectorTileLayer.registerJSONType('VectorTileLayer');

VectorTileLayer.mergeOptions(defaultOptions);

VectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
VectorTileLayer.registerRenderer('canvas', null);

export default VectorTileLayer;
