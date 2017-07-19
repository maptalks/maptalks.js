import { extend } from 'core/util';
import { on, off, createEl } from 'core/util/dom';
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
 * @property {Object} [options.symbol={}] - symbol of the overview rectangle
 * @memberOf control.Overview
 * @instance
 */
const options = {
    'level': 4,
    'position': {
        'right' : 1,
        'bottom' : 1
    },
    'size': [300, 200],
    'maximize' : true,
    'symbol': {
        'lineWidth': 3,
        'lineColor': '#1bbc9b',
        'polygonFill': '#1bbc9b',
        'polygonOpacity': 0.4
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
        let size = this.options['size'];
        if (!this.options['maximize']) {
            size = [0, 0];
        }
        const container = createEl('div');

        const mapContainer = this.mapContainer = createEl('div');
        mapContainer.style.width = size[0] + 'px';
        mapContainer.style.height = size[1] + 'px';
        mapContainer.className = 'maptalks-overview';
        const button = this.button = createEl('div');
        button.className = 'maptalks-overview-button';
        container.appendChild(mapContainer);
        container.appendChild(button);
        return container;
    }

    onAdd() {
        if (this.options['maximize']) {
            this._createOverview();
        }
        this.getMap().on('resize moving moveend zoomend pitch rotate', this._update, this)
            .on('setbaselayer', this._updateBaseLayer, this);
        on(this.button, 'click', this._onButtonClick, this);
        this._updateButtonText();
    }

    onRemove() {
        this.getMap()
            .off('resize moving moveend zoomend pitch rotate', this._update, this)
            .off('setbaselayer', this._updateBaseLayer, this);
        if (this._overview) {
            this._overview.remove();
            delete this._overview;
            delete this._perspective;
        }
        off(this.button, 'click', this._onButtonClick, this);
    }

    maxmize() {
        const size = this.options['size'];
        const dom = this.mapContainer;
        dom.style.width = size[0] + 'px';
        dom.style.height = size[1] + 'px';
        this._createOverview();
    }

    minimize() {
        if (this._overview) {
            this._overview.remove();
        }
        delete this._overview;
        delete this._perspective;
        const dom = this.mapContainer;
        dom.style.width = 0 + 'px';
        dom.style.height = 0 + 'px';
    }

    _onButtonClick() {
        if (!this._overview) {
            this.maxmize();
        } else {
            this.minimize();
        }
        this._updateButtonText();
    }

    _updateButtonText() {
        if (this._overview) {
            this.button.innerHTML = '-';
        } else {
            this.button.innerHTML = '+';
        }
    }

    _createOverview() {
        const map = this.getMap(),
            dom = this.mapContainer,
            extent = map.getExtent();
        const options = map.config();
        extend(options, {
            'center': map.getCenter(),
            'zoom': this._getOverviewZoom(),
            'zoomAnimationDuration'  : 150,
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
            'symbol': this.options['symbol']
        })
            .on('dragstart', this._onDragStart, this)
            .on('dragend', this._onDragEnd, this);
        new VectorLayer('v', [this._perspective]).addTo(this._overview);
        this.fire('load');
    }

    _getOverviewZoom() {
        const map = this.getMap(),
            zoom = map.getZoom(),
            minZoom = map.getMinZoom(),
            level = this.options['level'];
        if (level > 0) {
            for (let i = level; i > 0; i--) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        } else {
            for (let i = level; i < 0; i++) {
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
        const center = this._perspective.getCenter();
        this._overview.setCenter(center);
        this.getMap().panTo(center);
        this.getMap().config('draggable', this._origDraggable);
    }

    _update() {
        if (!this._overview) {
            return;
        }
        this._perspective.setCoordinates(this.getMap().getExtent().toArray());
        this._overview.setCenterAndZoom(this.getMap().getCenter(), this._getOverviewZoom());
    }

    _updateBaseLayer() {
        if (!this._overview) {
            return;
        }
        const map = this.getMap();
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
