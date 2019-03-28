import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { extend, compileStyle, isNil } from '../../common/Util';
import { compress, uncompress } from './Compress';

const defaultOptions = {
    renderer: 'gl',
    fadeAnimation: false,
    altitudeProperty: 'altitude',
    forceRenderOnZooming: true,
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    clipByPitch: false,
    zoomBackground: true,
    tileSize: [512, 512],
    tileSystem: [1, -1, -6378137 * Math.PI, 6378137 * Math.PI],
    stencil: false,
    features: true,
    schema: false,
    cascadeTiles: false,
    collision: true,
    picking: true,
    pickingPoint: false,
    pickingGeometry: false,
    //每帧每个瓦片最多能绘制的sdf数量
    glyphSdfLimitPerFrame: 15,
    //zooming或zoom fading时，每个瓦片最多能绘制的box(icon或text)数量
    boxLimitOnZoomout: 10,
    background: [0, 0, 0, 0],
    maxCacheSize: 128
};

/**
 * Style:
 * [
 *  {
 *     renderPlugin : { ... },
 *     filter : [],
 *     symbol : { ... }
 *  }
 * ]
 */
class VectorTileLayer extends maptalks.TileLayer {

    constructor(id, options) {
        super(id, options);
        // const tileSize = this.getTileSize();
        // this.zoomOffset = -log2(tileSize.width / 256);
        const style = options && options.style || [];
        this.setStyle(style);
    }

    onConfig(conf) {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateOptions(conf);
        }
    }

    getTileUrl(x, y, z) {
        const res = this.getMap().getResolution(z);
        return super.getTileUrl(x, y, getMapBoxZoom(res));
    }

    getWorkerOptions() {
        const map = this.getMap();
        return {
            altitudeProperty: this.options['altitudeProperty'],
            tileSize: this.options['tileSize'],
            baseRes: map.getResolution(map.getGLZoom()),
            //default render时，this.options.style有可能被default render设值
            style: this.isDefaultRender() ? [] : this.options.style,
            features: this.options.features,
            schema: this.options.schema,
            pickingGeometry: this.options['pickingGeometry']
        };
    }

    setStyle(style) {
        style = uncompress(style);
        this.config('style', style);
        this.validateStyle();
        this._compileStyle();
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

    updateSymbol(idx, symbol) {
        const style = this.options.style[idx];
        if (!style) {
            throw new Error(`No style defined at ${idx}`);
        }
        const target = style.symbol;
        const renderer = this.getRenderer();
        if (!renderer) {
            //layer还没有渲染，直接更新style并返回
            extend(target, symbol);
            this._compileStyle();
            return this;
        }
        const props = Object.keys(symbol);
        let needRefresh = false;
        for (let i = 0; i < props.length; i++) {
            const key = props[i];
            if (isPropFunction(target[key]) || isPropFunction(symbol[key])) {
                needRefresh = true;
                break;
            }
        }
        extend(target, symbol);
        if (needRefresh) {
            this.setStyle(this.options.style);
        } else {
            this._compileStyle();
            renderer.updateSymbol(idx);
        }
        return this;
    }

    isDefaultRender() {
        return !!this._isDefaultRender;
    }

    validateStyle() {
        this._isDefaultRender = false;
        let styles = this.options.style;
        if (!styles || Array.isArray(styles) && !styles.length) {
            this._isDefaultRender = true;
            styles = this.options.style = [];
        }
        if (!Array.isArray(styles)) {
            styles = this.options.style = [styles];
        }
        for (let i = 0; i < styles.length; i++) {
            let filter = styles[i].filter;
            if (filter && filter.value) {
                filter = filter.value;
            }
            if (filter !== undefined &&
                filter !== 'default' &&
                filter !== true &&
                !Array.isArray(filter)) {
                throw new Error(`Invalid filter at ${i} : ${JSON.stringify(filter)}`);
            }
            //TODO 如果定义了renderPlugin就必须定义symbol
        }
    }
    getStyle() {
        return this.options.style;
    }

    getCompiledStyle() {
        return this._compiledStyles || [];
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

    /**
     * Return vector tile data's schema, including layers, properties, data types
     * Will return all zoom's schema if z is undefined
     * @param {Number} [z=undefined] - tile's zoom, optional
     * @returns {Object} data schema
     */
    getDataSchema(z) {
        if (!this._schema) {
            this._schema = {};
        }
        if (!isNil(z) && !this._schema[z]) {
            this._schema[z] = {};
        }
        if (isNil(z)) {
            return this._schema;
        }
        return this._schema[z];
    }


    _compileStyle() {
        const styles = this.options.style;
        if (!styles) {
            return;
        }
        this._compiledStyles = compileStyle(styles);
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

    static compressStyleJSON(json) {
        if (!Array.isArray(json) || !json.length) {
            return json;
        }

        return compress(json);
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

function isPropFunction(v) {
    return !!(v && v.properties);
}
