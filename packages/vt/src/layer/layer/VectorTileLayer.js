import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { extend, log2 } from '../../common/Util';

const defaultOptions = {
    renderer: 'gl',
    fadeAnimation : false,
    altitudeProperty : 'altitude',
    forceRenderOnZooming : true,
    forceRenderOnMoving : true,
    forceRenderOnRotating : true,
    clipByPitch : false,
    zoomBackground : true,
    tileSize : [512, 512],
    tileSystem : [1, -1, -6378137 * Math.PI, 6378137 * Math.PI],
    stencil : false,
    features : true,
    cascadeTiles : false,
    collision : true
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
        // const tileSize = this.getTileSize();
        // this.zoomOffset = -log2(tileSize.width / 256);
        this.validateStyle();
    }

    getTileUrl(x, y, z) {
        const res = this.getMap().getResolution(z);
        return super.getTileUrl(x, y, getMapBoxZoom(res));
    }

    getWorkerOptions() {
        const map = this.getMap();
        return {
            altitudeProperty : this.options['altitudeProperty'],
            tileSize : this.options['tileSize'],
            baseRes : map.getResolution(map.getGLZoom()),
            style : this.options.style,
            features : this.options.features
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
        let styles = this.options.style;
        if (!styles) {
            return;
        }
        if (!Array.isArray(styles)) {
            styles = this.options.style = [styles];
        }
        //convert to array if style is an object
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
        const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
        return renderer.pick(cp.x, cp.y);
    }

    /**
     * A separate collision index for background tiles
     * To avoid conflict with current zoom's tiles
     * @returns {CollisionIndex}
     */
    getBackgroundCollisionIndex() {
        if (!this._bgCollisionIndex) {
            this._bgCollisionIndex = new maptalks.CollisionIndex();
        }
        return this._bgCollisionIndex;
    }

    /**
     * Clear layer's background tiles collision index.
     */
    clearBackgroundCollisionIndex() {
        if (this._bgCollisionIndex) {
            this._bgCollisionIndex.clear();
        }
        return this;
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

const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));
function getMapBoxZoom(res) {
    return 19 - Math.log(res / MAX_RES) / Math.LN2;
}
