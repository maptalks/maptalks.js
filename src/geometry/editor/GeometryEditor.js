import { INTERNAL_LAYER_PREFIX } from 'core/Constants';
import { extend, isNil, isNumber, sign, isArrayHasData, removeFromArray, UID } from 'core/util';
import { lowerSymbolOpacity } from 'core/util/style';
import Class from 'core/Class';
import Eventable from 'core/Eventable';
import Point from 'geo/Point';
import { Marker, TextMarker, LineString, Polygon, Circle, Ellipse, Sector, Rectangle } from 'geometry';
import VectorLayer from 'layer/VectorLayer';
import * as Symbolizers from 'renderer/geometry/symbolizers';

const EDIT_STAGE_LAYER_PREFIX = INTERNAL_LAYER_PREFIX + '_edit_stage_';

/**
 * Geometry editor used internally for geometry editing.
 * @category geometry
 * @protected
 * @extends Class
 * @mixes Eventable
 */
class GeometryEditor extends Eventable(Class) {

    /**
     * @param {Geometry} geometry geometry to edit
     * @param {Object} [opts=null] options
     * @param {Object} [opts.symbol=null] symbol of being edited.
     */
    constructor(geometry, opts) {
        super(opts);
        this._geometry = geometry;
        if (!this._geometry) {
            return;
        }
    }

    /**
     * Get map
     * @return {Map} map
     */
    getMap() {
        return this._geometry.getMap();
    }

    /**
     * Prepare to edit
     */
    prepare() {
        var map = this.getMap();
        if (!map) {
            return;
        }
        /**
         * reserve the original symbol
         */
        if (this.options['symbol']) {
            this._originalSymbol = this._geometry.getSymbol();
            this._geometry.setSymbol(this.options['symbol']);
        }

        this._prepareEditStageLayer();
    }

    _prepareEditStageLayer() {
        var map = this.getMap();
        var uid = UID();
        this._editStageLayer = map.getLayer(EDIT_STAGE_LAYER_PREFIX + uid);
        if (!this._editStageLayer) {
            this._editStageLayer = new VectorLayer(EDIT_STAGE_LAYER_PREFIX + uid);
            map.addLayer(this._editStageLayer);
        }
    }

    /**
     * Start to edit
     */
    start() {
        if (!this._geometry || !this._geometry.getMap() || this._geometry.editing) {
            return;
        }
        this.editing = true;
        var geometry = this._geometry;
        this._geometryDraggble = geometry.options['draggable'];
        geometry.config('draggable', false);
        this.prepare();
        //edits are applied to a shadow of geometry to improve performance.
        var shadow = geometry.copy();
        shadow.setSymbol(geometry._getInternalSymbol());
        //geometry copy没有将event复制到新建的geometry,对于编辑这个功能会存在一些问题
        //原geometry上可能绑定了其它监听其click/dragging的事件,在编辑时就无法响应了.
        shadow.copyEventListeners(geometry);
        if (geometry._getParent()) {
            shadow.copyEventListeners(geometry._getParent());
        }
        //drag shadow by center handle instead.
        shadow.setId(null).config({
            'draggable': false
        });

        this._shadow = shadow;

        this._switchGeometryEvents('on');

        geometry.hide();
        if (geometry instanceof Marker ||
            geometry instanceof Circle ||
            geometry instanceof Rectangle ||
            geometry instanceof Ellipse) {
            //ouline has to be added before shadow to let shadow on top of it, otherwise shadow's events will be overrided by outline
            this._createOrRefreshOutline();
        }
        this._editStageLayer.bringToFront().addGeometry(shadow);
        if (!(geometry instanceof Marker)) {
            this._createCenterHandle();
        } else {
            shadow.config('draggable', true);
            shadow.on('dragend', this._onShadowDragEnd, this);
        }
        if (geometry instanceof Marker) {
            this.createMarkerEditor();
        } else if (geometry instanceof Circle) {
            this.createCircleEditor();
        } else if (geometry instanceof Rectangle) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof Ellipse) {
            this.createEllipseOrRectEditor();
        } else if (geometry instanceof Sector) {
            // TODO: createSectorEditor
        } else if ((geometry instanceof Polygon) ||
            (geometry instanceof LineString)) {
            this.createPolygonEditor();
        }
    }

    /**
     * Stop editing
     */
    stop() {
        this._switchGeometryEvents('off');
        var map = this.getMap();
        if (!map) {
            return;
        }
        if (this._shadow) {
            this._update();
            this._shadow._clearAllListeners();
            this._shadow.remove();
            delete this._shadow;
        }
        this._geometry.config('draggable', this._geometryDraggble);
        delete this._geometryDraggble;
        this._geometry.show();

        this._editStageLayer.remove();
        if (isArrayHasData(this._eventListeners)) {
            for (let i = this._eventListeners.length - 1; i >= 0; i--) {
                let listener = this._eventListeners[i];
                listener[0].off(listener[1], listener[2], this);
            }
            this._eventListeners = [];
        }
        this._refreshHooks = [];
        if (this.options['symbol']) {
            this._geometry.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this.editing = false;
    }

    /**
     * Whether the editor is editing
     * @return {Boolean}
     */
    isEditing() {
        if (isNil(this.editing)) {
            return false;
        }
        return this.editing;
    }

    _getGeometryEvents() {
        return {
            'symbolchange': this._onGeometrySymbolChange
        };
    }

    _switchGeometryEvents(oper) {
        if (this._geometry) {
            var events = this._getGeometryEvents();
            for (var p in events) {
                this._geometry[oper](p, events[p], this);
            }
        }
    }

    _onGeometrySymbolChange(param) {
        if (this._shadow) {
            this._shadow.setSymbol(param['target']._getInternalSymbol());
        }
    }

    _onShadowDragEnd() {
        this._update();
        this._refresh();
    }

    _update() {
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
    }

    _updateAndFireEvent(eventName) {
        if (!this._shadow) {
            return;
        }
        this._update();
        this._geometry.fire(eventName);
    }

    /**
     * create rectangle outline of the geometry
     * @private
     */
    _createOrRefreshOutline() {
        var geometry = this._geometry,
            map = this.getMap(),
            outline = this._editOutline;
        var pixelExtent = geometry._getPainter().get2DExtent(),
            size = pixelExtent.getSize();
        var nw = map.pointToCoordinate(pixelExtent.getMin());
        var width = map.pixelToDistance(size['width'], 0),
            height = map.pixelToDistance(0, size['height']);
        if (!outline) {
            outline = new Rectangle(nw, width, height, {
                'symbol': {
                    'lineWidth': 1,
                    'lineColor': '6b707b'
                }
            });
            this._editStageLayer.addGeometry(outline);
            this._editOutline = outline;
            this._addRefreshHook(this._createOrRefreshOutline);
        } else {
            outline.setCoordinates(nw);
            outline.setWidth(width);
            outline.setHeight(height);
        }

        return outline;
    }


    _createCenterHandle() {
        const center = this._shadow.getCenter();
        var shadow;
        const handle = this.createHandle(center, {
            'markerType': 'ellipse',
            'dxdy': new Point(0, 0),
            'cursor': 'move',
            onDown: () => {
                shadow = this._shadow.copy();
                const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
                shadow.setSymbol(symbol).addTo(this._editStageLayer);
            },
            onMove: (v, param) => {
                const dragOffset = param['dragOffset'];
                if (shadow) {
                    shadow.translate(dragOffset);
                    this._geometry.translate(dragOffset);
                }
            },
            onUp: () => {
                if (shadow) {
                    this._shadow.setCoordinates(this._geometry.getCoordinates());
                    shadow.remove();
                    this._refresh();
                }
            }
        });
        this._addRefreshHook(() => {
            const center = this._shadow.getCenter();
            handle.setCoordinates(center);
        });
    }

    _createHandleInstance(coordinate, opts) {
        var symbol = {
            'markerType': opts['markerType'],
            'markerFill': '#ffffff', //"#d0d2d6",
            'markerLineColor': '#000000',
            'markerLineWidth': 2,
            'markerWidth': 10,
            'markerHeight': 10,
            'markerDx': opts['dxdy'].x,
            'markerDy': opts['dxdy'].y
        };
        if (opts['symbol']) {
            extend(symbol, opts['symbol']);
        }
        var handle = new Marker(coordinate, {
            'draggable': true,
            'dragShadow': false,
            'dragOnAxis': opts['axis'],
            'cursor': opts['cursor'],
            'symbol': symbol
        });
        return handle;
    }

    createHandle(coordinate, opts) {
        if (!opts) {
            opts = {};
        }
        var map = this.getMap();
        var handle = this._createHandleInstance(coordinate, opts);
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
    }

    /**
     * create resize handles for geometry that can resize.
     * @param {Array} blackList handle indexes that doesn't display, to prevent change a geometry's coordinates
     * @param {fn} onHandleMove callback
     * @private
     */
    _createResizeHandles(blackList, onHandleMove) {
        //cursor styles.
        var cursors = [
            'nw-resize', 'n-resize', 'ne-resize',
            'w-resize', 'e-resize',
            'sw-resize', 's-resize', 'se-resize'
        ];
        //defines dragOnAxis of resize handle
        var axis = [
            null, 'y', null,
            'x', 'x',
            null, 'y', null
        ];
        var geometry = this._geometry;

        function getResizeAnchors(ext) {
            return [
                ext.getMin(),
                new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymin']),
                new Point(ext['xmax'], ext['ymin']),
                new Point(ext['xmin'], (ext['ymax'] + ext['ymin']) / 2),
                new Point(ext['xmax'], (ext['ymax'] + ext['ymin']) / 2),
                new Point(ext['xmin'], ext['ymax']),
                new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymax']),
                ext.getMax()
            ];
        }
        if (!blackList) {
            blackList = [];
        }
        var resizeHandles = [];
        var anchorIndexes = {};
        var map = this.getMap();
        var fnLocateHandles = () => {
            var pExt = geometry._getPainter().get2DExtent(),
                anchors = getResizeAnchors(pExt);
            for (let i = 0; i < anchors.length; i++) {
                //ignore anchors in blacklist
                if (Array.isArray(blackList)) {
                    let isBlack = blackList.some(ele => ele === i);
                    if (isBlack) {
                        continue;
                    }
                }
                let anchor = anchors[i],
                    coordinate = map.pointToCoordinate(anchor);
                if (resizeHandles.length < (anchors.length - blackList.length)) {
                    let handle = this.createHandle(coordinate, {
                        'markerType': 'square',
                        'dxdy': new Point(0, 0),
                        'cursor': cursors[i],
                        'axis': axis[i],
                        onMove: (function (_index) {
                            return function (handleViewPoint) {
                                onHandleMove(handleViewPoint, _index);
                            };
                        })(i),
                        onUp: () => {
                            this._refresh();
                        }
                    });
                    handle.setId(i);
                    anchorIndexes[i] = resizeHandles.length;
                    resizeHandles.push(handle);
                } else {
                    resizeHandles[anchorIndexes[i]].setCoordinates(coordinate);
                }
            }

        };

        fnLocateHandles();
        //refresh hooks to refresh handles' coordinates
        this._addRefreshHook(fnLocateHandles);
        return resizeHandles;
    }

    /**
     * Create marker editor
     * @private
     */
    createMarkerEditor() {
        const marker = this._shadow,
            geometryToEdit = this._geometry,
            map = this.getMap();
        var resizeHandles;

        function onZoomStart() {
            if (Array.isArray(resizeHandles)) {
                for (let i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].hide();
                }
            }
            if (this._editOutline) {
                this._editOutline.hide();
            }
        }

        function onZoomEnd() {
            this._refresh();
            if (Array.isArray(resizeHandles)) {
                for (let i = resizeHandles.length - 1; i >= 0; i--) {
                    resizeHandles[i].show();
                }
            }
            if (this._editOutline) {
                this._editOutline.show();
            }
        }
        if (!marker._canEdit()) {
            if (console) {
                console.warn('A marker can\'t be resized with symbol:', marker.getSymbol());
            }
            return;
        }
        //only image marker and vector marker can be edited now.

        var symbol = marker._getInternalSymbol();
        var dxdy = new Point(0, 0);
        if (isNumber(symbol['markerDx'])) {
            dxdy.x = symbol['markerDx'];
        }
        if (isNumber(symbol['markerDy'])) {
            dxdy.y = symbol['markerDy'];
        }

        var blackList = null;

        if (Symbolizers.VectorMarkerSymbolizer.test(symbol)) {
            if (symbol['markerType'] === 'pin' || symbol['markerType'] === 'pie' || symbol['markerType'] === 'bar') {
                //as these types of markers' anchor stands on its bottom
                blackList = [5, 6, 7];
            }
        } else if (Symbolizers.ImageMarkerSymbolizer.test(symbol) ||
            Symbolizers.VectorPathMarkerSymbolizer.test(symbol)) {
            blackList = [5, 6, 7];
        }

        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        var resizeAbilities = [
            2, 1, 2,
            0, 0,
            2, 1, 2
        ];

        var aspectRatio;
        if (this.options['fixAspectRatio']) {
            var size = marker.getSize();
            aspectRatio = size.width / size.height;
        }

        resizeHandles = this._createResizeHandles(null, function (handleViewPoint, i) {
            if (blackList && blackList.indexOf(i) >= 0) {
                //need to change marker's coordinates
                var newCoordinates = map.viewPointToCoordinate(handleViewPoint.substract(dxdy));
                var coordinates = marker.getCoordinates();
                newCoordinates.x = coordinates.x;
                marker.setCoordinates(newCoordinates);
                geometryToEdit.setCoordinates(newCoordinates);
                //coordinates changed, and use mirror handle instead to caculate width and height
                var mirrorHandle = resizeHandles[resizeHandles.length - 1 - i];
                var mirrorViewPoint = map.coordinateToViewPoint(mirrorHandle.getCoordinates());
                handleViewPoint = mirrorViewPoint;
            }

            //caculate width and height
            var viewCenter = map._pointToViewPoint(marker._getCenter2DPoint()).add(dxdy),
                symbol = marker._getInternalSymbol();
            var wh = handleViewPoint.substract(viewCenter);
            if (blackList && handleViewPoint.y > viewCenter.y) {
                wh.y = 0;
            }

            //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
            var r = blackList ? 1 : 2;
            var width = Math.abs(wh.x) * 2,
                height = Math.abs(wh.y) * r;
            if (aspectRatio) {
                width = Math.max(width, height * aspectRatio);
                height = width / aspectRatio;
            }
            var ability = resizeAbilities[i];
            if (!(marker instanceof TextMarker)) {
                if (aspectRatio || ability === 0 || ability === 2) {
                    symbol['markerWidth'] = width;
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    symbol['markerHeight'] = height;
                }
                marker.setSymbol(symbol);
                geometryToEdit.setSymbol(symbol);
            } else {
                if (aspectRatio || ability === 0 || ability === 2) {
                    geometryToEdit.config('boxMinWidth', width);
                    marker.config('boxMinWidth', width);
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    geometryToEdit.config('boxMinHeight', height);
                    marker.config('boxMinHeight', height);
                }
            }
        });
        this._addListener([map, 'zoomstart', onZoomStart]);
        this._addListener([map, 'zoomend', onZoomEnd]);

    }

    /**
     * Create circle editor
     * @private
     */
    createCircleEditor() {
        var shadow = this._shadow,
            circle = this._geometry;
        var map = this.getMap();
        this._createResizeHandles(null, handleViewPoint => {
            var viewCenter = map._pointToViewPoint(shadow._getCenter2DPoint());
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
    }

    /**
     * editor of ellipse or rectangle
     * @private
     */
    createEllipseOrRectEditor() {
        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        const resizeAbilities = [
            2, 1, 2,
            0, 0,
            2, 1, 2
        ];
        const shadow = this._shadow,
            geometryToEdit = this._geometry;
        const map = this.getMap();
        const isRect = this._geometry instanceof Rectangle;
        var aspectRatio;
        if (this.options['fixAspectRatio']) {
            aspectRatio = geometryToEdit.getWidth() / geometryToEdit.getHeight();
        }
        const resizeHandles = this._createResizeHandles(null, (mouseViewPoint, i) => {
            //ratio of width and height
            const r = isRect ? 1 : 2;
            var pointSub, w, h;
            const targetPoint = mouseViewPoint;
            const ability = resizeAbilities[i];
            if (isRect) {
                const mirror = resizeHandles[7 - i];
                const mirrorViewPoint = map.coordinateToViewPoint(mirror.getCoordinates());
                pointSub = targetPoint.substract(mirrorViewPoint);
                const absSub = pointSub.abs();
                w = map.pixelToDistance(absSub.x, 0);
                h = map.pixelToDistance(0, absSub.y);
                const size = geometryToEdit.getSize();
                if (ability === 0) {
                    // changing width
                    // -  -  -
                    // 0     0
                    // -  -  -
                    // Rectangle's northwest's y is (y - height / 2)
                    if (aspectRatio) {
                        // update rectangle's height with aspect ratio
                        absSub.y = absSub.x / aspectRatio;
                        size.height = Math.abs(absSub.y);
                        h = w / aspectRatio;
                    }
                    targetPoint.y = mirrorViewPoint.y - size.height / 2;
                } else if (ability === 1) {
                    // changing height
                    // -  1  -
                    // |     |
                    // -  1  -
                    // Rectangle's northwest's x is (x - width / 2)
                    if (aspectRatio) {
                        // update rectangle's width with aspect ratio
                        absSub.x = absSub.y * aspectRatio;
                        size.width = Math.abs(absSub.x);
                        w = h * aspectRatio;
                    }
                    targetPoint.x = mirrorViewPoint.x - size.width / 2;
                } else if (aspectRatio) {
                    // corner handles, relocate the target point according to aspect ratio.
                    if (w > h * aspectRatio) {
                        h = w / aspectRatio;
                        targetPoint.y = mirrorViewPoint.y + absSub.x * sign(pointSub.y) / aspectRatio;
                    } else {
                        w = h * aspectRatio;
                        targetPoint.x = mirrorViewPoint.x + absSub.y  * sign(pointSub.x) * aspectRatio;
                    }
                }
                //change rectangle's coordinates
                var newCoordinates = map.viewPointToCoordinate(new Point(Math.min(targetPoint.x, mirrorViewPoint.x), Math.min(targetPoint.y, mirrorViewPoint.y)));
                shadow.setCoordinates(newCoordinates);
                geometryToEdit.setCoordinates(newCoordinates);

            } else {
                var viewCenter = map.coordinateToViewPoint(geometryToEdit.getCenter());
                pointSub = viewCenter.substract(targetPoint)._abs();
                w = map.pixelToDistance(pointSub.x, 0);
                h = map.pixelToDistance(0, pointSub.y);
                if (aspectRatio) {
                    w = Math.max(w, h * aspectRatio);
                    h = w / aspectRatio;
                }
            }

            if (aspectRatio || ability === 0 || ability === 2) {
                shadow.setWidth(w * r);
                geometryToEdit.setWidth(w * r);
            }
            if (aspectRatio || ability === 1 || ability === 2) {
                shadow.setHeight(h * r);
                geometryToEdit.setHeight(h * r);
            }
        });
    }

    /**
     * Editor for polygon
     * @private
     */
    createPolygonEditor() {

        var map = this.getMap(),
            shadow = this._shadow,
            me = this,
            projection = map.getProjection();
        var verticeLimit = shadow instanceof Polygon ? 3 : 2;
        var propertyOfVertexRefreshFn = 'maptalks--editor-refresh-fn',
            propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        var vertexHandles = [],
            newVertexHandles = [];

        function getVertexCoordinates() {
            if (shadow instanceof Polygon) {
                var coordinates = shadow.getCoordinates()[0];
                return coordinates.slice(0, coordinates.length - 1);
            } else {
                return shadow.getCoordinates();
            }

        }

        function getVertexPrjCoordinates() {
            return shadow._getPrjCoordinates();
        }

        function onVertexAddOrRemove() {
            //restore index property of each handles.
            for (let i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexIndex] = i;
            }
            for (let i = newVertexHandles.length - 1; i >= 0; i--) {
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
            prjCoordinates.splice(index, 1);
            shadow._setPrjCoordinates(prjCoordinates);
            shadow._updateCache();
            //remove vertex handle
            vertexHandles.splice(index, 1)[0].remove();
            //remove two neighbor "new vertex" handles
            if (index < newVertexHandles.length) {
                newVertexHandles.splice(index, 1)[0].remove();
            }
            var nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length - 1;
            } else {
                nextIndex = index - 1;
            }
            newVertexHandles.splice(nextIndex, 1)[0].remove();
            //add a new "new vertex" handle.
            newVertexHandles.splice(nextIndex, 0, createNewVertexHandle.call(me, nextIndex));
            onVertexAddOrRemove();
        }

        function moveVertexHandle(handleViewPoint, index) {
            var vertice = getVertexPrjCoordinates();
            var nVertex = map._viewPointToPrj(handleViewPoint);
            var pVertex = vertice[index];
            pVertex.x = nVertex.x;
            pVertex.y = nVertex.y;
            shadow._updateCache();
            shadow.onShapeChanged();
            var nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length - 1;
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
            var handle = me.createHandle(vertex, {
                'markerType': 'square',
                'dxdy': new Point(0, 0),
                'cursor': 'pointer',
                'axis': null,
                onMove: function (handleViewPoint) {
                    moveVertexHandle(handleViewPoint, handle[propertyOfVertexIndex]);
                },
                onRefresh: function () {
                    vertex = getVertexCoordinates()[handle[propertyOfVertexIndex]];
                    handle.setCoordinates(vertex);
                },
                onUp: function () {
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
            if (index + 1 >= vertexCoordinates.length) {
                nextVertex = vertexCoordinates[0];
            } else {
                nextVertex = vertexCoordinates[index + 1];
            }
            var vertex = vertexCoordinates[index].add(nextVertex).multi(1 / 2);
            var handle = me.createHandle(vertex, {
                'markerType': 'square',
                'symbol': {
                    'opacity': 0.4
                },
                'dxdy': new Point(0, 0),
                'cursor': 'pointer',
                'axis': null,
                onDown: function () {
                    var prjCoordinates = getVertexPrjCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //add a new vertex
                    var pVertex = projection.project(handle.getCoordinates());
                    //update shadow's vertice
                    prjCoordinates.splice(vertexIndex + 1, 0, pVertex);
                    shadow._setPrjCoordinates(prjCoordinates);
                    shadow._updateCache();

                    var symbol = handle.getSymbol();
                    delete symbol['opacity'];
                    handle.setSymbol(symbol);

                    //add two "new vertex" handles
                    newVertexHandles.splice(vertexIndex, 0, createNewVertexHandle.call(me, vertexIndex), createNewVertexHandle.call(me, vertexIndex + 1));
                    me._updateAndFireEvent('shapechange');
                },
                onMove: function (handleViewPoint) {
                    moveVertexHandle(handleViewPoint, handle[propertyOfVertexIndex] + 1);
                },
                onUp: function () {
                    var vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    removeFromArray(handle, newVertexHandles);
                    handle.remove();
                    //add a new vertex handle
                    vertexHandles.splice(vertexIndex + 1, 0, createVertexHandle.call(me, vertexIndex + 1));
                    onVertexAddOrRemove();
                },
                onRefresh: function () {
                    vertexCoordinates = getVertexCoordinates();
                    var vertexIndex = handle[propertyOfVertexIndex];
                    var nextIndex;
                    if (vertexIndex === vertexCoordinates.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = vertexIndex + 1;
                    }
                    var refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1 / 2);
                    handle.setCoordinates(refreshVertex);
                }
            });
            handle[propertyOfVertexIndex] = index;
            return handle;
        }
        var vertexCoordinates = getVertexCoordinates();
        for (let i = 0, len = vertexCoordinates.length; i < len; i++) {
            vertexHandles.push(createVertexHandle.call(this, i));
            if (i < len - 1) {
                newVertexHandles.push(createNewVertexHandle.call(this, i));
            }
        }
        if (shadow instanceof Polygon) {
            //1 more vertex handle for polygon
            newVertexHandles.push(createNewVertexHandle.call(this, vertexCoordinates.length - 1));
        }
        this._addRefreshHook(() => {
            for (let i = newVertexHandles.length - 1; i >= 0; i--) {
                newVertexHandles[i][propertyOfVertexRefreshFn]();
            }
            for (let i = vertexHandles.length - 1; i >= 0; i--) {
                vertexHandles[i][propertyOfVertexRefreshFn]();
            }
        });
    }

    _refresh() {
        if (this._refreshHooks) {
            for (let i = this._refreshHooks.length - 1; i >= 0; i--) {
                this._refreshHooks[i].call(this);
            }
        }
    }

    _hideContext() {
        if (this._geometry) {
            this._geometry.closeMenu();
            this._geometry.closeInfoWindow();
        }
    }

    _addListener(listener) {
        if (!this._eventListeners) {
            this._eventListeners = [];
        }
        this._eventListeners.push(listener);
        listener[0].on(listener[1], listener[2], this);
    }

    _addRefreshHook(fn) {
        if (!fn) {
            return;
        }
        if (!this._refreshHooks) {
            this._refreshHooks = [];
        }
        this._refreshHooks.push(fn);
    }

}

export default GeometryEditor;
