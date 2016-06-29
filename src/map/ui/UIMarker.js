/**
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate.
 *
 * As it's an actual html element, it:
 * 1. always on the top of all the map layers
 * 2. can't be snapped as it's not drawn on the canvas.
 *
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - construct options
 * @memberOf maptalks.ui
 * @name UIMarker
 */
Z.ui.UIMarker = Z.ui.UIComponent.extend(/** @lends maptalks.ui.UIMarker.prototype */{

    includes: [Z.Handlerable],

    options : {
        'draggable': false,
        'single' : false,
        'content' : null
    },

    initialize: function (coordinate, options) {
        this._markerCoord = new Z.Coordinate(coordinate);
        Z.Util.setOptions(this, options);
    },

    setCoordinates: function (coordinates) {
        this._markerCoord = coordinates;
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    getCoordinates: function () {
        return this._markerCoord;
    },

    setContent: function (content) {
        this.options['content'] = content;
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    getContent: function () {
        return this.options['content'];
    },

    show: function (coordinates) {
        return Z.ui.UIComponent.prototype.show.call(this, coordinates || this._markerCoord);
    },

    _getDomOffset: function () {
        var size = this.getSize();
        return new Z.Point(-size['width'] / 2, -size['height'] / 2);
    },

    _createDOM: function () {
        var dom;
        if (Z.Util.isString(this.options['content'])) {
            dom = Z.DomUtil.createEl('div');
            dom.innerHTML = this.options['content'];
        } else {
            dom = this.options['content'];
        }
        this._registerDOMEvents(dom);
        return dom;
    },

    _onDOMRemove: function () {
        var dom = this._getDOM();
        this._removeDOMEvents(dom);
    },

    _domEvents : /**
                  * mousedown event
                  * @event maptalks.ui.UIMarker#mousedown
                  * @type {Object}
                  * @property {String} type                    - mousedown
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mousedown ' +
                 /**
                  * mouseup event
                  * @event maptalks.ui.UIMarker#mouseup
                  * @type {Object}
                  * @property {String} type                    - mouseup
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseup ' +
                 /**
                  * mouseover event
                  * @event maptalks.ui.UIMarker#mouseover
                  * @type {Object}
                  * @property {String} type                    - mouseover
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseover ' +
                 /**
                  * mouseout event
                  * @event maptalks.ui.UIMarker#mouseout
                  * @type {Object}
                  * @property {String} type                    - mouseout
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mouseout ' +
                 /**
                  * mousemove event
                  * @event maptalks.ui.UIMarker#mousemove
                  * @type {Object}
                  * @property {String} type                    - mousemove
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'mousemove ' +
                 /**
                  * click event
                  * @event maptalks.ui.UIMarker#click
                  * @type {Object}
                  * @property {String} type                    - click
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'click ' +
                 /**
                  * dblclick event
                  * @event maptalks.ui.UIMarker#dblclick
                  * @type {Object}
                  * @property {String} type                    - dblclick
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'dblclick ' +
                 /**
                  * contextmenu event
                  * @event maptalks.ui.UIMarker#contextmenu
                  * @type {Object}
                  * @property {String} type                    - contextmenu
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'contextmenu ' +
                 /**
                  * keypress event
                  * @event maptalks.ui.UIMarker#keypress
                  * @type {Object}
                  * @property {String} type                    - keypress
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'keypress ' +
                 /**
                  * touchstart event
                  * @event maptalks.ui.UIMarker#touchstart
                  * @type {Object}
                  * @property {String} type                    - touchstart
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchstart ' +
                 /**
                  * touchmove event
                  * @event maptalks.ui.UIMarker#touchmove
                  * @type {Object}
                  * @property {String} type                    - touchmove
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchmove ' +
                 /**
                  * touchend event
                  * @event maptalks.ui.UIMarker#touchend
                  * @type {Object}
                  * @property {String} type                    - touchend
                  * @property {String} target                  - the map fires event
                  * @property {maptalks.Coordinate} coordinate - coordinate of the event
                  * @property {maptalks.Point} containerPoint  - container point of the event
                  * @property {maptalks.Point} viewPoint       - view point of the event
                  * @property {Event} domEvent                 - dom event
                  */
                 'touchend',

    _registerDOMEvents: function (dom) {
        Z.DomUtil.on(dom, this._domEvents, this._onDomEvents, this);
    },

    _onDomEvents: function (e) {
        var event = this.getMap()._parseEvent(e, e.type);
        this.fire(e.type, event);
    },

    _removeDOMEvents: function (dom) {
        Z.DomUtil.off(dom, this._domEvents, this._onDomEvents, this);
    }

});

/**
 * Drag handler for maptalks.ui.UIMarker.
 * @class
 * @category handler
 * @protected
 * @extends {maptalks.Handler}
 */
Z.ui.UIMarker.Drag = Z.Handler.extend(/** @lends maptalks.ui.UIMarker.Drag.prototype */{

    START: Z.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],

    addHooks: function () {
        this.target.on(this.START.join(' '), this._startDrag, this);

    },

    removeHooks: function () {
        this.target.off(this.START.join(' '), this._startDrag, this);
    },

    _startDrag: function (param) {
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
         * @event maptalks.ui.UIMarker#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {String} target                  - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target.fire('dragstart', param);
    },

    _prepareDragHandler:function () {
        this._dragHandler = new Z.Handler.Drag(this.target._getDOM());
        this._dragHandler.on('mousedown', this._onMouseDown, this);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    },

    _onMouseDown: function (param) {
        Z.DomUtil.stopPropagation(param['domEvent']);
    },

    _dragging: function (param) {
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
         * @event maptalks.ui.UIMarker#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {String} target                  - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragging', eventParam);

    },

    _endDrag: function (param) {
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
         * @event maptalks.ui.UIMarker#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {String} target                  - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragend', eventParam);

    },

    isDragging:function () {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }
});

Z.ui.UIMarker.addInitHook('addHandler', 'draggable', Z.ui.UIMarker.Drag);

Z.ui.UIMarker.include(/** @lends maptalks.ui.UIMarker.prototype */{
    /**
     * Whether the uimarker is being dragged.
     * @reutrn {Boolean}
     */
    isDragging: function () {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});
