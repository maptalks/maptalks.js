/**
 * Geometry editor used internally for geometry editing.
 * @class
 * @category geometry
 * @protected
 * @extends maptalks.Class
 * @mixes maptalks.Eventable
 * @param {maptalks._shadow} geometry 待编辑图形
 * @param {Object} opts 属性
 */
Z.GeometryEditor=Z.Class.extend(/** @lends maptalks.GeometryEditor.prototype */{
    includes: [Z.Eventable],

    editStageLayerId : Z.internalLayerPrefix+'_edit_stage',

    initialize:function(geometry,opts) {
        this._geometry = geometry;
        if (!this._geometry) {return;}
        Z.Util.setOptions(this, opts);
    },

    getMap:function() {
        return this._geometry.getMap();
    },

    prepare:function() {
        var map=this.getMap();
        if (!map) {return;}
        /**
         * 保存原有的symbol
         */
        if (this.options['symbol']) {
            this._originalSymbol=this._geometry.getSymbol();
            this._geometry.setSymbol(this.options['symbol']);
        }

        this._editHandles = [];
        this._prepareEditStageLayer();
    },

    _prepareEditStageLayer:function() {
        var map=this.getMap();
        this._editStageLayer = map.getLayer(this.editStageLayerId);
        if (!this._editStageLayer) {
            this._editStageLayer = new Z.VectorLayer(this.editStageLayerId);
            map.addLayer(this._editStageLayer);
        }
    },

    /**
     * 开始编辑
     */
    start:function() {
        if (!this._geometry || !this._geometry.getMap() || this._geometry.editing) {return;}
        this.editing = true;
        var geometry = this._geometry;
        this._geometryDraggble = geometry.options['draggable'];
        geometry.config('draggable', false);
        this.prepare();
        //edits are applied to a shadow of geometry to improve performance.
        var shadow = geometry.copy();
        //geometry copy没有将event复制到新建的geometry,对于编辑这个功能会存在一些问题
        //原geometry上可能绑定了其它监听其click/dragging的事件,在编辑时就无法响应了.
        shadow.copyEventListeners(geometry);
        //drag shadow by center handle instead.
        shadow.setId(null).config({'draggable': false});
        shadow._enableRenderImmediate();

        this._shadow = shadow;
        geometry.hide();
        if (geometry instanceof Z.Marker || geometry instanceof Z.Circle || geometry instanceof Z.Rectangle
                || geometry instanceof Z.Ellipse) {
            //ouline has to be added before shadow to let shadow on top of it, otherwise shadow's events will be overrided by outline
            this._createOrRefreshOutline();
        }
        this._editStageLayer.bringToFront().addGeometry(shadow);
        if (!(geometry instanceof Z.Marker)) {
            this._createCenterHandle();
        } else {
            shadow.config('draggable', true);
            shadow.on('dragend', this._onShadowDragEnd, this);
        }
        if (geometry instanceof Z.Marker) {
            this.createMarkerEditor();
        } else if (geometry instanceof Z.Circle) {
            this.createCircleEditor();
        } else if (geometry instanceof Z.Rectangle) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof Z.Ellipse) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof Z.Sector) {
            // TODO: createSectorEditor
        } else if ((geometry instanceof Z.Polygon) ||
                   (geometry instanceof Z.Polyline)){
            this.createPolygonEditor();
        }

    },

    /**
     * 结束编辑
     * @return {*} [description]
     */
    stop:function() {
        var map = this.getMap();
        if (!map) {
            return;
        }
        if (this._shadow) {
            this._update();
            this._shadow.remove();
            delete this._shadow;
        }
        this._geometry.config('draggable', this._geometryDraggble);
        delete this._geometryDraggble;
        this._geometry.show();
        this._editStageLayer.removeGeometry(this._editHandles);
        if (Z.Util.isArrayHasData(this._eventListeners)) {
            for (var i = this._eventListeners.length - 1; i >= 0; i--) {
                var listener = this._eventListeners[i];
                listener[0].off(listener[1], listener[2], this);
            }
            this._eventListeners = [];
        }
        this._editHandles = [];
        this._refreshHooks = [];
        if (this.options['symbol']) {
            this._geometry.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this.editing = false;
    },

    isEditing:function() {
        if (Z.Util.isNil(this.editing)) {
            return false;
        }
        return this.editing;
    },

    _onShadowDragEnd:function() {
        this._update();
        this._refresh();
    },

    _update:function() {
        //update geographical properties from shadow to geometry
        this._geometry.setCoordinates(this._shadow.getCoordinates());
        if (this._geometry.getRadius) {
            this._geometry.setRadius(this._shadow.getRadius());
        }
        if (this._geometry.getWidth) {
            this._geometry.setWidth(this._shadow.getWidth());
        }
        if (this._geometry.getHeight) {
            this._geometry.setHeight(this._shadow.getHeight());
        }
        if (this._geometry.getStartAngle) {
            this._geometry.setStartAngle(this._shadow.getStartAngle());
        }
        if (this._geometry.getEndAngle) {
            this._geometry.setEndAngle(this._shadow.getEndAngle());
        }
    },

    _updateAndFireEvent:function(eventName) {
        if (!this._shadow) {
            return;
        }
        this._update();
        this._geometry.fire(eventName);
    },

    /**
     * create rectangle outline of the geometry
     */
    _createOrRefreshOutline:function() {
        var geometry = this._geometry,
            map = this.getMap(),
            outline = this._editOutline;

        var pixelExtent = geometry._getPainter().getPixelExtent(),
            size = pixelExtent.getSize();
        var nw = map.viewPointToCoordinate(pixelExtent.getMin());
        var width = map.pixelToDistance(size['width'],0),
            height = map.pixelToDistance(0,size['height']);
        if (!outline) {
            outline = new Z.Rectangle(nw, width, height, {
                "symbol":{
                    'lineWidth' : 1,
                    'lineColor' : '6b707b'
                }
            });
            this._editStageLayer.addGeometry(outline);
            this._appendHandler(outline);
            this._editOutline = outline;
            this._addRefreshHook(this._createOrRefreshOutline);
        } else {
            outline.setCoordinates(nw);
            outline.setWidth(width);
            outline.setHeight(height);
        }

        return outline;
    },


    _createCenterHandle:function() {
        var me = this;
        var center = this._shadow.getCenter();
        var shadow;
        var handle = me.createHandle(center,{
            'markerType' : 'ellipse',
            'dxdy'       : new Z.Point(0,0),
            'cursor'     : 'move',
            onDown:function(v, param) {
                shadow = this._shadow.copy();
                shadow._enableRenderImmediate();
                var symbol = Z.Util.decreaseSymbolOpacity(shadow.getSymbol(), 0.5);
                shadow.setSymbol(symbol).addTo(this._editStageLayer);
            },
            onMove:function(v,param) {
                var dragOffset = param['dragOffset'];
                if (shadow) {
                    shadow.translate(dragOffset);
                    this._geometry.translate(dragOffset);
                }
            },
            onUp:function(param) {
                if (shadow) {
                    this._shadow.setCoordinates(this._geometry.getCoordinates());
                    shadow.remove();
                    me._refresh();
                }
            }
        });
        this._appendHandler(handle);
        this._addRefreshHook(function() {
            var center = this._shadow.getCenter();
            handle.setCoordinates(center);
        });
    },

    _createHandleInstance:function(coordinate,opts) {
        var symbol = {
            "markerType"        : opts['markerType'],
            "markerFill"        : "#ffffff",//"#d0d2d6",
            "markerLineColor"   : "#000000",
            "markerLineWidth"   : 2,
            "markerWidth"       : 10,
            "markerHeight"      : 10,
            "markerDx"          : opts['dxdy'].x,
            "markerDy"          : opts['dxdy'].y
        };
        if (opts['symbol']) {
            Z.Util.extend(symbol, opts['symbol']);
        }
        var handle = new Z.Marker(coordinate,{
            'draggable' : true,
            'dragShadow' : false,
            'draggableAxis' : opts['axis'],
            'cursor'    : opts['cursor'],
            'symbol'    : symbol
        });
        return handle;
    },

    createHandle:function(coordinate, opts) {
        if (!opts) {
            opts = {};
        }
        var map = this.getMap();
        var handle = this._createHandleInstance(coordinate,opts);
        var me = this;
        function onHandleDragstart(param) {
            if (opts.onDown) {
                opts.onDown.call(me, param['viewPoint'], param);
            }
        }
        function onHandleDragging(param) {
            me._hideContext();
            var viewPoint = map._prjToViewPoint(handle._getPrjCoordinates());
            if (opts.onMove) {
                opts.onMove.call(me, viewPoint, param);
            }
        }
        function onHandleDragEnd(ev) {
            if (opts.onUp) {
                opts.onUp.call(me, ev);
            }
        }
        handle.on('dragstart', onHandleDragstart, this);
        handle.on('dragging', onHandleDragging, this);
        handle.on('dragend', onHandleDragEnd, this);
        //拖动移图
        if (opts.onRefresh) {
            handle['maptalks--editor-refresh-fn'] = opts.onRefresh;
        }
        this._editStageLayer.addGeometry(handle);
        return handle;
    },

    /**
     * create resize handles for geometry that can resize.
     * @param {Array} blackList handle indexes that doesn't display, to prevent change a geometry's coordinates
     * @param {fn} onHandleMove callback
     */
    _createResizeHandles:function(blackList, onHandleMove) {
        //cursor styles.
        var cursors = [
            'nw-resize','n-resize','ne-resize',
            'w-resize',            'e-resize',
            'sw-resize','s-resize','se-resize'
        ];
        //defines draggableAxis of resize handle
        var axis = [
            null, 'y', null,
            'x',       'x',
            null, 'y', null
        ];
        var geometry = this._geometry;
        function getResizeAnchors(ext) {
            return [
                ext.getMin(),
                new Z.Point((ext['xmax']+ext['xmin'])/2,ext['ymin']),
                new Z.Point(ext['xmax'], ext['ymin']),
                new Z.Point(ext['xmin'], (ext['ymax']+ext['ymin'])/2),
                new Z.Point(ext['xmax'], (ext['ymax']+ext['ymin'])/2),
                new Z.Point(ext['xmin'], ext['ymax']),
                new Z.Point((ext['xmax']+ext['xmin'])/2,ext['ymax']),
                ext.getMax()
            ];
        }
        if (!blackList) {
            blackList = [];
        }
        var resizeHandles = [];
        var anchorIndexes = {};
        var me = this, map = this.getMap();
        var fnLocateHandles = function() {
            var pExt = geometry._getPainter().getPixelExtent(),
                anchors = getResizeAnchors(pExt);
            for (var i = 0; i <anchors.length; i++) {
                //ignore anchors in blacklist
                if (Z.Util.isArrayHasData(blackList)) {
                    var isBlack = false;
                    for (var ii = blackList.length - 1; ii >= 0; ii--) {
                        if (blackList[ii] === i) {
                            isBlack = true;
                            break;
                        }
                    }
                    if (isBlack) {
                        continue;
                    }
                }
                var anchor = anchors[i],
                    coordinate = map.viewPointToCoordinate(anchor);
                if (resizeHandles.length < anchors.length - blackList.length) {
                    var handle = me.createHandle(coordinate,{
                        'markerType' : 'square',
                        'dxdy'       : new Z.Point(0,0),
                        'cursor'     : cursors[i],
                        'axis'       : axis[i],
                        onMove:(function(_index) {
                            return function(handleViewPoint) {
                                onHandleMove(handleViewPoint, _index);
                            };
                        })(i),
                        onUp:function() {
                            me._refresh();
                        }
                    });
                    handle.setId(i);
                    anchorIndexes[i] = resizeHandles.length;
                    resizeHandles.push(handle);
                    me._appendHandler(handle);
                } else {
                    resizeHandles[anchorIndexes[i]].setCoordinates(coordinate);
                }
            }

        };

        fnLocateHandles();
        //refresh hooks to refresh handles' coordinates
        this._addRefreshHook(fnLocateHandles);
        return resizeHandles;
    },

    /**
     * 标注和自定义标注编辑器
     */
    createMarkerEditor:function() {

        var marker = this._shadow,
            geometryToEdit = this._geometry,
            map = this.getMap(),
            resizeHandles;
        function onZoomStart() {
            if (Z.Util.isArrayHasData(resizeHandles)) {
                for (var i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].hide();
                }
            }
            if (this._editOutline) {
                this._editOutline.hide();
            }
        }
        function onZoomEnd() {
            this._refresh();
            if (Z.Util.isArrayHasData(resizeHandles)) {
                for (var i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].show();
                }
            }
            if (this._editOutline) {
                this._editOutline.show();
            }
        }
        if (!marker._canEdit()) {
            console.warn('A marker can\'t be resized with symbol:', marker.getSymbol());
            return;
        }
        //only image marker and vector marker can be edited now.

        var symbol = marker.getSymbol();
        var dxdy = new Z.Point(0,0);
        if (Z.Util.isNumber(symbol['markerDx'])) {
            dxdy.x = symbol['markerDx'];
        }
        if (Z.Util.isNumber(symbol['markerDy'])) {
            dxdy.y = symbol['markerDy'];
        }

        var blackList = null;

        if (Z.symbolizer.VectorMarkerSymbolizer.test(geometryToEdit, symbol)) {
            if (symbol['markerType'] === 'pin' || symbol['markerType'] === 'pie' || symbol['markerType'] === 'bar') {
                //as these types of markers' anchor stands on its bottom
                blackList = [5,6,7];
            }
        } else if (Z.symbolizer.ImageMarkerSymbolizer.test(geometryToEdit, symbol)
            || Z.symbolizer.VectorPathMarkerSymbolizer.test(geometryToEdit, symbol)) {
            blackList = [5,6,7];
        }

        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        var resizeAbilities = [
            2, 1, 2,
            0,    0,
            2, 1, 2
        ];

        resizeHandles = this._createResizeHandles(null,function(handleViewPoint, i) {
            if (blackList && Z.Util.searchInArray(i, blackList) >= 0) {
                //need to change marker's coordinates
                var newCoordinates = map.viewPointToCoordinate(handleViewPoint);
                var coordinates = marker.getCoordinates();
                newCoordinates.x = coordinates.x;
                marker.setCoordinates(newCoordinates);
                geometryToEdit.setCoordinates(newCoordinates);
                //coordinates changed, and use mirror handle instead to caculate width and height
                var mirrorHandle = resizeHandles[resizeHandles.length-1-i];
                var mirrorViewPoint = map.coordinateToViewPoint(mirrorHandle.getCoordinates());
                handleViewPoint = mirrorViewPoint;
            }

            //caculate width and height
            var viewCenter = marker._getCenterViewPoint().add(dxdy),
                symbol = marker.getSymbol();
            var wh = handleViewPoint.substract(viewCenter);
            //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
            var r = blackList?1:2;
            var width = Math.abs(wh.x)*2,
            height = Math.abs(wh.y)*r;
            var ability = resizeAbilities[i];
            if (ability === 0 || ability === 2) {
                symbol['markerWidth'] = width;
            }
            if (ability === 1 || ability === 2) {
                symbol['markerHeight'] = height;
            }
            marker.setSymbol(symbol);
            geometryToEdit.setSymbol(symbol);
        });
        this._addListener([map, 'zoomstart', onZoomStart]);
        this._addListener([map, 'zoomend', onZoomEnd]);

    },

    /**
     * 圆形编辑器
     * @return {*} [description]
     */
    createCircleEditor:function() {
        var shadow = this._shadow,
            circle = this._geometry;
        var map = this.getMap();
        var me = this;
        this._createResizeHandles(null,function(handleViewPoint, i) {
            var viewCenter = shadow._getCenterViewPoint();
            var wh = handleViewPoint.substract(viewCenter);
            var w = Math.abs(wh.x),
                h = Math.abs(wh.y);
            var r;
            if (w > h) {
                r = map.pixelToDistance(w, 0);
            } else {
                r = map.pixelToDistance(0, h);
            }
            shadow.setRadius(r);
            circle.setRadius(r);
        });
    },

    /**
     * editor of ellipse or rectangle
     * @return {*} [description]
     */
    createEllipseOrRectEditor:function() {
        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        var resizeAbilities = [
                2, 1, 2,
                0,    0,
                2, 1, 2
            ];
        var shadow = this._shadow,
            geometryToEdit = this._geometry;
        var map = this.getMap();
        var me = this;
        //handles in blackList will change geometry's coordinates
        var blackList = null;
        var isRect = this._geometry instanceof Z.Rectangle;
        if (isRect) {
            //resize handles to hide for rectangle
            blackList = [0,1,2,3,5];
        }
        var resizeHandles = this._createResizeHandles(null,function(handleViewPoint, i) {
            var viewCenter;
            //ratio of width and height
            var r;
            if (isRect) {
                //change rectangle's coordinates
                if (blackList && Z.Util.searchInArray(i, blackList) >= 0) {
                    var coordinates = shadow.getCoordinates(),
                        handleCoordinates = map.viewPointToCoordinate(handleViewPoint);
                    var newCoordinates;
                    var mirrorHandle = resizeHandles[7];
                    var mirrorViewPoint = map.coordinateToViewPoint(mirrorHandle.getCoordinates());
                    switch (i) {
                        case 0:
                            newCoordinates = handleCoordinates;
                            break;
                        case 1:
                            newCoordinates = new Z.Coordinate(coordinates.x, handleCoordinates.y);
                            break;
                        case 2:
                            newCoordinates = new Z.Coordinate(coordinates.x, handleCoordinates.y);
                            mirrorViewPoint = new Z.Point(handleViewPoint.x, mirrorViewPoint.y);
                            break;
                        case 3:
                            newCoordinates = new Z.Coordinate(handleCoordinates.x, coordinates.y);
                            break;
                        case 5:
                            newCoordinates = new Z.Coordinate(handleCoordinates.x, coordinates.y);
                            mirrorViewPoint = new Z.Point(mirrorViewPoint.x, handleViewPoint.y);
                            break;
                        default:
                            newCoordinates = null;
                    }
                    shadow.setCoordinates(newCoordinates);
                    geometryToEdit.setCoordinates(newCoordinates);

                    handleViewPoint = mirrorViewPoint;
                }
                r = 1;
                viewCenter = map._prjToViewPoint(shadow._getPrjCoordinates());
            } else {
                r = 2;
                viewCenter = shadow._getCenterViewPoint();
            }
            var wh = handleViewPoint.substract(viewCenter);
            var ability = resizeAbilities[i];
            var w = map.pixelToDistance(Math.abs(wh.x), 0);
            var h = map.pixelToDistance(0,Math.abs(wh.y));
            if (ability === 0 || ability === 2) {
                shadow.setWidth(w*r);
                geometryToEdit.setWidth(w*r);
            }
            if (ability === 1 || ability === 2) {
                shadow.setHeight(h*r);
                geometryToEdit.setHeight(h*r);
            }
            // me._updateAndFireEvent('shapechange');
        });
    },

    /**
     * 多边形和多折线的编辑器
     * @return {*} [description]
     */
    createPolygonEditor:function() {

        var map = this.getMap(),
            shadow = this._shadow,
            me = this,
            projection = map.getProjection();
        var verticeLimit = shadow instanceof Z.Polygon? 3:2;
        var propertyOfVertexRefreshFn = 'maptalks--editor-refresh-fn',
            propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        var vertexHandles = [],
            newVertexHandles = [];
        function getVertexCoordinates() {
            if (shadow instanceof Z.Polygon) {
                var coordinates = shadow.getCoordinates()[0];
                return coordinates.slice(0, coordinates.length-1);
            } else {
                return shadow.getCoordinates();
            }

        }
        function getVertexPrjCoordinates() {
            return shadow._getPrjCoordinates();
        }
        function onVertexAddOrRemove() {
            //restore index property of each handles.
            var i;
            for (i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexIndex] = i;
            }
            for (i = newVertexHandles.length - 1; i >= 0; i--) {
                newVertexHandles[i][propertyOfVertexIndex] = i;
            }
        }

        function removeVertex(param) {
            var handle = param['target'],
                index = handle[propertyOfVertexIndex];
            var prjCoordinates = getVertexPrjCoordinates();
            if (prjCoordinates.length <= verticeLimit) {
                return;
            }
            prjCoordinates.splice(index,1);
            shadow._setPrjCoordinates(prjCoordinates);
            shadow._updateCache();
            //remove vertex handle
            Z.Util.removeFromArray(vertexHandles.splice(index,1)[0].remove(),me._editHandles);
            //remove two neighbor "new vertex" handles
            if (index < newVertexHandles.length) {
                Z.Util.removeFromArray(newVertexHandles.splice(index,1)[0].remove(),me._editHandles);
            }
            var nextIndex;
            if (index === 0){
                nextIndex = newVertexHandles.length-1;
            } else {
                nextIndex = index - 1;
            }
            Z.Util.removeFromArray(newVertexHandles.splice(nextIndex,1)[0].remove(),me._editHandles);
            //add a new "new vertex" handle.
            newVertexHandles.splice(nextIndex,0,createNewVertexHandle.call(me, nextIndex));
            onVertexAddOrRemove();
        }
        function moveVertexHandle(handleViewPoint, index) {
            var vertice = getVertexPrjCoordinates();
            var nVertex = map._viewPointToPrj(handleViewPoint);
            var pVertex = vertice[index];
            pVertex.x = nVertex.x;
            pVertex.y = nVertex.y;
            shadow._updateCache();
            shadow._onShapeChanged();
            var nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length-1;
            } else {
                nextIndex = index - 1;
            }
            //refresh two neighbor "new vertex" handles.
            if (newVertexHandles[index]) {
                newVertexHandles[index][propertyOfVertexRefreshFn]();
            }
            if (newVertexHandles[nextIndex]) {
                newVertexHandles[nextIndex][propertyOfVertexRefreshFn]();
            }

            me._updateAndFireEvent('shapechange');
        }
        function createVertexHandle(index) {
            var vertex = getVertexCoordinates()[index];
            var handle = me.createHandle(vertex,{
                'markerType' : 'square',
                'dxdy'       : new Z.Point(0,0),
                'cursor'     : 'pointer',
                'axis'       : null,
                onMove:function(handleViewPoint) {
                    moveVertexHandle(handleViewPoint,handle[propertyOfVertexIndex]);
                },
                onRefresh:function() {
                    vertex = getVertexCoordinates()[handle[propertyOfVertexIndex]];
                    handle.setCoordinates(vertex);
                },
                onUp:function() {
                    me._refresh();
                }
            });
            handle[propertyOfVertexIndex] = index;
            handle.on('contextmenu', removeVertex);
            return handle;
        }
        function createNewVertexHandle(index) {
            var vertexCoordinates = getVertexCoordinates();
            var nextVertex;
            if (index+1 >= vertexCoordinates.length) {
                nextVertex = vertexCoordinates[0];
            } else {
                nextVertex = vertexCoordinates[index+1];
            }
            var vertex = vertexCoordinates[index].add(nextVertex).multi(1/2);
            var handle = me.createHandle(vertex,{
                'markerType' : 'square',
                'symbol'     : {'opacity' : 0.4},
                'dxdy'       : new Z.Point(0,0),
                'cursor'     : 'pointer',
                'axis'       : null,
                onDown:function() {
                    var prjCoordinates = getVertexPrjCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //add a new vertex
                    var pVertex = projection.project(handle.getCoordinates());
                    //update shadow's vertice
                    prjCoordinates.splice(vertexIndex+1,0,pVertex);
                    shadow._setPrjCoordinates(prjCoordinates);
                    shadow._updateCache();

                    var symbol = handle.getSymbol();
                    delete symbol['opacity'];
                    handle.setSymbol(symbol);

                    //add two "new vertex" handles
                    newVertexHandles.splice(vertexIndex,0, createNewVertexHandle.call(me, vertexIndex),createNewVertexHandle.call(me, vertexIndex+1));
                    me._updateAndFireEvent('shapechange');
                },
                onMove:function(handleViewPoint) {
                    moveVertexHandle(handleViewPoint,handle[propertyOfVertexIndex]+1);
                },
                onUp:function() {
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    Z.Util.removeFromArray(handle, newVertexHandles);
                    Z.Util.removeFromArray(handle, me._editHandles);
                    handle.remove();
                    //add a new vertex handle
                    vertexHandles.splice(vertexIndex+1,0,createVertexHandle.call(me,vertexIndex+1));
                    onVertexAddOrRemove();
                },
                onRefresh:function() {
                    vertexCoordinates = getVertexCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    var nextIndex;
                    if (vertexIndex === vertexCoordinates.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = vertexIndex + 1;
                    }
                    var refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1/2);
                    handle.setCoordinates(refreshVertex);
                }
            });
            handle[propertyOfVertexIndex] = index;
            return handle;
        }
        var vertexCoordinates = getVertexCoordinates();
        for (var i=0,len=vertexCoordinates.length;i<len;i++){
            vertexHandles.push(createVertexHandle.call(this,i));
            if (i<len-1) {
                newVertexHandles.push(createNewVertexHandle.call(this,i));
            }
        }
        if (shadow instanceof Z.Polygon) {
            //1 more vertex handle for polygon
            newVertexHandles.push(createNewVertexHandle.call(this,vertexCoordinates.length-1));
        }
        this._appendHandler(newVertexHandles);
        this._appendHandler(vertexHandles);
        this._addRefreshHook(function() {
            var i;
            for (i = newVertexHandles.length - 1; i >= 0; i--) {
                newVertexHandles[i][propertyOfVertexRefreshFn]();
            }
            for (i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexRefreshFn]();
            }
        });
    },

    _refresh:function() {
        if (this._refreshHooks) {
            for (var i = this._refreshHooks.length - 1; i >= 0; i--) {
                this._refreshHooks[i].call(this);
            }
        }
    },

    _hideContext:function() {
        if (this._geometry) {
            this._geometry.closeMenu();
            this._geometry.closeInfoWindow();
        }
    },

    _addListener:function(listener) {
        if (!this._eventListeners) {
            this._eventListeners = [];
        }
        this._eventListeners.push(listener);
        listener[0].on(listener[1], listener[2],this);
    },

    _addRefreshHook:function(fn) {
        if (!fn) {
            return;
        }
        if (!this._refreshHooks) {
            this._refreshHooks = [];
        }
        this._refreshHooks.push(fn);
    },

    _appendHandler:function(handle){
        if (!handle) {
            return;
        }
        if (!this._editHandles) {
            this._editHandles = [];
        }
        this._editHandles.push(handle);

    }

});
