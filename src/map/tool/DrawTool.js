/**
 * @classdesc
 * A map tool to help draw geometries on the map
 * @class
 * @category maptool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @param {options} [options=null] - construct options
 */
Z.DrawTool = Z.MapTool.extend(/** @lends maptalks.DrawTool.prototype */{

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
     * 设置绘图模式
     * @param {Number} mode 绘图模式
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
     * 获得drawtool的绘制样式
     * @return {Object} 绘制样式
     * @expose
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
     * 设置drawtool的绘制样式
     * @param {Object} symbol 绘制样式
     * @expose
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

    _onAdd: function () {
        this._checkMode();
    },

    _onEnable:function () {

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

    _onDisable:function () {
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
            this._drawToolLayer._getRenderer()._loadResources(resources, onComplete, this);
        } else {
            onComplete.call(this);
        }

    },

    _getProjection:function () {
        return this._map.getProjection();
    },

    _getEvents: function () {
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
             * drawstart event
             * @event maptalks.DrawTool#drawstart
             * @type {Object}
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

            /**
             * 触发drawvertex事件：端点绘制事件，当为多边形或者多折线绘制了一个新的端点后会触发此事件
             * @event maptalks.DrawTool#drawvertex
             * @type {Object}
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
        param['geometry'] = this._geometry;
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
        var me = this;
        function genGeometry(coordinate) {
            var symbol = me.getSymbol();
            var geometry = me._geometry;
            var _map = me._map;
            var center;
            switch (me.getMode()) {
            case 'circle':
                if (!geometry) {
                    geometry = new Z.Circle(coordinate, 0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                center = geometry.getCenter();
                var radius = _map.computeLength(center, coordinate);
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
                var rx = _map.computeLength(center, new Z.Coordinate({x:coordinate.x, y:center.y}));
                var ry = _map.computeLength(center, new Z.Coordinate({x:center.x, y:coordinate.y}));
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
                var nw = geometry.getCoordinates();
                var width = _map.computeLength(nw, new Z.Coordinate({x:coordinate.x, y:nw.y}));
                var height = _map.computeLength(nw, new Z.Coordinate({x:nw.x, y:coordinate.y}));
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
            var containerPoint = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(containerPoint)) { return false; }
            var coordinate = this._containerPointToLonlat(containerPoint);
            genGeometry(coordinate);
            return false;
        }
        var onMouseUp = function (_event) {
            if (!this._geometry) {
                return false;
            }
            var containerPoint = this._getMouseContainerPoint(_event);
            if (this._isValidContainerPoint(containerPoint)) {
                var coordinate = this._containerPointToLonlat(containerPoint);
                genGeometry(coordinate);
            }
            this._map.off('mousemove', onMouseMove, this);
            this._map.off('mouseup', onMouseUp, this);
            this._endDraw(param);
            return false;
        };
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) { return false; }
        var coordinate = this._containerPointToLonlat(containerPoint);
        this._fireEvent('drawstart', param);
        genGeometry(coordinate);
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
           * 绘制结束事件
           * @event maptalks.DrawTool#drawend
           * @type {Object}
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
