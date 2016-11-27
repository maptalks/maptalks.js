maptalks.Geometry.mergeOptions({

    'draggable': false,

    'dragShadow' : true,

    'dragOnAxis' : null
});

/**
 * Drag handler for geometries.
 * @class
 * @category handler
 * @protected
 * @extends {maptalks.Handler}
 */
maptalks.Geometry.Drag = maptalks.Handler.extend(/** @lends maptalks.Geometry.Drag.prototype */{
    dragStageLayerId : maptalks.internalLayerPrefix + '_drag_stage',

    START: maptalks.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],

    addHooks: function () {
        this.target.on(this.START.join(' '), this._startDrag, this);

    },
    removeHooks: function () {
        this.target.off(this.START.join(' '), this._startDrag, this);

    },

    _startDrag: function (param) {
        var map = this.target.getMap();
        if (!map) {
            return;
        }
        var parent = this.target._getParent();
        if (parent) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        var domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastPos = param['coordinate'];
        this._prepareMap();
        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        this._moved = false;
        /**
         * drag start event
         * @event maptalks.Geometry#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target._fireEvent('dragstart', param);
    },

    _prepareMap:function () {
        var map = this.target.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapHitDetect = map.options['hitDetect'];
        map._trySetCursor('move');
        map.config({
            'hitDetect' : false,
            'draggable' : false
        });
    },

    _prepareDragHandler:function () {
        var map = this.target.getMap();
        this._dragHandler = new maptalks.Handler.Drag(map._panels.mapWrapper || map._containerDOM);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    },

    _prepareShadow:function () {
        var target = this.target;
        this._prepareDragStageLayer();
        if (this._shadow) {
            this._shadow.remove();
        }

        this._shadow = target.copy();
        this._shadow.setSymbol(target._getInternalSymbol());
        var shadow = this._shadow;
        if (target.options['dragShadow']) {
            var symbol = maptalks.Util.decreaseSymbolOpacity(shadow._getInternalSymbol(), 0.5);
            shadow.setSymbol(symbol);
        }
        shadow.setId(null);
        //copy connectors
        var shadowConnectors = [];
        if (maptalks.ConnectorLine._hasConnectors(target)) {
            var connectors = maptalks.ConnectorLine._getConnectors(target);

            for (var i = 0; i < connectors.length; i++) {
                var targetConn = connectors[i];
                var connOptions = targetConn.config(),
                    connSymbol = targetConn._getInternalSymbol();
                connOptions['symbol'] = connSymbol;
                var conn;
                if (targetConn.getConnectSource() === target) {
                    conn = new maptalks.ConnectorLine(shadow, targetConn.getConnectTarget(), connOptions);
                } else {
                    conn = new maptalks.ConnectorLine(targetConn.getConnectSource(), shadow, connOptions);
                }
                shadowConnectors.push(conn);
            }
        }
        this._shadowConnectors = shadowConnectors;
        this._dragStageLayer.bringToFront().addGeometry(shadowConnectors.concat(shadow));
    },

    _onTargetUpdated:function () {
        if (this._shadow) {
            this._shadow.setSymbol(this.target.getSymbol());
        }
    },

    _prepareDragStageLayer:function () {
        var map = this.target.getMap(),
            layer = this.target.getLayer();
        this._dragStageLayer = map.getLayer(this.dragStageLayerId);
        if (!this._dragStageLayer) {
            this._dragStageLayer = new maptalks.VectorLayer(this.dragStageLayerId, {'drawImmediate' : true});
            map.addLayer(this._dragStageLayer);
        }
        //copy resources to avoid repeat resource loading.
        this._dragStageLayer._getRenderer()._resources = layer._getRenderer()._resources;
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
            target.on('symbolchange', this._onTargetUpdated, this);
            // this._prepareMap();
            this._isDragging = true;
            this._prepareShadow();
            if (!target.options['dragShadow']) {
                target.hide();
            }
            this._shadow._fireEvent('dragstart', eventParam);
            return;
        }
        if (!this._shadow) {
            return;
        }
        var axis = this._shadow.options['dragOnAxis'];
        var currentPos = eventParam['coordinate'];
        if (!this._lastPos) {
            this._lastPos = currentPos;
        }
        var dragOffset = currentPos.substract(this._lastPos);
        if (axis === 'x') {
            dragOffset.y = 0;
        } else if (axis === 'y') {
            dragOffset.x = 0;
        }
        this._lastPos = currentPos;
        this._shadow.translate(dragOffset);
        if (!target.options['dragShadow']) {
            target.translate(dragOffset);
        }
        eventParam['dragOffset'] = dragOffset;
        this._shadow._fireEvent('dragging', eventParam);

        /**
         * dragging event
         * @event maptalks.Geometry#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragging', eventParam);

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
        target.off('symbolchange', this._onTargetUpdated, this);

        if (!target.options['dragShadow']) {
            target.show();
        }
        var shadow = this._shadow;
        if (shadow) {
            if (target.options['dragShadow']) {
                target.setCoordinates(shadow.getCoordinates());
            }
            shadow._fireEvent('dragend', eventParam);
            shadow.remove();
            delete this._shadow;
        }
        if (this._shadowConnectors) {
            map.getLayer(this.dragStageLayerId).removeGeometry(this._shadowConnectors);
            delete this._shadowConnectors;
        }
        delete this._lastPos;

        //restore map status
        map._trySetCursor('default');
        if (maptalks.Util.isNil(this._mapDraggable)) {
            this._mapDraggable = true;
        }
        map.config({
            'hitDetect': this._mapHitDetect,
            'draggable': this._mapDraggable
        });

        delete this._autoBorderPanning;
        delete this._mapDraggable;
        this._isDragging = false;
        /**
         * dragend event
         * @event maptalks.Geometry#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {maptalks.Geometry} target       - the geometry fires event
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target._fireEvent('dragend', eventParam);

    },

    isDragging:function () {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }


});

maptalks.Geometry.addInitHook('addHandler', 'draggable', maptalks.Geometry.Drag);

maptalks.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Whether the geometry is being dragged.
     * @reutrn {Boolean}
     */
    isDragging: function () {
        if (this._getParent()) {
            return this._getParent().isDragging();
        }
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }
});
