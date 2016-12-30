import { bind, isString, setOptions } from 'core/util';
import { on, off, createEl, stopPropagation } from 'core/util/dom';
import Browser from 'core/Browser';
import Handler from 'core/Handler';
import Handlerable from 'core/Handlerable';
import DragHandler from 'handler/Drag';
import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import { UIComponent } from './UI';

/**
 * As it's renderered by HTMLElement such as a DIV, it: <br>
 * 1. always on the top of all the map layers <br>
 * 2. can't be snapped as it's not drawn on the canvas. <br>
 *
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate. <br>
 *
 * @class
 * @category ui
 * @extends UIComponent
 * @param {Object} options - options defined in [UIMarker]{@link UIMarker#options}
 * @memberOf ui
 * @name UIMarker
 * @example
 * var dom = document.createElement('div');
 * dom.innerHTML = 'hello ui marker';
 * var marker = new UIMarker([0, 0], {
 *      draggable : true,
 *      content : dom
 *  }).addTo(map);
 */
export const UIMarker = UIComponent.extend(/** @lends UIMarker.prototype */ {

    includes: [Handlerable],

    /**
     * @property {Object} options - construct options
     * @property {Boolean} [options.draggable=false]  - if the marker can be dragged.
     * @property {Number}  [options.single=false]     - if the marker is a global single one.
     * @property {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
     */
    options: {
        'draggable': false,
        'single': false,
        'content': null
    },

    initialize: function (coordinate, options) {
        this._markerCoord = new Coordinate(coordinate);
        setOptions(this, options);
    },

    // TODO: obtain class in super
    _getClassName: function () {
        return 'UIMarker';
    },

    /**
     * Sets the coordinates
     * @param {Coordinate} coordinates - UIMarker's coordinate
     * @returns {UIMarker} this
     * @fires UIMarker#positionchange
     */
    setCoordinates: function (coordinates) {
        this._markerCoord = coordinates;
        /**
         * positionchange event.
         *
         * @event UIMarker#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {UIMarker} target - ui marker
         */
        this.fire('positionchange');
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    /**
     * Gets the coordinates
     * @return {Coordinate} coordinates
     */
    getCoordinates: function () {
        return this._markerCoord;
    },

    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {UIMarker} this
     * @fires UIMarker#contentchange
     */
    setContent: function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event UIMarker#contentchange
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
    },

    /**
     * Gets the content of the UIMarker
     * @return {String|HTMLElement} content
     */
    getContent: function () {
        return this.options['content'];
    },

    /**
     * Show the UIMarker
     * @returns {UIMarker} this
     * @fires UIMarker#showstart
     * @fires UIMarker#showend
     */
    show: function () {
        return UIComponent.prototype.show.call(this, this._markerCoord);
    },

    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn: function () {
        var dom;
        if (isString(this.options['content'])) {
            dom = createEl('div');
            dom.innerHTML = this.options['content'];
        } else {
            dom = this.options['content'];
        }
        this._registerDOMEvents(dom);
        return dom;
    },

    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {Point} offset
     */
    getOffset: function () {
        var size = this.getSize();
        return new Point(-size['width'] / 2, -size['height'] / 2);
    },

    /**
     * Gets UIMarker's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin: function () {
        var size = this.getSize();
        return new Point(size['width'] / 2, size['height'] / 2);
    },

    onDomRemove: function () {
        var dom = this.getDOM();
        this._removeDOMEvents(dom);
    },

    _domEvents:
    /**
     * mousedown event
     * @event UIMarker#mousedown
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
         * @event UIMarker#mouseup
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
         * mouseover event
         * @event UIMarker#mouseover
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
         * @event UIMarker#mouseout
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
         * @event UIMarker#mousemove
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
         * @event UIMarker#click
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
         * @event UIMarker#dblclick
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
         * @event UIMarker#contextmenu
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
         * @event UIMarker#keypress
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
         * @event UIMarker#touchstart
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
         * @event UIMarker#touchmove
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
         * @event UIMarker#touchend
         * @type {Object}
         * @property {String} type                    - touchend
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        'touchend',

    _registerDOMEvents: function (dom) {
        on(dom, this._domEvents, this._onDomEvents, this);
    },

    _onDomEvents: function (e) {
        var event = this.getMap()._parseEvent(e, e.type);
        this.fire(e.type, event);
    },

    _removeDOMEvents: function (dom) {
        off(dom, this._domEvents, this._onDomEvents, this);
    }

});

/**
 * Drag handler for UIMarker.
 * @class
 * @category handler
 * @protected
 * @extends {Handler}
 */
class UIMarkerDragHandler extends Handler {

    constructor(target) {
        super(target);
        this.START = Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'];
    }

    addHooks() {
        this.target.on(this.START.join(' '), this._startDrag, this);

    }

    removeHooks() {
        this.target.off(this.START.join(' '), this._startDrag, this);
    }

    _startDrag(param) {
        var domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastPos = param['coordinate'];

        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        /**
         * drag start event
         * @event UIMarker#dragstart
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
            'cancelOn': bind(this._cancelOn, this)
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    }

    _cancelOn(domEvent) {
        var target = domEvent.srcElement || domEvent.target,
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
        var target = this.target,
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
        var currentPos = eventParam['coordinate'];
        if (!this._lastPos) {
            this._lastPos = currentPos;
        }
        var dragOffset = currentPos.substract(this._lastPos);
        this._lastPos = currentPos;
        this.target.setCoordinates(this.target.getCoordinates().add(dragOffset));
        eventParam['dragOffset'] = dragOffset;

        /**
         * dragging event
         * @event UIMarker#dragging
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
        var target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        delete this._lastPos;
        this._isDragging = false;
        if (!map) {
            return;
        }
        var eventParam = map._parseEvent(param['domEvent']);
        /**
         * dragend event
         * @event UIMarker#dragend
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

UIMarker.include(/** @lends UIMarker.prototype */ {
    /**
     * Whether the uimarker is being dragged.
     * @returns {Boolean}
     */
    isDragging: function () {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});

