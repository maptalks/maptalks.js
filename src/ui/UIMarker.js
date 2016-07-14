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
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - construct options
 * @param {Boolean} [options.draggable=false]  - if the marker can be dragged.
 * @param {Number}  [options.single=false]     - if the marker is a global single one.
 * @param {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
 * @memberOf maptalks.ui
 * @name UIMarker
 * @example
 * var dom = document.createElement('div');
 * dom.innerHTML = 'hello ui marker';
 * var marker = new maptalks.ui.UIMarker([0, 0], {
 *      draggable : true,
 *      content : dom
 *  }).addTo(map);
 */
Z.ui.UIMarker = Z.ui.UIComponent.extend(/** @lends maptalks.ui.UIMarker.prototype */{

    includes: [Z.Handlerable],

    /**
     * @property {Object} options - construct options
     * @property {Boolean} [options.draggable=false]  - if the marker can be dragged.
     * @property {Number}  [options.single=false]     - if the marker is a global single one.
     * @property {String|HTMLElement}  options.content - content of the marker, can be a string type HTML code or a HTMLElement.
     */
    options : {
        'draggable': false,
        'single' : false,
        'content' : null
    },

    initialize: function (coordinate, options) {
        this._markerCoord = new Z.Coordinate(coordinate);
        Z.Util.setOptions(this, options);
    },

    /**
     * Sets the coordinates
     * @param {maptalks.Coordinate} coordinates - UIMarker's coordinate
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#positionchange
     */
    setCoordinates: function (coordinates) {
        this._markerCoord = coordinates;
        /**
         * positionchange event.
         *
         * @event maptalks.ui.UIMarker#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {maptalks.ui.UIMarker} target - ui marker
         */
        this.fire('positionchange');
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    /**
     * Gets the coordinates
     * @return {maptalks.Coordinate} coordinates
     */
    getCoordinates: function () {
        return this._markerCoord;
    },

    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#contentchange
     */
    setContent: function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event maptalks.ui.UIMarker#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.ui.UIMarker} target - ui marker
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : content});
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
     * @returns {maptalks.ui.UIMarker} this
     * @fires maptalks.ui.UIMarker#showstart
     * @fires maptalks.ui.UIMarker#showend
     */
    show: function () {
        return Z.ui.UIComponent.prototype.show.call(this, this._markerCoord);
    },

    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {maptalks.Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn: function () {
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

    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {maptalks.Point} offset
     */
    getOffset: function () {
        var size = this.getSize();
        return new Z.Point(-size['width'] / 2, -size['height'] / 2);
    },

    _onDOMRemove: function () {
        var dom = this.getDOM();
        this._removeDOMEvents(dom);
    },

    _domEvents : /**
                  * mousedown event
                  * @event maptalks.ui.UIMarker#mousedown
                  * @type {Object}
                  * @property {String} type                    - mousedown
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
                  * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target.fire('dragstart', param);
    },

    _prepareDragHandler:function () {
        this._dragHandler = new Z.Handler.Drag(this.target.getDOM());
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
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
         * @property {maptalks.ui.UIMarker} target    - the uimarker fires event
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
     * @returns {Boolean}
     */
    isDragging: function () {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});
