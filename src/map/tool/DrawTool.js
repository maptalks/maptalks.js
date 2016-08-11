/**
 * @classdesc
 * A map tool to help draw geometries
 * @class
 * @category maptool
 * @extends maptalks.MapTool
 * @mixins maptalks.Eventable
 * @param {Object} [options=null] - construct options
 * @param {String} [options.mode=null]   - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
 * @param {Object} [options.symbol=null] - symbol of the geometries drawn
 * @param {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
 * @example
 * var drawTool = new maptalks.DrawTool({
 *     mode : 'Polygon',
 *     symbol : {
 *         'lineColor' : '#000',
 *         'lineWidth' : 5
 *     },
 *     once : true
 * }).addTo(map);
 */
Z.DrawTool = Z.MapTool.extend(/** @lends maptalks.DrawTool.prototype */{

    /**
     * @property {Object} [options=null] - construct options
     * @property {String} [options.mode=null]   - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
     * @property {Object} [options.symbol=null] - symbol of the geometries drawn
     * @property {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
     */
    options:{
        'symbol' : {
            'lineColor':'#000',
            'lineWidth':2,
            'lineOpacity':1,
            'polygonFill' : '#fff',
            'polygonOpacity' : 0.3
        },
        'mode' : null,
        'once' : false
    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
        this._checkMode();
    },

    /**
     * Get current mode of draw tool
     * @return {String} mode
     */
    getMode: function () {
        if (this.options['mode']) {
            return this.options['mode'].toLowerCase();
        }
        return null;
    },

    /**
     * Set mode of the draw tool
     * @param {String} mode - mode of the draw tool: Point, LineString, Polygon, Circle, Ellipse, Rectangle
     * @expose
     */
    setMode:function (mode) {
        if (this._geometry) {
            this._geometry.remove();
            delete this._geometry;
        }
        this._switchEvents('off');
        this.options['mode'] = mode;
        this._checkMode();
        if (this.isEnabled()) {
            this._switchEvents('on');
        }
        return this;
    },

    /**
     * Get symbol of the draw tool
     * @return {Object} symbol
     */
    getSymbol:function () {
        var symbol = this.options['symbol'];
        if (symbol) {
            return Z.Util.extendSymbol(symbol);
        } else {
            return Z.Util.extendSymbol(this.options['symbol']);
        }
    },

    /**
     * Set draw tool's symbol
     * @param {Object} symbol - symbol set
     * @returns {maptalks.DrawTool} this
     */
    setSymbol:function (symbol) {
        if (!symbol) {
            return this;
        }
        this.options['symbol'] = symbol;
        if (this._geometry) {
            this._geometry.setSymbol(symbol);
        }
        return this;
    },

    onAdd: function () {
        this._checkMode();
    },

    onEnable:function () {

        var map = this.getMap();
        this._mapDraggable = map.options['draggable'];
        this._mapDoubleClickZoom = map.options['doubleClickZoom'];
        this._autoBorderPanning = map.options['autoBorderPanning'];
        map.config({
            'autoBorderPanning' : true,
            'draggable': false,
            'doubleClickZoom':false
        });
        this._drawToolLayer = this._getDrawLayer();
        return this;
    },

    _checkMode: function () {
        var mode = this.getMode();
        if (!mode) {
            throw new Error('drawtool\'s mode is null.');
        }
        var modes = ['circle', 'ellipse', 'rectangle', 'point', 'linestring', 'polygon'];
        for (var i = 0; i < modes.length; i++) {
            if (mode === modes[i]) {
                return true;
            }
        }
        throw new Error('invalid mode for drawtool : ' + this.options['mode']);
    },

    onDisable:function () {
        var map = this.getMap();
        map.config({
            'autoBorderPanning' : this._autoBorderPanning,
            'draggable': this._mapDraggable,
            'doubleClickZoom' : this._mapDoubleClickZoom
        });
        delete this._autoBorderPanning;
        delete this._mapDraggable;
        delete this._mapDoubleClickZoom;
        this._endDraw();
        map.removeLayer(this._getDrawLayer());
        return this;
    },

    _loadResources:function (onComplete) {
        var symbol = this.getSymbol();
        var resources = Z.Util.getExternalResources(symbol);
        if (Z.Util.isArrayHasData(resources)) {
            //load external resources at first
            this._drawToolLayer._getRenderer().loadResources(resources).then(Z.Util.bind(onComplete, this));
        } else {
            onComplete.call(this);
        }

    },

    _getProjection:function () {
        return this._map.getProjection();
    },

    getEvents: function () {
        var mode = this.getMode();
        if (mode === 'polygon' || mode === 'linestring') {
            return {
                'click' : this._clickForPath,
                'mousemove' : this._mousemoveForPath,
                'dblclick'  : this._dblclickForPath
            };
        } else if (mode === 'point') {
            return {
                'click' : this._clickForPoint
            };
        } else {
            return {
                'mousedown' : this._mousedownToDraw
            };
        }
    },

    _addGeometryToStage:function (geometry) {
        var drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    },

    _clickForPoint: function (param) {
        var geometry = new Z.Marker(param['coordinate']);
        if (this.options['symbol'] && this.options.hasOwnProperty('symbol')) {
            geometry.setSymbol(this.options['symbol']);
        }
        this._geometry = geometry;
        this._endDraw();
    },

    _clickForPath:function (param) {
        var containerPoint = this._getMouseContainerPoint(param);
        var coordinate = this._containerPointToLonlat(containerPoint);
        var symbol = this.getSymbol();
        if (!this._geometry) {
            //无论画线还是多边形, 都是从线开始的
            this._geometry = new Z.Polyline([coordinate]);

            if (symbol) {
                this._geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this._geometry);
            /**
             * drawstart event.
             *
             * @event maptalks.DrawTool#drawstart
             * @type {Object}
             * @property {String} type - drawstart
             * @property {maptalks.DrawTool} target - draw tool
             * @property {maptalks.Coordinate} coordinate - coordinate of the event
             * @property {maptalks.Point} containerPoint  - container point of the event
             * @property {maptalks.Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawstart', param);
        } else {
            var path = this._getLonlats();
            path.push(coordinate);
            if (this.getMode() === 'polygon' && path.length === 3) {
                var polygon = new Z.Polygon([path]);
                if (symbol) {
                    var pSymbol = Z.Util.extendSymbol(symbol, {'lineOpacity':0});
                    polygon.setSymbol(pSymbol);
                }
                this._polygon = polygon;
                this._addGeometryToStage(polygon);

            }
                //这一行代码取消注释后, 会造成dblclick无法响应, 可能是存在循环调用,造成浏览器无法正常响应事件
            this._setLonlats(path);
            param['geometry'] = this.getMode() === 'polygon' ? path.length >= 3 ? new Z.Polygon(path) : new Z.LineString(path) : new Z.LineString(path);
            /**
             * drawvertex event.
             *
             * @event maptalks.DrawTool#drawvertex
             * @type {Object}
             * @property {String} type - drawvertex
             * @property {maptalks.DrawTool} target - draw tool
             * @property {maptalks.Geometry} geometry - geometry drawn
             * @property {maptalks.Coordinate} coordinate - coordinate of the event
             * @property {maptalks.Point} containerPoint  - container point of the event
             * @property {maptalks.Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawvertex', param);

        }
    },

    _mousemoveForPath : function (param) {
        if (!this._geometry) { return; }
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) { return; }
        var coordinate = this._containerPointToLonlat(containerPoint);

        var path = this._getLonlats();
        var tailPath = [path[path.length - 1], coordinate];
        if (!this._movingTail) {
            var symbol = Z.Util.decreaseSymbolOpacity(this.getSymbol(), 0.5);
            this._movingTail = new Z.LineString(tailPath, {
                'symbol' : symbol
            });
            this._addGeometryToStage(this._movingTail);
        } else {
            this._movingTail.setCoordinates(tailPath);
        }
        path = path.concat([coordinate]);
        param['geometry'] = this.getMode() === 'polygon' ? path.length >= 3 ? new Z.Polygon(path) : new Z.LineString(path) : new Z.LineString(path);
        /**
         * mousemove event.
         *
         * @event maptalks.DrawTool#mousemove
         * @type {Object}
         * @property {String} type - mousemove
         * @property {maptalks.DrawTool} target - draw tool
         * @property {maptalks.Geometry} geometry - geometry drawn
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mousemove', param);
    },

    _dblclickForPath:function (param) {
        if (!this._geometry) { return; }
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) { return; }
        var coordinate = this._containerPointToLonlat(containerPoint);
        var path = this._getLonlats();
        path.push(coordinate);
        if (path.length < 2) { return; }
        //去除重复的端点
        var nIndexes = [],
            mode = this.getMode();
        var i, len;
        for (i = 1, len = path.length; i < len; i++) {
            if (path[i].x === path[i - 1].x && path[i].y === path[i - 1].y) {
                nIndexes.push(i);
            }
        }
        for (i = nIndexes.length - 1; i >= 0; i--) {
            path.splice(nIndexes[i], 1);
        }

        if (path.length < 2 || (mode === 'polygon' && path.length < 3)) {
            return;
        }
        this._geometry.remove();
        if (this._movingTail) {
            this._movingTail.remove();
        }
        delete this._movingTail;
        if (this._polygon) {
            this._polygon.remove();
        }
        if (mode === 'polygon') {
            this._geometry = new Z.Polygon([path]);
            var symbol = this.getSymbol();
            if (symbol) {
                this._geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this._geometry);
        } else {
            this._geometry.setCoordinates(path);
        }
        this._endDraw(param);
    },

    _mousedownToDraw : function (param) {
        var me = this,
            firstPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(firstPoint)) { return false; }
        var firstCoord = this._containerPointToLonlat(firstPoint);

        function genGeometry(coordinate) {
            var symbol = me.getSymbol(),
                geometry = me._geometry,
                map = me._map,
                center;

            switch (me.getMode()) {
            case 'circle':
                if (!geometry) {
                    geometry = new Z.Circle(coordinate, 0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                center = geometry.getCenter();
                var radius = map.computeLength(center, coordinate);
                geometry.setRadius(radius);
                break;
            case 'ellipse':
                if (!geometry) {
                    geometry = new Z.Ellipse(coordinate, 0, 0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                center = geometry.getCenter();
                var rx = map.computeLength(center, new Z.Coordinate({x:coordinate.x, y:center.y}));
                var ry = map.computeLength(center, new Z.Coordinate({x:center.x, y:coordinate.y}));
                geometry.setWidth(rx * 2);
                geometry.setHeight(ry * 2);
                break;
            case 'rectangle':
                if (!geometry) {
                    geometry = new Z.Rectangle(coordinate, 0, 0);

                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                var width = map.computeLength(firstCoord, new Z.Coordinate(coordinate.x, firstCoord.y)),
                    height = map.computeLength(firstCoord, new Z.Coordinate(firstCoord.x, coordinate.y));
                var cnw = map.coordinateToContainerPoint(firstCoord),
                    cc = map.coordinateToContainerPoint(coordinate);
                var x = Math.min(cnw.x, cc.x),
                    y = Math.min(cnw.y, cc.y);
                geometry.setCoordinates(map.containerPointToCoordinate(new Z.Point(x, y)));
                geometry.setWidth(width);
                geometry.setHeight(height);
                break;
            }
            me._geometry = geometry;

        }
        function onMouseMove(_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(current)) { return false; }
            var coordinate = this._containerPointToLonlat(current);
            genGeometry(coordinate);
            param['geometry'] = this._geometry;
            this._fireEvent('mousemove', param);
            return false;
        }
        var onMouseUp = function (_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (this._isValidContainerPoint(current)) {
                var coordinate = this._containerPointToLonlat(current);
                genGeometry(coordinate);
            }
            this._map.off('mousemove', onMouseMove, this);
            this._map.off('mouseup', onMouseUp, this);
            this._endDraw(param);
            return false;
        };

        this._fireEvent('drawstart', param);
        genGeometry(firstCoord);
        this._map.on('mousemove', onMouseMove, this);
        this._map.on('mouseup', onMouseUp, this);
        return false;
    },

    _endDraw: function (param) {
        if (!this._geometry) {
            return;
        }
        var target = this._geometry.copy();
        this._geometry.remove();
        delete this._geometry;
        if (!param) {
            param = {};
        }
        param['geometry'] = target;
        /**
         * drawend event.
         *
         * @event maptalks.DrawTool#drawend
         * @type {Object}
         * @property {String} type - drawend
         * @property {maptalks.DrawTool} target - draw tool
         * @property {maptalks.Geometry} geometry - geometry drawn
         * @property {maptalks.Coordinate} coordinate - coordinate of the event
         * @property {maptalks.Point} containerPoint  - container point of the event
         * @property {maptalks.Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('drawend', param);
        if (this.options['once']) {
            this.disable();
        }
    },

    /**
     * Get coordinates of polyline or polygon
     * @private
     */
    _getLonlats:function () {
        if (this._geometry.getShell) {
            return this._geometry.getShell();
        }
        return this._geometry.getCoordinates();
    },

    _setLonlats:function (lonlats) {
        if (this._geometry instanceof Z.Polygon) {
            this._geometry.setCoordinates([lonlats]);

        } else if (this._geometry instanceof Z.Polyline) {
            this._geometry.setCoordinates(lonlats);
        }
        if (this._polygon) {
            this._polygon.setCoordinates([lonlats]);
        }
    },

    /**
     * Get container point of the mouse event
     * @param  {Event} event -  mouse event
     * @return {maptalks.Point}
     * @private
     */
    _getMouseContainerPoint:function (event) {
        Z.DomUtil.stopPropagation(event['domEvent']);
        var result = event['containerPoint'];
        return result;
    },

    /**
     * Convert a containerPoint to a coordinates
     * @param  {maptalks.Point} containerPoint - container point
     * @return {maptalks.Coordinate}
     * @private
     */
    _containerPointToLonlat:function (containerPoint) {
        var projection = this._getProjection(),
            map = this._map;

        //projected pLonlat
        var pLonlat = map._containerPointToPrj(containerPoint);
        return projection.unproject(pLonlat);
    },

    _isValidContainerPoint:function (containerPoint) {
        var mapSize = this._map.getSize();
        var w = mapSize['width'],
            h = mapSize['height'];
        if (containerPoint.x < 0 || containerPoint.y < 0) {
            return false;
        } else if (containerPoint.x > w || containerPoint.y > h) {
            return false;
        }
        return true;
    },

    _getDrawLayer:function () {
        var drawLayerId = Z.internalLayerPrefix + 'drawtool';
        var drawToolLayer = this._map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new Z.VectorLayer(drawLayerId, {'drawImmediate' : true});
            this._map.addLayer(drawToolLayer);
        }
        return drawToolLayer;
    },

    _fireEvent:function (eventName, param) {
        if (!param) {
            param = {};
        }
        if (!param['geometry'] && this._geometry) {
            param['geometry'] = this._geometry;
        }
        Z.MapTool.prototype._fireEvent.call(this, eventName, param);
    }

});
