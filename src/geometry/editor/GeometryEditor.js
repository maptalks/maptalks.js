import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil, isNumber, sign, removeFromArray, UID } from '../../core/util';
import { lowerSymbolOpacity } from '../../core/util/style';
import Class from '../../core/Class';
import Eventable from '../../core/Eventable';
import Point from '../../geo/Point';
import Coordinate from '../../geo/Coordinate';
import { Marker, TextBox, LineString, Polygon, Circle, Ellipse, Sector, Rectangle } from '../';
import VectorLayer from '../../layer/VectorLayer';
import * as Symbolizers from '../../renderer/geometry/symbolizers';

const EDIT_STAGE_LAYER_PREFIX = INTERNAL_LAYER_PREFIX + '_edit_stage_';

function createHandleSymbol(markerType, opacity) {
    return {
        'markerType': markerType,
        'markerFill': '#fff',
        'markerLineColor': '#000',
        'markerLineWidth': 2,
        'markerWidth': 10,
        'markerHeight': 10,
        'opacity' : opacity
    };
}

const options = {
    //fix outline's aspect ratio when resizing
    'fixAspectRatio' : false,
    // geometry's symbol when editing
    'symbol' : null,
    'removeVertexOn' : 'contextmenu',
    //symbols of edit handles
    'centerHandleSymbol' : createHandleSymbol('ellipse', 1),
    'vertexHandleSymbol' : createHandleSymbol('square', 1),
    'newVertexHandleSymbol' : createHandleSymbol('square', 0.4)
};

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
        const map = this.getMap();
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
        const map = this.getMap();
        const uid = UID();
        const stageId = EDIT_STAGE_LAYER_PREFIX + uid,
            shadowId = EDIT_STAGE_LAYER_PREFIX + uid + '_shadow';
        this._editStageLayer = map.getLayer(stageId);
        this._shadowLayer = map.getLayer(shadowId);
        if (!this._editStageLayer) {
            this._editStageLayer = new VectorLayer(stageId);
            map.addLayer(this._editStageLayer);
        }
        if (!this._shadowLayer) {
            this._shadowLayer = new VectorLayer(shadowId);
            map.addLayer(this._shadowLayer);
        }
    }

    /**
     * Start to edit
     */
    start() {
        if (!this._geometry || !this._geometry.getMap() || this._geometry.editing) {
            return;
        }
        const map = this.getMap();
        this.editing = true;
        const geometry = this._geometry;
        this._geometryDraggble = geometry.options['draggable'];
        geometry.config('draggable', false);
        this.prepare();
        //edits are applied to a shadow of geometry to improve performance.
        const shadow = geometry.copy();
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
        this._shadowLayer.bringToFront().addGeometry(shadow);
        this._editStageLayer.bringToFront();
        this._addListener([map, 'zoomstart', () => { this._editStageLayer.hide(); }]);
        this._addListener([map, 'zoomend', () => {
            this._editStageLayer.show();
        }]);
        if (!(geometry instanceof Marker)) {
            this._createCenterHandle();
        } else {
            shadow.config('draggable', true);
            shadow.on('dragend', this._onMarkerDragEnd, this);
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
        delete this._history;
        delete this._historyPointer;
        delete this._editOutline;
        this._switchGeometryEvents('off');
        const map = this.getMap();
        if (!map) {
            return;
        }
        delete this._shadow;
        this._geometry.config('draggable', this._geometryDraggble);
        delete this._geometryDraggble;
        this._geometry.show();

        this._editStageLayer.remove();
        this._shadowLayer.remove();
        this._clearAllListeners();
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
            'symbolchange': this._onGeoSymbolChange,
            'positionchange shapechange' : this._exeAndReset
        };
    }

    _switchGeometryEvents(oper) {
        if (this._geometry) {
            const events = this._getGeometryEvents();
            for (const p in events) {
                this._geometry[oper](p, events[p], this);
            }
        }
    }

    _onGeoSymbolChange(param) {
        if (this._shadow) {
            this._shadow.setSymbol(param.target._getInternalSymbol());
        }
    }

    _onMarkerDragEnd() {
        this._update('setCoordinates', this._shadow.getCoordinates().toArray());
        this._refresh();
    }

    /**
     * create rectangle outline of the geometry
     * @private
     */
    _createOrRefreshOutline() {
        const geometry = this._geometry;
        let outline = this._editOutline;
        if (!outline) {
            outline = geometry.getOutline();
            this._editStageLayer.addGeometry(outline);
            this._editOutline = outline;
            this._addRefreshHook(this._createOrRefreshOutline);
        } else {
            outline.remove();
            this._editOutline = outline = geometry.getOutline();
            this._editStageLayer.addGeometry(outline);
        }

        return outline;
    }


    _createCenterHandle() {
        const center = this._shadow.getCenter();
        const symbol = this.options['centerHandleSymbol'];
        let shadow;
        const handle = this.createHandle(center, {
            'symbol': symbol,
            'cursor': 'move',
            onDown: () => {
                shadow = this._shadow.copy();
                const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
                shadow.setSymbol(symbol).addTo(this._editStageLayer);
            },
            onMove: (v, param) => {
                const offset = param['coordOffset'];
                shadow.translate(offset);
            },
            onUp: () => {
                this._update('setCoordinates', Coordinate.toNumberArrays(shadow.getCoordinates()));
                shadow.remove();
                this._refresh();
            }
        });
        this._addRefreshHook(() => {
            const center = this._shadow.getCenter();
            handle.setCoordinates(center);
        });
    }

    _createHandleInstance(coordinate, opts) {
        const symbol = opts['symbol'];
        const handle = new Marker(coordinate, {
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
        const map = this.getMap();
        const handle = this._createHandleInstance(coordinate, opts);
        const me = this;

        function onHandleDragstart(param) {
            if (opts.onDown) {
                /**
                 * change geometry shape start event, fired when drag to change geometry shape.
                 *
                 * @event Geometry#handledragstart
                 * @type {Object}
                 * @property {String} type - handledragstart
                 * @property {Geometry} target - the geometry fires the event
                 */
                this._geometry.fire('handledragstart');
                opts.onDown.call(me, param['viewPoint'], param);
            }
            return false;
        }

        function onHandleDragging(param) {
            me._hideContext();
            const viewPoint = map._prjToViewPoint(handle._getPrjCoordinates());
            if (opts.onMove) {
                /**
                 * changing geometry shape event, fired when dragging to change geometry shape.
                 *
                 * @event Geometry#handledragging
                 * @type {Object}
                 * @property {String} type - handledragging
                 * @property {Geometry} target - the geometry fires the event
                 */
                this._geometry.fire('handledragging');
                opts.onMove.call(me, viewPoint, param);
            }
            return false;
        }

        function onHandleDragEnd(ev) {
            if (opts.onUp) {
                /**
                 * changed geometry shape event, fired when drag end to change geometry shape.
                 *
                 * @event Geometry#handledragend
                 * @type {Object}
                 * @property {String} type - handledragend
                 * @property {Geometry} target - the geometry fires the event
                 */
                this._geometry.fire('handledragend');
                opts.onUp.call(me, ev);
            }
            return false;
        }

        function onHandleRemove() {
            handle.config('draggable', false);
            handle.off('dragstart', onHandleDragstart, me);
            handle.off('dragging', onHandleDragging, me);
            handle.off('dragend', onHandleDragEnd, me);
            handle.off('removestart', onHandleRemove, me);
            delete handle['maptalks--editor-refresh-fn'];
        }

        handle.on('dragstart', onHandleDragstart, this);
        handle.on('dragging', onHandleDragging, this);
        handle.on('dragend', onHandleDragEnd, this);
        handle.on('removestart', onHandleRemove, this);
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
    _createResizeHandles(blackList, onHandleMove, onHandleUp) {
        //cursor styles.
        const cursors = [
            'nw-resize', 'n-resize', 'ne-resize',
            'w-resize', 'e-resize',
            'sw-resize', 's-resize', 'se-resize'
        ];
        //defines dragOnAxis of resize handle
        const axis = [
            null, 'y', null,
            'x', 'x',
            null, 'y', null
        ];
        const geometry = this._geometry;

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
        const me = this;
        const resizeHandles = [],
            anchorIndexes = {},
            map = this.getMap(),
            handleSymbol = this.options['vertexHandleSymbol'];
        const fnLocateHandles = () => {
            const pExt = geometry._getPainter().get2DExtent(),
                anchors = getResizeAnchors(pExt);
            for (let i = 0; i < anchors.length; i++) {
                //ignore anchors in blacklist
                if (Array.isArray(blackList)) {
                    const isBlack = blackList.some(ele => ele === i);
                    if (isBlack) {
                        continue;
                    }
                }
                const anchor = anchors[i],
                    coordinate = map.pointToCoordinate(anchor);
                if (resizeHandles.length < (anchors.length - blackList.length)) {
                    const handle = this.createHandle(coordinate, {
                        'symbol' : handleSymbol,
                        'cursor': cursors[i],
                        'axis': axis[i],
                        onMove: (function (_index) {
                            return function (handleViewPoint) {
                                me._updating = true;
                                onHandleMove(handleViewPoint, _index);
                                geometry.fire('resizing');
                            };
                        })(i),
                        onUp: () => {
                            me._updating = false;
                            onHandleUp();
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
        const geometryToEdit = this._geometry,
            shadow = this._shadow,
            map = this.getMap();
        if (!shadow._canEdit()) {
            if (console) {
                console.warn('A marker can\'t be resized with symbol:', shadow.getSymbol());
            }
            return;
        }

        if (!this._history) {
            this._recordHistory(getUpdates());
        }
        //only image marker and vector marker can be edited now.

        const symbol = shadow._getInternalSymbol();
        const dxdy = new Point(0, 0);
        if (isNumber(symbol['markerDx'])) {
            dxdy.x = symbol['markerDx'];
        }
        if (isNumber(symbol['markerDy'])) {
            dxdy.y = symbol['markerDy'];
        }

        let blackList = null;

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
        const resizeAbilities = [
            2, 1, 2,
            0,    0,
            2, 1, 2
        ];

        let aspectRatio;
        if (this.options['fixAspectRatio']) {
            const size = shadow.getSize();
            aspectRatio = size.width / size.height;
        }

        const resizeHandles = this._createResizeHandles(null, (handleViewPoint, i) => {
            if (blackList && blackList.indexOf(i) >= 0) {
                //need to change marker's coordinates
                const newCoordinates = map.viewPointToCoordinate(handleViewPoint.sub(dxdy));
                const coordinates = shadow.getCoordinates();
                newCoordinates.x = coordinates.x;
                shadow.setCoordinates(newCoordinates);
                this._updateCoordFromShadow(true);
                // geometryToEdit.setCoordinates(newCoordinates);
                //coordinates changed, and use mirror handle instead to caculate width and height
                const mirrorHandle = resizeHandles[resizeHandles.length - 1 - i];
                const mirrorViewPoint = map.coordToViewPoint(mirrorHandle.getCoordinates());
                handleViewPoint = mirrorViewPoint;
            }

            //caculate width and height
            const viewCenter = map._pointToViewPoint(shadow._getCenter2DPoint()).add(dxdy),
                symbol = shadow._getInternalSymbol();
            const wh = handleViewPoint.sub(viewCenter);
            if (blackList && handleViewPoint.y > viewCenter.y) {
                wh.y = 0;
            }

            //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
            const r = blackList ? 1 : 2;
            let width = Math.abs(wh.x) * 2,
                height = Math.abs(wh.y) * r;
            if (aspectRatio) {
                width = Math.max(width, height * aspectRatio);
                height = width / aspectRatio;
            }
            const ability = resizeAbilities[i];
            if (!(shadow instanceof TextBox)) {
                if (aspectRatio || ability === 0 || ability === 2) {
                    symbol['markerWidth'] = width;
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    symbol['markerHeight'] = height;
                }
                shadow.setSymbol(symbol);
                geometryToEdit.setSymbol(symbol);
            } else {
                if (aspectRatio || ability === 0 || ability === 2) {
                    shadow.setWidth(width);
                    geometryToEdit.setWidth(width);
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    shadow.setHeight(height);
                    geometryToEdit.setHeight(height);
                }
            }
        }, () => {
            this._update(getUpdates());
        });

        function getUpdates() {
            const updates = [
                ['setCoordinates', shadow.getCoordinates().toArray()]
            ];
            if (shadow instanceof TextBox) {
                updates.push(['setWidth', shadow.getWidth()]);
                updates.push(['setHeight', shadow.getHeight()]);
            } else {
                updates.push(['setSymbol', shadow.getSymbol()]);
            }
            return updates;
        }

        function onZoomEnd() {
            this._refresh();
        }

        this._addListener([map, 'zoomend', onZoomEnd]);

    }

    /**
     * Create circle editor
     * @private
     */
    createCircleEditor() {
        const circle = this._geometry,
            shadow = this._shadow;
        const map = this.getMap();

        if (!this._history) {
            this._recordHistory([
                ['setCoordinates', shadow.getCoordinates().toArray()],
                ['setRadius', shadow.getRadius()]
            ]);
        }

        this._createResizeHandles(null, handleViewPoint => {
            const viewCenter = map._pointToViewPoint(shadow._getCenter2DPoint());
            const wh = handleViewPoint.sub(viewCenter);
            const w = Math.abs(wh.x),
                h = Math.abs(wh.y);
            let r;
            if (w > h) {
                r = map.pixelToDistance(w, 0);
            } else {
                r = map.pixelToDistance(0, h);
            }
            shadow.setRadius(r);
            circle.setRadius(r);
        }, () => {
            this._update('setRadius', shadow.getRadius());
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
        const geometryToEdit = this._geometry,
            shadow = this._shadow;

        if (!this._history) {
            this._recordHistory(getUpdates());
        }

        const map = this.getMap();
        const isRect = this._geometry instanceof Rectangle;
        let aspectRatio;
        if (this.options['fixAspectRatio']) {
            aspectRatio = geometryToEdit.getWidth() / geometryToEdit.getHeight();
        }
        const resizeHandles = this._createResizeHandles(null, (mouseViewPoint, i) => {
            //ratio of width and height
            const r = isRect ? 1 : 2;
            let pointSub, w, h;
            const targetPoint = mouseViewPoint;
            const ability = resizeAbilities[i];
            if (isRect) {
                const mirror = resizeHandles[7 - i];
                const mirrorViewPoint = map.coordToViewPoint(mirror.getCoordinates());
                pointSub = targetPoint.sub(mirrorViewPoint);
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
                const newCoordinates = map.viewPointToCoordinate(new Point(Math.min(targetPoint.x, mirrorViewPoint.x), Math.min(targetPoint.y, mirrorViewPoint.y)));
                shadow.setCoordinates(newCoordinates);
                this._updateCoordFromShadow(true);
                // geometryToEdit.setCoordinates(newCoordinates);

            } else {
                const viewCenter = map.coordToViewPoint(geometryToEdit.getCenter());
                pointSub = viewCenter.sub(targetPoint)._abs();
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
        }, () => {
            this._update(getUpdates());
        });

        function getUpdates() {
            return [
                ['setCoordinates', shadow.getCoordinates().toArray()],
                ['setWidth', shadow.getWidth()],
                ['setHeight', shadow.getHeight()]
            ];
        }
    }

    /**
     * Editor for polygon
     * @private
     */
    createPolygonEditor() {

        const map = this.getMap(),
            shadow = this._shadow,
            me = this,
            projection = map.getProjection();
        if (!this._history) {
            this._recordHistory('setCoordinates', Coordinate.toNumberArrays(shadow.getCoordinates()));
        }

        const verticeLimit = shadow instanceof Polygon ? 3 : 2;
        const propertyOfVertexRefreshFn = 'maptalks--editor-refresh-fn',
            propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        const vertexHandles = [],
            newVertexHandles = [];

        function getVertexCoordinates() {
            if (shadow instanceof Polygon) {
                const coordinates = shadow.getCoordinates()[0];
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
            me._updateCoordFromShadow();
        }

        function removeVertex(param) {
            const handle = param['target'],
                index = handle[propertyOfVertexIndex];
            const prjCoordinates = getVertexPrjCoordinates();
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
            let nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles.length - 1;
            } else {
                nextIndex = index - 1;
            }
            newVertexHandles.splice(nextIndex, 1)[0].remove();
            //add a new "new vertex" handle.
            newVertexHandles.splice(nextIndex, 0, createNewVertexHandle.call(me, nextIndex));
            onVertexAddOrRemove();
            me._refresh();
        }

        function moveVertexHandle(handleViewPoint, index) {
            const vertice = getVertexPrjCoordinates();
            const nVertex = map._viewPointToPrj(handleViewPoint);
            const pVertex = vertice[index];
            pVertex.x = nVertex.x;
            pVertex.y = nVertex.y;
            shadow._updateCache();
            shadow.onShapeChanged();
            me._updateCoordFromShadow(true);
            let nextIndex;
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
        }

        function createVertexHandle(index) {
            let vertex = getVertexCoordinates()[index];
            const handle = me.createHandle(vertex, {
                'symbol': me.options['vertexHandleSymbol'],
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
                    me._updateCoordFromShadow();
                },
                onDown: function (param, e) {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        return;
                    }
                }
            });
            handle[propertyOfVertexIndex] = index;
            handle.on(me.options['removeVertexOn'], removeVertex);
            return handle;
        }

        function createNewVertexHandle(index) {
            let vertexCoordinates = getVertexCoordinates();
            let nextVertex;
            if (index + 1 >= vertexCoordinates.length) {
                nextVertex = vertexCoordinates[0];
            } else {
                nextVertex = vertexCoordinates[index + 1];
            }
            const vertex = vertexCoordinates[index].add(nextVertex).multi(1 / 2);
            const handle = me.createHandle(vertex, {
                'symbol': me.options['newVertexHandleSymbol'],
                'cursor': 'pointer',
                'axis': null,
                onDown: function (param, e) {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        return;
                    }
                    const prjCoordinates = getVertexPrjCoordinates();
                    const vertexIndex = handle[propertyOfVertexIndex];
                    //add a new vertex
                    const pVertex = projection.project(handle.getCoordinates());
                    //update shadow's vertice
                    prjCoordinates.splice(vertexIndex + 1, 0, pVertex);
                    shadow._setPrjCoordinates(prjCoordinates);
                    shadow._updateCache();

                    const symbol = handle.getSymbol();
                    delete symbol['opacity'];
                    handle.setSymbol(symbol);

                    //add two "new vertex" handles
                    newVertexHandles.splice(vertexIndex, 0, createNewVertexHandle.call(me, vertexIndex), createNewVertexHandle.call(me, vertexIndex + 1));

                },
                onMove: function (handleViewPoint) {
                    moveVertexHandle(handleViewPoint, handle[propertyOfVertexIndex] + 1);
                },
                onUp: function (e) {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        return;
                    }
                    const vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    removeFromArray(handle, newVertexHandles);
                    handle.remove();
                    //add a new vertex handle
                    vertexHandles.splice(vertexIndex + 1, 0, createVertexHandle.call(me, vertexIndex + 1));
                    onVertexAddOrRemove();
                    me._updateCoordFromShadow();
                    me._refresh();
                },
                onRefresh: function () {
                    vertexCoordinates = getVertexCoordinates();
                    const vertexIndex = handle[propertyOfVertexIndex];
                    let nextIndex;
                    if (vertexIndex === vertexCoordinates.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = vertexIndex + 1;
                    }
                    const refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1 / 2);
                    handle.setCoordinates(refreshVertex);
                }
            });
            handle[propertyOfVertexIndex] = index;
            return handle;
        }
        const vertexCoordinates = getVertexCoordinates();
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

    _clearAllListeners() {
        if (this._eventListeners && this._eventListeners.length > 0) {
            for (let i = this._eventListeners.length - 1; i >= 0; i--) {
                const listener = this._eventListeners[i];
                listener[0].off(listener[1], listener[2], this);
            }
            this._eventListeners = [];
        }
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

    _update(method, ...args) {
        this._exeHistory([method, args]);
        this._recordHistory(method, ...args);
    }

    _updateCoordFromShadow(ignoreRecord) {
        if (!this._shadow) {
            return;
        }

        const coords = this._shadow.getCoordinates();
        const geo = this._geometry;
        const updating = this._updating;
        this._updating = true;
        geo.setCoordinates(coords);
        if (!ignoreRecord) {
            this._recordHistory('setCoordinates', Coordinate.toNumberArrays(geo.getCoordinates()));
        }
        this._updating = updating;
    }

    _recordHistory(method, ...args) {
        if (!this._history) {
            this._history = [];
            this._historyPointer = 0;
        }

        if (this._historyPointer < this._history.length - 1) {
            // remove old 'next views'
            this._history.splice(this._historyPointer + 1);
        }
        this._history.push([method, args]);
        this._historyPointer = this._history.length - 1;
        /**
         * edit record event, fired when an edit happend and being recorded
         *
         * @event Geometry#editrecord
         * @type {Object}
         * @property {String} type - editrecord
         * @property {Geometry} target - the geometry fires the event
         */
        this._geometry.fire('editrecord');
    }

    /**
     * Get previous map view in view history
     * @return {Object} map view
     */
    undo() {
        if (!this._history || this._historyPointer === 0) {
            return this;
        }
        const record = this._history[--this._historyPointer];
        this._exeAndReset(record);
        return this;
    }

    /**
     * Get next view in view history
     * @return {Object} map view
     */
    redo() {
        if (!this._history || this._historyPointer === this._history.length - 1) {
            return null;
        }
        const record = this._history[++this._historyPointer];
        this._exeAndReset(record);
        return this;
    }

    _exeAndReset(record) {
        if (this._updating) {
            return;
        }
        this._exeHistory(record);
        const history = this._history,
            pointer = this._historyPointer;
        this.stop();
        this._history = history;
        this._historyPointer = pointer;
        this.start();
    }

    _exeHistory(record) {
        if (!Array.isArray(record)) {
            return;
        }
        const updating = this._updating;
        this._updating = true;
        const geo = this._geometry;
        if (Array.isArray(record[0])) {
            record[0].forEach(o => {
                const m = o[0],
                    args = o.slice(1);
                this._shadow[m].apply(this._shadow, args);
                geo[m].apply(geo, args);
            });
        } else {
            this._shadow[record[0]].apply(this._shadow, record[1]);
            geo[record[0]].apply(geo, record[1]);
        }
        this._updating = updating;
    }

}

GeometryEditor.mergeOptions(options);

export default GeometryEditor;
