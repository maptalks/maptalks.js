import { isString, flash, isNil, extend, isFunction, isNumber, now } from '../core/util';
import { on, off, createEl, stopPropagation } from '../core/util/dom';
import Browser from '../core/Browser';
import Handler from '../handler/Handler';
import Handlerable from '../handler/Handlerable';
import DragHandler from '../handler/Drag';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import UIComponent from './UIComponent';

/**
 * @property {Object} options - construct options
 * @property {String} [options.containerClass=null]  - css class name applied to UIMarker's DOM container
 * @property {Boolean} [options.draggable=false]  - if the marker can be dragged.
 * @property {Number}  [options.single=false]     - if the marker is a global single one.
 * @property {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
 * @property {Number}  [options.altitude=0] - altitude.
 * @property {Number}  [options.minZoom=0] - the minimum zoom to display .
 * @property {Number}  [options.maxZoom=null] - the maximum zoom to display.
 * @property {String}  [options.horizontalAlignment=middle] - horizontal Alignment 'middle','left','right'
 * @property {String}  [options.verticalAlignment=middle] - vertical Alignment 'middle','top','bottom'
 * @memberOf ui.UIMarker
 * @instance
 */
const options = {
    'containerClass': null,
    'eventsPropagation': true,
    'draggable': false,
    'single': false,
    'content': null,
    'altitude': 0,
    'minZoom': 0,
    'maxZoom': null,
    'horizontalAlignment': 'middle',
    'verticalAlignment': 'middle'
};

const domEvents =
    /**
     * mousedown event
     * @event ui.UIMarker#mousedown
     * @type {Object}
     * @property {String} type                    - mousedown
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mousedown ' +
    /**
     * mouseup event
     * @event ui.UIMarker#mouseup
     * @type {Object}
     * @property {String} type                    - mouseup
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseup ' +
    /**
     * mouseenter event
     * @event ui.UIMarker#mouseenter
     * @type {Object}
     * @property {String} type                    - mouseenter
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseenter ' +
    /**
     * mouseover event
     * @event ui.UIMarker#mouseover
     * @type {Object}
     * @property {String} type                    - mouseover
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseover ' +
    /**
     * mouseout event
     * @event ui.UIMarker#mouseout
     * @type {Object}
     * @property {String} type                    - mouseout
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mouseout ' +
    /**
     * mousemove event
     * @event ui.UIMarker#mousemove
     * @type {Object}
     * @property {String} type                    - mousemove
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'mousemove ' +
    /**
     * click event
     * @event ui.UIMarker#click
     * @type {Object}
     * @property {String} type                    - click
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'click ' +
    /**
     * dblclick event
     * @event ui.UIMarker#dblclick
     * @type {Object}
     * @property {String} type                    - dblclick
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'dblclick ' +
    /**
     * contextmenu event
     * @event ui.UIMarker#contextmenu
     * @type {Object}
     * @property {String} type                    - contextmenu
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'contextmenu ' +
    /**
     * keypress event
     * @event ui.UIMarker#keypress
     * @type {Object}
     * @property {String} type                    - keypress
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'keypress ' +
    /**
     * touchstart event
     * @event ui.UIMarker#touchstart
     * @type {Object}
     * @property {String} type                    - touchstart
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchstart ' +
    /**
     * touchmove event
     * @event ui.UIMarker#touchmove
     * @type {Object}
     * @property {String} type                    - touchmove
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchmove ' +
    /**
     * touchend event
     * @event ui.UIMarker#touchend
     * @type {Object}
     * @property {String} type                    - touchend
     * @property {UIMarker} target    - the uimarker fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    'touchend';

/**
 *
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate. <br>
 *
 * @category ui
 * @extends ui.UIComponent
 * @mixes Handlerable
 * @memberOf ui
 * @example
 * var dom = document.createElement('div');
 * dom.innerHTML = 'hello ui marker';
 * var marker = new maptalks.ui.UIMarker([0, 0], {
 *      draggable : true,
 *      content : dom
 *  }).addTo(map);
 */
class UIMarker extends Handlerable(UIComponent) {

    /**
     * As it's renderered by HTMLElement such as a DIV, it: <br>
     * 1. always on the top of all the map layers <br>
     * 2. can't be snapped as it's not drawn on the canvas. <br>
     * @param  {Coordinate} coordinate - UIMarker's coordinates
     * @param {Object} options - options defined in [UIMarker]{@link UIMarker#options}
     */
    constructor(coordinate, options) {
        super(options);
        this._markerCoord = new Coordinate(coordinate);
    }

    // TODO: obtain class in super
    _getClassName() {
        return 'UIMarker';
    }

    /**
     * Sets the coordinates
     * @param {Coordinate} coordinates - UIMarker's coordinate
     * @returns {UIMarker} this
     * @fires UIMarker#positionchange
     */
    setCoordinates(coordinates) {
        this._markerCoord = coordinates;
        /**
         * positionchange event.
         *
         * @event ui.UIMarker#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {UIMarker} target - ui marker
         */
        this.fire('positionchange');
        if (this.isVisible()) {
            this._coordinate = this._markerCoord;
            this._setPosition();
            this._collides();
        }
        return this;
    }

    /**
     * Gets the coordinates
     * @return {Coordinate} coordinates
     */
    getCoordinates() {
        return this._markerCoord;
    }

    //accord with isSupport for tooltip
    getCenter() {
        return this.getCoordinates();
    }

    // for infowindow
    getAltitude() {
        const coordinates = this.getCoordinates() || {};
        if (isNumber(coordinates.z)) {
            return coordinates.z;
        }
        return this.options.altitude || 0;
    }

    setAltitude(alt) {
        if (isNumber(alt) && this._markerCoord) {
            this._markerCoord.z = alt;
            if (this._updatePosition) {
                this._updatePosition();
                this._collides();
            }
        }
        return this;
    }

    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {UIMarker} this
     * @fires UIMarker#contentchange
     */
    setContent(content) {
        const old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event ui.UIMarker#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {UIMarker} target - ui marker
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': content
        });
        if (this.isVisible()) {
            this.show();
        }
        return this;
    }

    /**
     * Gets the content of the UIMarker
     * @return {String|HTMLElement} content
     */
    getContent() {
        return this.options['content'];
    }

    onAdd() {
        this.show();
    }

    /**
     * Show the UIMarker
     * @returns {UIMarker} this
     * @fires UIMarker#showstart
     * @fires UIMarker#showend
     */
    show() {
        return super.show(this._markerCoord);
    }

    /**
     * Flash the UIMarker, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {UIMarker} this
     */
    flash(interval, count, cb, context) {
        return flash.call(this, interval, count, cb, context);
    }

    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn() {
        let dom;
        const content = this.options['content'];
        const isStr = isString(content);
        if (isStr || isFunction(content)) {
            dom = createEl('div');
            if (isStr) {
                dom.innerHTML = this.options['content'];
            } else {
                //dymatic render dom content
                content.bind(this)(dom);
            }
        } else {
            dom = this.options['content'];
        }
        if (this.options['containerClass']) {
            dom.className = this.options['containerClass'];
        }
        this._registerDOMEvents(dom);
        return dom;
    }

    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {Point} offset
     */
    getOffset() {
        const size = this.getSize();
        //default is middle
        let offsetX = -size.width / 2, offsetY = -size.height / 2;
        const { horizontalAlignment, verticalAlignment } = this.options;
        if (horizontalAlignment === 'left') {
            offsetX = -size.width;
        } else if (horizontalAlignment === 'right') {
            offsetX = 0;
        }
        if (verticalAlignment === 'top') {
            offsetY = -size.height;
        } else if (verticalAlignment === 'bottom') {
            offsetY = 0;
        }
        return new Point(offsetX, offsetY);
    }

    /**
     * Gets UIMarker's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin() {
        return 'center center';
    }

    onDomRemove() {
        const dom = this.getDOM();
        this._removeDOMEvents(dom);
    }

    /**
     * Whether the uimarker is being dragged.
     * @returns {Boolean}
     */
    isDragging() {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }

    _registerDOMEvents(dom) {
        on(dom, domEvents, this._onDomEvents, this);
    }

    _onDomEvents(e) {
        const event = this.getMap()._parseEvent(e, e.type);
        const type = e.type;
        if (type === 'mousedown') {
            this._mousedownEvent = e;
        }
        if (type === 'mouseup') {
            this._mouseupEvent = e;
        }
        if (type === 'click' && this._mouseClickPositionIsChange()) {
            return;
        }
        if (type === 'touchstart') {
            this._touchstartTime = now();
        }
        this.fire(e.type, event);
        // Mobile device simulation click event
        if (type === 'touchend' && Browser.touch) {
            const clickTimeThreshold = this.getMap().options.clickTimeThreshold || 280;
            if (now() - this._touchstartTime < clickTimeThreshold) {
                this._onDomEvents(extend({}, e, { type: 'click' }));
            }
        }
    }

    _removeDOMEvents(dom) {
        off(dom, domEvents, this._onDomEvents, this);
    }

    _mouseClickPositionIsChange() {
        const { x: x1, y: y1 } = this._mousedownEvent || {};
        const { x: x2, y: y2 } = this._mouseupEvent || {};
        return (x1 !== x2 || y1 !== y2);
    }

    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints() {
        const map = this.getMap();
        const containerPoint = map.coordToContainerPoint(this.getCoordinates());
        const size = this.getSize(),
            width = size.width,
            height = size.height;
        const anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(-width / 2, 0)
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(width / 2, 0)
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(0, height / 2)
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(0, -height / 2)
            )

        ];
        return anchors;
    }

    _getViewPoint() {
        let alt = 0;
        if (this._owner) {
            const altitude = this.getAltitude();
            if (altitude > 0) {
                alt = this._meterToPoint(this._coordinate, altitude);
            }
        }
        return this.getMap().coordToViewPoint(this._coordinate, undefined, alt)
            ._add(this.options['dx'], this.options['dy']);
    }

    _getDefaultEvents() {
        return extend({}, super._getDefaultEvents(), { 'zooming zoomend': this.onZoomFilter });
    }

    _setPosition() {
        //show/hide zoomFilter
        this.onZoomFilter();
        super._setPosition();
    }

    onZoomFilter() {
        const dom = this.getDOM();
        if (!dom) return;
        if (!this.isVisible() && dom.style.display !== 'none') {
            dom.style.display = 'none';
        } else if (this.isVisible() && dom.style.display === 'none') {
            dom.style.display = '';
        }
    }

    isVisible() {
        const map = this.getMap();
        if (!map) {
            return false;
        }
        if (!this.options['visible']) {
            return false;
        }
        const zoom = map.getZoom();
        const { minZoom, maxZoom } = this.options;
        if (!isNil(minZoom) && zoom < minZoom || (!isNil(maxZoom) && zoom > maxZoom)) {
            return false;
        }
        const dom = this.getDOM();
        return dom && true;
    }

    isSupportZoomFilter() {
        return true;
    }
}

UIMarker.mergeOptions(options);

const EVENTS = Browser.touch ? 'touchstart mousedown' : 'mousedown';

class UIMarkerDragHandler extends Handler {

    constructor(target) {
        super(target);
    }

    addHooks() {
        this.target.on(EVENTS, this._startDrag, this);
    }

    removeHooks() {
        this.target.off(EVENTS, this._startDrag, this);
    }

    _startDrag(param) {
        const domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1 || domEvent.button === 2) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastCoord = param['coordinate'];
        this._lastPoint = param['containerPoint'];

        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        /**
         * drag start event
         * @event ui.UIMarker#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target.fire('dragstart', param);
    }

    _prepareDragHandler() {
        this._dragHandler = new DragHandler(this.target.getDOM(), {
            'cancelOn': this._cancelOn.bind(this),
            'ignoreMouseleave': true
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    }

    _cancelOn(domEvent) {
        const target = domEvent.srcElement || domEvent.target,
            tagName = target.tagName.toLowerCase();
        if (tagName === 'button' ||
            tagName === 'input' ||
            tagName === 'select' ||
            tagName === 'option' ||
            tagName === 'textarea') {
            return true;
        }
        return false;
    }

    _onMouseDown(param) {
        stopPropagation(param['domEvent']);
    }

    _dragging(param) {
        const target = this.target,
            map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']),
            domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (!this._isDragging) {
            this._isDragging = true;
            return;
        }

        const coord = eventParam['coordinate'],
            point = eventParam['containerPoint'];
        if (!this._lastCoord) {
            this._lastCoord = coord;
        }
        if (!this._lastPoint) {
            this._lastPoint = point;
        }
        const coordOffset = coord.sub(this._lastCoord),
            pointOffset = point.sub(this._lastPoint);
        this._lastCoord = coord;
        this._lastPoint = point;
        this.target.setCoordinates(this.target.getCoordinates().add(coordOffset));
        eventParam['coordOffset'] = coordOffset;
        eventParam['pointOffset'] = pointOffset;

        /**
         * dragging event
         * @event ui.UIMarker#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragging', eventParam);

    }

    _endDrag(param) {
        const target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        delete this._lastCoord;
        delete this._lastPoint;
        this._isDragging = false;
        if (!map) {
            return;
        }
        const eventParam = map._parseEvent(param['domEvent']);
        /**
         * dragend event
         * @event ui.UIMarker#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        if (target && target._mouseClickPositionIsChange && target._mouseClickPositionIsChange()) {
            target.fire('dragend', eventParam);
        }

    }

    isDragging() {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }
}

UIMarker.addInitHook('addHandler', 'draggable', UIMarkerDragHandler);

export default UIMarker;
