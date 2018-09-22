import { isString, flash } from '../core/util';
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
 * @property {Boolean} [options.draggable=false]  - if the marker can be dragged.
 * @property {Number}  [options.single=false]     - if the marker is a global single one.
 * @property {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
 * @memberOf ui.UIMarker
 * @instance
 */
const options = {
    'eventsPropagation' : true,
    'draggable': false,
    'single': false,
    'content': null
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
        if (isString(this.options['content'])) {
            dom = createEl('div');
            dom.innerHTML = this.options['content'];
        } else {
            dom = this.options['content'];
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
        return new Point(-size.width / 2, -size.height / 2);
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
        this.fire(e.type, event);
    }

    _removeDOMEvents(dom) {
        off(dom, domEvents, this._onDomEvents, this);
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
            'ignoreMouseleave' : true
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
        target.fire('dragend', eventParam);

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
