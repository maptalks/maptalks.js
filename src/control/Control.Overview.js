import { extend } from 'core/util';
import { createEl } from 'core/util/dom';
import Polygon from 'geometry/Polygon';
import Layer from 'layer/Layer';
import VectorLayer from 'layer/VectorLayer';
import Map from 'map/Map';
import Control from './Control';

 /**
 * @property {Object} options - options
 * @property {Object} [options.position='bottom-right'] - position of the control
 * @property {Number} [options.level=4]  - the zoom level of the overview
 * @property {Object} [options.size={"width":300, "height":200}  - size of the Control
 * @property {Object} [options.style={"color":"#1bbc9b"}] - style of the control, color is the overview rectangle's color
 * @memberOf control.Overview
 * @instance
 */
const options = {
    'level': 4,
    'position': 'bottom-right',
    'size': {
        'width': 300,
        'height': 200
    },
    'style': {
        'color': '#1bbc9b'
    }
};

/**
 * @classdesc
 * An overview control for the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var overview = new Overview({
 *     position : {'bottom': '0', 'right': '0'},
 *     size : {'width' : 300,'height' : 200}
 * }).addTo(map);
 */
class Overview extends Control {

    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn() {
        var container = createEl('div');
        container.style.cssText = 'background:#fff;border:1px solid #b4b3b3;width:' + this.options['size']['width'] + 'px;height:' + this.options['size']['height'] + 'px;';
        return container;
    }

    onAdd() {
        this._createOverview();
    }

    _createOverview(container) {
        var map = this.getMap(),
            dom = container || this.getDOM(),
            extent = map.getExtent();
        var options = map.config();
        extend(options, {
            'center': map.getCenter(),
            'zoom': this._getOverviewZoom(),
            'scrollWheelZoom': false,
            'checkSize': false,
            'doubleClickZoom': false,
            'touchZoom': false,
            'control': false,
            'draggable' : false
        });
        this._overview = new Map(dom, options);
        this._updateBaseLayer();
        this._perspective = new Polygon(extent.toArray(), {
            'draggable': true,
            'cursor': 'move',
            'symbol': {
                'lineWidth': 3,
                'lineColor': this.options['style']['color'],
                'polygonFill': this.options['style']['color'],
                'polygonOpacity': 0.4,
            }
        })
            .on('dragstart', this._onDragStart, this)
            .on('dragend', this._onDragEnd, this);
        map.on('resize moveend zoomend', this._update, this)
            .on('setbaselayer', this._updateBaseLayer, this);
        new VectorLayer('v', [this._perspective]).addTo(this._overview);
        this.fire('load');
    }

    onRemove() {
        this.getMap().off('load', this._initOverview, this)
            .off('resize moveend zoomend', this._update, this)
            .off('setbaselayer', this._updateBaseLayer, this);
    }

    _getOverviewZoom() {
        var map = this.getMap(),
            zoom = map.getZoom(),
            minZoom = map.getMinZoom(),
            level = this.options['level'];
        var i;
        if (level > 0) {
            for (i = level; i > 0; i--) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        } else {
            for (i = level; i < 0; i++) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        }

        return zoom;
    }

    _onDragStart() {
        this._origDraggable = this.getMap().options['draggable'];
        this.getMap().config('draggable', false);
    }

    _onDragEnd() {
        var center = this._perspective.getCenter();
        this._overview.setCenter(center);
        this.getMap().panTo(center);
        this.getMap().config('draggable', this._origDraggable);
    }

    _update() {
        this._perspective.setCoordinates(this.getMap().getExtent().toArray());
        this._overview.setCenterAndZoom(this.getMap().getCenter(), this._getOverviewZoom());
    }

    _updateBaseLayer() {
        var map = this.getMap();
        if (map.getBaseLayer()) {
            this._overview.setBaseLayer(Layer.fromJSON(map.getBaseLayer().toJSON()));
        } else {
            this._overview.setBaseLayer(null);
        }
    }

}

Overview.mergeOptions(options);

Map.mergeOptions({
    'overviewControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['overviewControl']) {
        this.overviewControl = new Overview(this.options['overviewControl']);
        this.addControl(this.overviewControl);
    }
});

export default Overview;
