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
maptalks.DrawTool = maptalks.MapTool.extend(/** @lends maptalks.DrawTool.prototype */{

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
        maptalks.Util.setOptions(this, options);
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
        this._clearStage();
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
            return maptalks.Util.extendSymbol(symbol);
        } else {
            return maptalks.Util.extendSymbol(this.options['symbol']);
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
        this._clearStage();
        this._loadResources();
        return this;
    },

    _checkMode: function () {
        this._getRegisterMode();
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


    _loadResources:function () {
        var symbol = this.getSymbol();
        var resources = maptalks.Util.getExternalResources(symbol);
        if (maptalks.Util.isArrayHasData(resources)) {
            //load external resources at first
            this._drawToolLayer._getRenderer().loadResources(resources);
        }
    },

    _getProjection:function () {
        return this._map.getProjection();
    },

    _getRegisterMode: function () {
        var mode = this.getMode();
        var registerMode = maptalks.DrawTool.getRegisterMode(mode);
        if (!registerMode) {
            throw new Error(mode + ' is not a valid mode of maptalks.DrawTool.');
        }
        return registerMode;
    },

    getEvents: function () {
        var action = this._getRegisterMode()['action'];
        if (action === 'clickDblclick') {
            return {
                'click' : this._clickForPath,
                'mousemove' : this._mousemoveForPath,
                'dblclick'  : this._dblclickForPath
            };
        } else if (action === 'click') {
            return {
                'click' : this._clickForPoint
            };
        } else if (action === 'drag') {
            return {
                'mousedown' : this._mousedownToDraw
            };
        }
        return null;
    },

    _addGeometryToStage:function (geometry) {
        var drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    },

    _clickForPoint: function (param) {
        var registerMode = this._getRegisterMode();
        this._geometry = registerMode['create'](param['coordinate']);
        if (this.options['symbol'] && this.options.hasOwnProperty('symbol')) {
            this._geometry.setSymbol(this.options['symbol']);
        }
        this._endDraw();
    },

    _clickForPath:function (param) {
        var registerMode = this._getRegisterMode();
        var coordinate = param['coordinate'];
        var symbol = this.getSymbol();
        if (!this._geometry) {
            this._clickCoords = [coordinate];
            this._geometry = registerMode['create'](this._clickCoords);
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
            this._clickCoords.push(coordinate);
            registerMode['update'](this._clickCoords, this._geometry);
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
        var coordinate = param['coordinate'];
        var registerMode = this._getRegisterMode();
        var path = this._clickCoords;
        if (path && path.length > 0 && coordinate.equals(path[path.length - 1])) {
            return;
        }
        registerMode['update'](path.concat([coordinate]), this._geometry);
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
        var registerMode = this._getRegisterMode();
        var coordinate = param['coordinate'];
        var path = this._clickCoords;
        path.push(coordinate);
        if (path.length < 2) { return; }
        //去除重复的端点
        var nIndexes = [];
        var i, len;
        for (i = 1, len = path.length; i < len; i++) {
            if (path[i].x === path[i - 1].x && path[i].y === path[i - 1].y) {
                nIndexes.push(i);
            }
        }
        for (i = nIndexes.length - 1; i >= 0; i--) {
            path.splice(nIndexes[i], 1);
        }

        if (path.length < 2 || (this._geometry && (this._geometry instanceof maptalks.Polygon) && path.length < 3)) {
            return;
        }
        registerMode['update'](path, this._geometry);
        this._endDraw(param);
    },

    _mousedownToDraw : function (param) {
        var registerMode = this._getRegisterMode();
        var me = this,
            firstPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(firstPoint)) { return false; }
        var firstCoord = param['coordinate'];

        function genGeometry(coordinate) {
            var symbol = me.getSymbol(),
                geometry = me._geometry;
            if (!geometry) {
                geometry = registerMode['create'](coordinate);
                geometry.setSymbol(symbol);
                me._addGeometryToStage(geometry);
                me._geometry = geometry;
            } else {
                registerMode['update'](coordinate, geometry);
            }
        }
        function onMouseMove(_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(current)) { return false; }
            var coordinate = _event['coordinate'];
            genGeometry(coordinate);
            this._fireEvent('mousemove', param);
            return false;
        }
        var onMouseUp = function (_event) {
            if (!this._geometry) {
                return false;
            }
            var current = this._getMouseContainerPoint(_event);
            if (this._isValidContainerPoint(current)) {
                var coordinate = _event['coordinate'];
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
        if (!this._geometry || this._ending) {
            return;
        }
        this._ending = true;
        var geometry = this._geometry;
        this._clearStage();
        if (!param) {
            param = {};
        }
        this._geometry = geometry;
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
        delete this._geometry;
        if (this.options['once']) {
            this.disable();
        }
        delete this._ending;
    },

    _clearStage: function () {
        this._getDrawLayer().clear();
        delete this._geometry;
        delete this._clickCoords;
    },

    /**
     * Get container point of the mouse event
     * @param  {Event} event -  mouse event
     * @return {maptalks.Point}
     * @private
     */
    _getMouseContainerPoint:function (event) {
        maptalks.DomUtil.stopPropagation(event['domEvent']);
        var result = event['containerPoint'];
        return result;
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
        var drawLayerId = maptalks.internalLayerPrefix + 'drawtool';
        var drawToolLayer = this._map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new maptalks.VectorLayer(drawLayerId, {'enableSimplify' : false});
            this._map.addLayer(drawToolLayer);
        }
        return drawToolLayer;
    },

    _fireEvent:function (eventName, param) {
        if (!param) {
            param = {};
        }
        if (this._geometry) {
            param['geometry'] = this._getRegisterMode()['generate'](this._geometry).copy();
        }
        maptalks.MapTool.prototype._fireEvent.call(this, eventName, param);
    }

});

maptalks.DrawTool.registerMode = function (name, modeAction) {
    if (!maptalks.DrawTool._registeredMode) {
        maptalks.DrawTool._registeredMode = {};
    }
    maptalks.DrawTool._registeredMode[name.toLowerCase()] = modeAction;
};

maptalks.DrawTool.getRegisterMode = function (name) {
    if (maptalks.DrawTool._registeredMode) {
        return maptalks.DrawTool._registeredMode[name.toLowerCase()];
    }
    return null;
};

maptalks.DrawTool.registerMode('circle', {
    'action' : 'drag',
    'geometryClass' : maptalks.Circle,
    'create' : function (coordinate) {
        return new maptalks.Circle(coordinate, 0);
    },
    'update' : function (coordinate, geometry) {
        var map = geometry.getMap();
        var center = geometry.getCenter();
        var radius = map.computeLength(center, coordinate);
        geometry.setRadius(radius);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('ellipse', {
    'action' : 'drag',
    'geometryClass' : maptalks.Ellipse,
    'create' : function (coordinate) {
        return maptalks.Ellipse(coordinate, 0, 0);
    },
    'update' : function (coordinate, geometry) {
        var map = geometry.getMap();
        var center = geometry.getCenter();
        var rx = map.computeLength(center, new maptalks.Coordinate({x:coordinate.x, y:center.y}));
        var ry = map.computeLength(center, new maptalks.Coordinate({x:center.x, y:coordinate.y}));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('rectangle', {
    'action' : 'drag',
    'geometryClass' : maptalks.Rectangle,
    'create' : function (coordinate) {
        var rect = maptalks.Rectangle(coordinate, 0, 0);
        rect._firstClick = coordinate;
        return rect;
    },
    'update' : function (coordinate, geometry) {
        var firstCoord = geometry._firstClick;
        var map = geometry.getMap();
        var width = map.computeLength(firstCoord, new maptalks.Coordinate(coordinate.x, firstCoord.y)),
            height = map.computeLength(firstCoord, new maptalks.Coordinate(firstCoord.x, coordinate.y));
        var cnw = map.coordinateToContainerPoint(firstCoord),
            cc = map.coordinateToContainerPoint(coordinate);
        var x = Math.min(cnw.x, cc.x),
            y = Math.min(cnw.y, cc.y);
        geometry.setCoordinates(map.containerPointToCoordinate(new maptalks.Point(x, y)));
        geometry.setWidth(width);
        geometry.setHeight(height);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('point', {
    'action' : 'click',
    'create' : function (coordinate) {
        return new maptalks.Marker(coordinate);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('polygon', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.LineString(path);
    },
    'update' : function (path, geometry) {
        var symbol = geometry.getSymbol();
        geometry.setCoordinates(path);
        if (path.length >= 3) {
            var layer = geometry.getLayer();
            if (layer) {
                var polygon = layer.getGeometryById('polygon');
                if (!polygon) {
                    polygon = new maptalks.Polygon([path], {
                        'id' : 'polygon'
                    });
                    if (symbol) {
                        var pSymbol = maptalks.Util.extendSymbol(symbol, {'lineOpacity':0});
                        polygon.setSymbol(pSymbol);
                    }
                    polygon.addTo(layer);
                }
                polygon.setCoordinates(path);
            }
        }
    },
    'generate' : function (geometry) {
        return new maptalks.Polygon(geometry.getCoordinates(), {
            'symbol' : geometry.getSymbol()
        });
    }
});

maptalks.DrawTool.registerMode('linestring', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.LineString(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('arccurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.ArcCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('quadbeziercurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.QuadBezierCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});

maptalks.DrawTool.registerMode('cubicbeziercurve', {
    'action' : 'clickDblclick',
    'create' : function (path) {
        return new maptalks.CubicBezierCurve(path);
    },
    'update' : function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate' : function (geometry) {
        return geometry;
    }
});
