import Class from 'core/Class';
import { isNil, isNumber } from 'core/util';
import Eventable from 'core/Event';
import { Marker, Polygon } from 'geometry';
import * as Symbolizers from 'renderer/vectorlayer/symbolizers';
import Renderable from 'renderer/Renderable';

/**
 * @property {Object}  [options=null] - base options of layer.
 * @property {Number}  [options.minZoom=-1] - the minimum zoom to display the layer, set to -1 to unlimit it.
 * @property {Number}  [options.maxZoom=-1] - the maximum zoom to display the layer, set to -1 to unlimit it.
 * @property {Boolean} [options.visible=true] - whether to display the layer.
 * @property {Number}  [options.opacity=1] - opacity of the layer, from 0 to 1.
 * @property {String}  [options.renderer=canvas] - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
 */
var options = {
    //最大最小可视范围, null表示不受限制
    'minZoom': null,
    'maxZoom': null,
    //图层是否可见
    'visible': true,
    'opacity': 1,
    'drawImmediate': false,
    // context.globalCompositeOperation, 'source-in' in default
    'globalCompositeOperation': null,
    'renderer': 'canvas',
    'dx': 0,
    'dy': 0
};

/**
 * @classdesc
 * Base class for all the layers, defines common methods that all the layer classes share. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category layer
 * @abstract
 * @extends Class
 * @mixes Eventable
 */
export default class Layer extends Eventable(Renderable(Class)) {
    constructor(id, opts) {
        super();
        this.setId(id);
        this.setOptions(opts);
    }

    /**
     * load the tile layer, can't be overrided by sub-classes
     */
    load() {
        if (!this.getMap()) {
            return this;
        }
        this._initRenderer();
        var zIndex = this.getZIndex();
        if (this.onAdd()) {
            if (!isNil(zIndex)) {
                this._renderer.setZIndex(zIndex);
            }
            this._renderer.render(true);
        }
        return this;
    }

    /**
     * Get the layer id
     * @returns {String} id
     */
    getId() {
        return this._id;
    }

    /**
     * Set a new id to the layer
     * @param {String} id - new layer id
     * @return {Layer} this
     * @fires Layer#idchange
     */
    setId(id) {
        //TODO 设置id可能造成map无法找到layer
        var old = this._id;
        if (!isNil(id)) {
            id = id + '';
        }
        this._id = id;
        /**
         * idchange event.
         *
         * @event Layer#idchange
         * @type {Object}
         * @property {String} type - idchange
         * @property {Layer} target    - the layer fires the event
         * @property {String} old        - value of the old id
         * @property {String} new        - value of the new id
         */
        this.fire('idchange', {
            'old': old,
            'new': id
        });
        return this;
    }

    /**
     * Adds itself to a map.
     * @param {Map} map - map added to
     * @return {Layer} this
     */
    addTo(map) {
        map.addLayer(this);
        return this;
    }

    /**
     * Set a z-index to the layer
     * @param {Number} zIndex - layer's z-index
     * @return {Layer} this
     */
    setZIndex(zIndex) {
        this._zIndex = zIndex;
        if (this.map) {
            var layerList = this._getLayerList();
            this.map._sortLayersByZIndex(layerList);
        }
        if (this._renderer) {
            this._renderer.setZIndex(zIndex);
        }
        return this;
    }

    /**
     * Get the layer's z-index
     * @return {Number}
     */
    getZIndex() {
        return this._zIndex;
    }

    /**
     * If the layer is rendered by HTML5 Canvas 2d.
     * @return {Boolean}
     * @protected
     */
    isCanvasRender() {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    }

    /**
     * Get the map that the layer added to
     * @returns {Map}
     */
    getMap() {
        if (this.map) {
            return this.map;
        }
        return null;
    }


    /**
     * Brings the layer to the top of all the layers
     * @returns {Layer} this
     */
    bringToFront() {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var topLayer = layers[layers.length - 1];
        if (layers.length === 1 || topLayer === this) {
            return this;
        }
        var max = topLayer.getZIndex();
        this.setZIndex(max + 1);
        return this;
    }

    /**
     * Brings the layer under the bottom of all the layers
     * @returns {Layer} this
     */
    bringToBack() {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var bottomLayer = layers[0];
        if (layers.length === 1 || bottomLayer === this) {
            return this;
        }
        var min = bottomLayer.getZIndex();
        this.setZIndex(min - 1);
        return this;
    }

    /**
     * Show the layer
     * @returns {Layer} this
     */
    show() {
        if (!this.options['visible']) {
            this.options['visible'] = true;
            if (this._getRenderer()) {
                this._getRenderer().show();
            }
        }
        this.fire('show');
        return this;
    }

    /**
     * Hide the layer
     * @returns {Layer} this
     */
    hide() {
        if (this.options['visible']) {
            this.options['visible'] = false;
            if (this._getRenderer()) {
                this._getRenderer().hide();
            }
        }
        this.fire('hide');
        return this;
    }

    isLoaded() {
        if (!this._renderer) {
            return false;
        }
        return this._renderer.isLoaded();
    }

    /**
     * Whether the layer is visible now.
     * @return {Boolean}
     */
    isVisible() {
        if (isNumber(this.options['opacity']) && this.options['opacity'] <= 0) {
            return false;
        }
        var map = this.getMap();
        if (map) {
            var zoom = map.getZoom();
            if ((!isNil(this.options['maxZoom']) && this.options['maxZoom'] < zoom) ||
                (!isNil(this.options['minZoom']) && this.options['minZoom'] > zoom)) {
                return false;
            }
        }

        if (isNil(this.options['visible'])) {
            this.options['visible'] = true;
        }
        return this.options['visible'];
    }

    /**
     * Remove itself from the map added to.
     * @returns {Layer} this
     */
    remove() {
        if (this.map) {
            this.map.removeLayer(this);
        }
        return this;
    }

    /**
     * Get the mask geometry of the layer
     * @return {Geometry}
     */
    getMask() {
        return this._mask;
    }

    /**
     * Set a mask geometry on the layer, only the area in the mask will be displayed.
     * @param {Geometry} mask - mask geometry, can only be a Marker with vector symbol, a Polygon or a MultiPolygon
     * @returns {Layer} this
     */
    setMask(mask) {
        if (!((mask instanceof Marker && Symbolizers.VectorMarkerSymbolizer.test(mask.getSymbol())) ||
                mask instanceof Polygon)) {
            throw new Error('Mask for a layer must be either a marker with vector marker symbol, a Polygon or a MultiPolygon.');
        }

        if (mask instanceof Marker) {
            mask.updateSymbol({
                'markerLineColor': 'rgba(0, 0, 0, 0)',
                'markerFillOpacity': 0
            });
        } else {
            mask.setSymbol({
                'lineColor': 'rgba(0, 0, 0, 0)',
                'polygonOpacity': 0
            });
        }
        mask._bindLayer(this);
        this._mask = mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    }

    /**
     * Remove the mask
     * @returns {Layer} this
     */
    removeMask() {
        delete this._mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    }

    /**
     * Prepare Layer's loading, this is a method intended to be overrided by subclasses.
     * @return {Boolean} true to continue loading, false to cease.
     * @protected
     */
    onAdd() {
        return true;
    }

    _refreshMask() {
        if (this._mask) {
            this._mask.onZoomEnd();
        }
    }

    _bindMap(map, zIndex) {
        if (!map) {
            return;
        }
        this.map = map;
        this.setZIndex(zIndex);
        this._registerEvents();
        this._switchEvents('on', this);

        this.fire('add');
    }

    _initRenderer() {
        var renderer = this.options['renderer'];
        if (!this.constructor.getRendererClass) {
            return;
        }
        var clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            throw new Error('Invalid renderer for Layer(' + this.getId() + '):' + renderer);
        }
        this._renderer = new clazz(this);
        this._renderer.layer = this;
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    }

    _doRemove() {
        if (this.onRemove) {
            this.onRemove();
        }
        this._switchEvents('off', this);
        this._removeEvents();
        if (this._renderer) {
            this._switchEvents('off', this._renderer);
            this._renderer.remove();
            delete this._renderer;
        }
        delete this._mask;
        delete this.map;
    }

    _switchEvents(to, emitter) {
        if (emitter && emitter.getEvents) {
            this.getMap()[to](emitter.getEvents(), emitter);
        }
    }

    _registerEvents() {
        this.getMap().on('_zoomend', this._refreshMask, this);
    }

    _removeEvents() {
        this.getMap().off('_zoomend', this._refreshMask, this);
    }

    _getRenderer() {
        return this._renderer;
    }

    _getLayerList() {
        if (!this.map) {
            return null;
        }
        return this.map._layers;
    }
}

Layer.mergeOptions(options);

/*Layer.extend = function (props) {
    var NewLayer = Class.extend.call(this, props);
    if (this._rendererClasses) {
        NewLayer._rendererClasses = extend({}, this._rendererClasses);
    }
    return NewLayer;
};*/
