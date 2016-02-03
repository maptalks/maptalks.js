/**
 * 测距鼠标工具类
 * @class maptalks.DrawTool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.DrawTool = Z.Class.extend({
    includes: [Z.Eventable],

    /**
     * 初始化绘制工具
     * @constructor
     * @param {Object} options:{mode:Z.Geometry.TYPE_CIRCLE, disableOnDrawEnd: true}
     */
    initialize: function(options) {
        Z.Util.extend(this, options);
        return this;
    },
    /**
     * 默认的线型
     * @type {Object}
     */
    defaultStrokeSymbol: {
        'lineColor':'#474cf8',
        'lineWidth':2,
        'lineOpacity':1,
        'lineDasharray': '',
        'polygonFill' : '#ffffff',
        'polygonOpacity' : 1
    },

    /**
     * 将绘图工具添加到map上
     * @param {maptalks.Map} map
     */
    addTo: function(map) {
        this.map = map;
        if (!this.map) {return;}
        if (map._drawTool && map._drawTool instanceof Z.DrawTool) {
            map._drawTool.disable();
        }
        this.enable();
        map._drawTool = this;
        return this;
    },

    /**
     * 激活
     * @expose
     */
    enable:function() {
        var map = this.map;
        if (!map || this._enabled) {return;}
        this._enabled = true;
        this._mapDraggable = map.options['draggable'];
        this._mapDoubleClickZoom = map.options['doubleClickZoom'];
        this._autoBorderPanning = map.options['autoBorderPanning'];
        map.config({
            'autoBorderPanning' : true,
            'draggable': false,
            'doubleClickZoom':false
        });
        this.drawToolLayer = this._getDrawLayer();
        this._clearEvents();
        this._prepare(this._registerEvents);
        // this._registerEvents();
        return this;
    },

    _prepare:function(onComplete) {
        var symbol = this.getSymbol();
        var resources = Z.Geometry.getExternalResource(symbol);
        if (Z.Util.isArrayHasData(resources)) {
            //load external resources at first
            this.drawToolLayer._getRenderer()._loadResources(resources, onComplete, this);
        } else {
            onComplete.call(this);
        }

    },

    /**
     * 停止激活
     * @expose
     */
    disable:function() {
        if (!this._enabled || !this.map) {
            return;
        }
        this._enabled = false;
        var map = this.map;
        if (!map) {return;}
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
        this._clearEvents();
        return this;
    },

    /**
     * 设置绘图模式
     * @param {Number} mode 绘图模式
     * @expose
     */
    setMode:function(mode) {
        if (this.geometry) {
            this.geometry.remove();
            delete this.geometry;
        }
        this.mode = mode;
        this._clearEvents();
        this._registerEvents();
    },

    /**
     * 获得drawtool的绘制样式
     * @return {Object} 绘制样式
     * @expose
     */
    getSymbol:function() {
        var symbol = this.symbol;
        if(symbol) {
            return this.symbol;
        } else {
            return this.defaultStrokeSymbol;
        }
    },

    /**
     * 设置drawtool的绘制样式
     * @param {Object} symbol 绘制样式
     * @expose
     */
    setSymbol:function(symbol) {
        if (!symbol) {
            return;
        }
        this.symbol = symbol;
        if (this.geometry) {
            this.geometry.setSymbol(symbol);
        }
    },

    _getProjection:function() {
        return this.map.getProjection();
    },

    //注册鼠标响应事件
    _registerEvents: function() {
        var map = this.map;
        var mode = this.mode;
        if (Z.Util.isNil(mode)) {
            mode = Z.Geometry['TYPE_CIRCLE'];
        }
        if (Z.Geometry['TYPE_POLYGON'] == mode || Z.Geometry['TYPE_LINESTRING'] == mode) {
            map.on('click',this._clickForPath, this);
            map.on('mousemove',this._mousemoveForPath,this);
            map.on('dblclick',this._dblclickForPath,this);
        } else if (Z.Geometry['TYPE_POINT'] == mode) {
            map.on('click',this._clickForPoint, this);
        } else {
            map.on('mousedown',this._mousedownToDraw, this);
        }
    },

    _clearEvents: function() {
        var map = this.map;
        map.off('click',this._clickForPath, this);
        map.off('click',this._clickForPoint, this);
        map.off('mousemove',this._mousemoveForPath,this);
        map.off('dblclick',this._dblclickForPath,this);
        map.off('mousedown',this._mousedownToDraw,this);
    },

    _addGeometryToStage:function(geometry) {
        var drawLayer = this._getDrawLayer();
        geometry._isRenderImmediate(true);
        drawLayer.addGeometry(geometry);
    },

    _clickForPoint: function(param) {
        var geometry = new Z.Marker(param['coordinate']);
        if (this.symbol) {
            geometry.setSymbol(this.symbol);
        }
        param['geometry'] = geometry;
        /**
         * 触发 drawstart 事件
         * @event drawstart
         * @return {Object} params: {'coordinate':coordinate, 'pixel':containerPoint};
         */
        this._fireEvent('drawend', param);
    },

    _clickForPath:function(param) {
        var containerPoint = this._getMouseContainerPoint(param);
        var coordinate = this._containerPointToLonlat(containerPoint);
        var symbol = this.getSymbol();
        if (!this.geometry) {
            //无论画线还是多边形, 都是从线开始的
            this.geometry = new Z.Polyline([coordinate]);

            if (symbol) {
                this.geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this.geometry);
            /**
             * 触发 drawstart 事件
             * @event drawstart
             * @return {Object} params: {'coordinate':coordinate, 'pixel':containerPoint};
             */
            this._fireEvent('drawstart', param);
        } else {
            var path = this._getLonlats();
            path.push(coordinate);
            if (Z.Geometry['TYPE_POLYGON'] == this.mode && path.length === 3) {
                var polygon = new Z.Polygon([path]);
                if (symbol) {
                    var pSymbol = Z.Util.extend({},symbol,{'lineOpacity':0});
                    polygon.setSymbol(pSymbol);
                }
                this._polygon = polygon;
                this._addGeometryToStage(polygon);

            }
                //这一行代码取消注释后, 会造成dblclick无法响应, 可能是存在循环调用,造成浏览器无法正常响应事件
            this._setLonlats(path);
            if (this.map.hasListeners('drawvertex')) {
                /**
                 * 触发drawvertex事件：端点绘制事件，当为多边形或者多折线绘制了一个新的端点后会触发此事件
                 * @event drawvertex
                 * @return {Object} params: {'target': this, 'coordinate':coordinate, 'pixel':containerPoint};
                 */
                this._fireEvent('drawvertex',param);
            }
        }
    },

    _mousemoveForPath : function(param) {
        if (!this.geometry) {return;}
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) {return;}
        var coordinate = this._containerPointToLonlat(containerPoint);

        var path = this._getLonlats();
        var tailPath = [path[path.length-1], coordinate];
        if (!this._movingTail) {
            var symbol = this.getSymbol();
            this._movingTail = new Z.LineString(tailPath,{
                'symbol' : symbol
            });
            this._addGeometryToStage(this._movingTail);
        } else {
            this._movingTail.setCoordinates(tailPath);
        }
    },

    _dblclickForPath:function(param) {
        if (!this.geometry) {return;}
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) {return;}
        var coordinate = this._containerPointToLonlat(containerPoint);
        var path = this._getLonlats();
        path.push(coordinate);
        if (path.length < 2) {return;}
        //去除重复的端点
        var nIndexes = [];
        var i, len;
        for (i=1,len=path.length;i<len;i++) {
            if (path[i].x === path[i-1].x && path[i].y === path[i-1].y) {
                nIndexes.push(i);
            }
        }
        for (i=nIndexes.length-1;i>=0;i--) {
            path.splice(nIndexes[i],1);
        }

        if (path.length < 2 || (Z.Geometry['TYPE_POLYGON'] == this.mode && path.length < 3)) {
            return;
        }
        this.geometry.remove();
        if (this._movingTail) {
            this._movingTail.remove();
        }
        delete this._movingTail;
        if (this._polygon) {
            this._polygon.remove();
        }
        if (Z.Geometry['TYPE_POLYGON'] == this.mode) {
            this.geometry = new Z.Polygon([path]);
            var symbol=this.getSymbol();
            if (symbol) {
                this.geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this.geometry);
        } else {
            this.geometry.setCoordinates(path);
        }
        this._endDraw(param);
    },

    _mousedownToDraw : function(param) {
        var me = this;
        var onMouseUp;
        function genGeometry(coordinate) {
            var symbol = me.getSymbol();
            var geometry = me.geometry;
            var _map = me.map;
            var center;
            switch (me.mode) {
            case Z.Geometry['TYPE_CIRCLE']:
                if (!geometry) {
                    geometry = new Z.Circle(coordinate,0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                center =geometry.getCenter();
                var radius = _map.computeDistance(center,coordinate);
                geometry.setRadius(radius);
            break;
            case Z.Geometry['TYPE_ELLIPSE']:
                if (!geometry) {
                    geometry = new Z.Ellipse(coordinate,0,0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                center = geometry.getCenter();
                var rx = _map.computeDistance(center,new Z.Coordinate({x:coordinate.x, y:center.y}));
                var ry = _map.computeDistance(center,new Z.Coordinate({x:center.x, y:coordinate.y}));
                geometry.setWidth(rx * 2);
                geometry.setHeight(ry * 2);
            break;
            case Z.Geometry['TYPE_RECT']:
                if (!geometry) {
                    geometry = new Z.Rectangle(coordinate,0,0);
                    geometry.setSymbol(symbol);
                    me._addGeometryToStage(geometry);
                    break;
                }
                var nw =geometry.getCoordinates();
                var width = _map.computeDistance(nw,new Z.Coordinate({x:coordinate.x, y:nw.y}));
                var height = _map.computeDistance(nw,new Z.Coordinate({x:nw.x, y:coordinate.y}));
                geometry.setWidth(width);
                geometry.setHeight(height);
            break;
            }
            me.geometry=geometry;

        }
        function onMouseMove(_event) {
            if (!this.geometry) {
                return false;
            }
            var containerPoint = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(containerPoint)) {return;}
            var coordinate = this._containerPointToLonlat(containerPoint);
            genGeometry(coordinate);
            return false;
        }
        onMouseUp = function(_event) {
            if (!this.geometry) {
                return false;
            }
            var containerPoint = this._getMouseContainerPoint(_event);
            if (!this._isValidContainerPoint(containerPoint)) {return;}
            var coordinate = this._containerPointToLonlat(containerPoint);
            genGeometry(coordinate);
            this.map.off('mousemove',onMouseMove,this);
            this.map.off('mouseup',onMouseUp,this);
            this._endDraw(param);
            return false;
        };
        var containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) {return;}
        var coordinate = this._containerPointToLonlat(containerPoint);
        /**
         * 绘制开始事件
         * @event drawstart
         * @param {Object} param {'coordinate':coordinate,'pixel':containerPoint}
         */
        this._fireEvent('drawstart',param);
        genGeometry(coordinate);
        this.map.on('mousemove',onMouseMove,this);
        this.map.on('mouseup',onMouseUp,this);
        return false;
    },

    _endDraw : function(param) {
        if (!this.geometry) {
            return;
        }
        var target = this.geometry.copy();
        this.geometry.remove();
        delete this.geometry;
        if (!param) {
            param = {};
        }
        param['geometry'] = target;
          /**
           * 绘制结束事件
           * @event drawend
           * @param {Object} param {'target':drawTool,'geometry':target};
           */
         this._fireEvent('drawend', param);
         if(this.disableOnDrawEnd) {
           this.disable();
         }
    },

    /**
     * 返回多边形或多折线的坐标数组
     * @return {[type]} [description]
     */
    _getLonlats:function() {
        if (this.geometry.getShell) {
            return this.geometry.getShell();
        }
        return this.geometry.getCoordinates();
    },

    _setLonlats:function(lonlats) {
        if (this.geometry instanceof Z.Polygon) {
            this.geometry.setCoordinates([lonlats]);

        } else if (this.geometry instanceof Z.Polyline) {
            this.geometry.setCoordinates(lonlats);
        }
        if (this._polygon) {
            this._polygon.setCoordinates([lonlats]);
        }
    },

    /**
     * 获得鼠标事件在地图容器上的屏幕坐标
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    _getMouseContainerPoint:function(event) {
        Z.DomUtil.stopPropagation(event['domEvent']);
        var result = event['containerPoint'];
        return result;
    },

    /**
     * 事件坐标转化为地图上的经纬度坐标
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    _containerPointToLonlat:function(containerPoint) {
        var projection = this._getProjection(),
            map = this.map;

        //projected pLonlat
        var pLonlat = map._untransform(containerPoint);
        return projection.unproject(pLonlat);
    },

    _isValidContainerPoint:function(containerPoint) {
        var mapSize = this.map.getSize();
        var w = mapSize['width'],
            h = mapSize['height'];
        if (containerPoint.x < 0 || containerPoint.y < 0) {
            return false;
        } else if (containerPoint.x> w || containerPoint.y > h){
            return false;
        }
        return true;
    },

    _getDrawLayer:function() {
        var drawLayerId = Z.internalLayerPrefix+'drawtool';
        var drawToolLayer = this.map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new Z.VectorLayer(drawLayerId);
            this.map.addLayer(drawToolLayer);
        }
        return drawToolLayer;
    },

    _fireEvent:function(eventName, param) {
        if (!param) {
            param = {};
        }
        this.fire(eventName, param);
    }

});
