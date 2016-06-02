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

    _onDOMRemove: function() {
        var dom = this._getDOM();
        this._removeDOMEvents(dom);
    },

    _getEvents: function () {
        return {
            'zoomstart' : this._onZoomStart,
            'zoomend'   : this._onZoomEnd
        };
    },

    _onZoomStart: function () {
        this.hide();
    },

    _onZoomEnd: function () {
        this.show();
    },

    _registerDOMEvents: function (dom) {
        Z.DomUtil.on(dom, 'mousedown touchstart', this._onDomEvents, this);
    },

    _onDomEvents: function (e) {
        var event = this.getMap()._parseEvent(e, e.type);
        this.fire(e.type, event);
    },

    _removeDOMEvents: function (dom) {
        Z.DomUtil.off(dom, 'mousedown touchstart', this._onDomEvents, this);
    }

});

/**
 * Drag handler for geometries.
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
        this._preCoordDragged = param['coordinate'];
        this._prepareMap();
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

    _prepareMap:function () {
        var map = this.target.getMap();
        this._mapDraggable = map.options['draggable'];
        map.config({
            'draggable' : false
        });
    },

    _prepareDragHandler:function () {
        var map = this.target.getMap();
        this._dragHandler = new Z.Handler.Drag(map._panels.mapWrapper || map._containerDOM);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    },

    _dragging: function (param) {
        var target = this.target;
         var map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']);
        var domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }

        if (!this._moved) {
            this._moved = true;
            this._isDragging = true;
            return;
        }

        var currentCoord = eventParam['coordinate'];
        if (!this._preCoordDragged) {
            this._preCoordDragged = currentCoord;
        }
        var dragOffset = currentCoord.substract(this._preCoordDragged);
        this._preCoordDragged = currentCoord;

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
        if (!map) {
            return;
        }
        var eventParam;
        if (map) {
            eventParam = map._parseEvent(param['domEvent']);
        }

        delete this._preCoordDragged;

        if (Z.Util.isNil(this._mapDraggable)) {
            this._mapDraggable = true;
        }
        map.config({
            'draggable': this._mapDraggable
        });

        delete this._mapDraggable;
        this._isDragging = false;
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
