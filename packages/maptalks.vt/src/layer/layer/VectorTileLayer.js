import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { log2 } from '../../worker/util/Util';

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
    stencil : false
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
        this.zoomOffset = 0;
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
            extent : this.options.extent
        };
    }

    setStyle(style) {
        this.config('style', style);
        this.validateStyle();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateStyle();
        }
        return this;
    }

    validateStyle() {
        const style = this.options.style;
        if (!style) {
            return;
        }
        for (const p in style) {
            if (!Array.isArray(style[p].style)) {
                style[p].style = [style[p].style];
            }
        }
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
        return renderer.picking(cp.x, cp.y);
    }

    static registerPlugin(Plugin) {
        if (!VectorTileLayer.plugins) {
            VectorTileLayer.plugins = [];
        }
        VectorTileLayer.plugins.push(Plugin);
    }

    static getPlugins() {
        return VectorTileLayer.plugins || [];
    }
}

VectorTileLayer.registerJSONType('VectorTileLayer');

VectorTileLayer.mergeOptions(defaultOptions);

VectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
VectorTileLayer.registerRenderer('canvas', null);

export default VectorTileLayer;
