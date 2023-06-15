import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil, isNumber, sign, removeFromArray, UID, isFunction } from '../../core/util';
import { lowerSymbolOpacity } from '../../core/util/style';
import Class from '../../core/Class';
import Eventable from '../../core/Eventable';
import Point from '../../geo/Point';
import Coordinate from '../../geo/Coordinate';
import { Marker, TextBox, LineString, Polygon, Circle, Ellipse, Sector, Rectangle } from '../';
import EditHandle from '../../renderer/edit/EditHandle';
import EditOutline from '../../renderer/edit/EditOutline';
import { loadFunctionTypes } from '../../core/mapbox';
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
        'opacity': opacity
    };
}

const options = {
    //fix outline's aspect ratio when resizing
    'fixAspectRatio': false,
    // geometry's symbol when editing
    'symbol': null,
    'removeVertexOn': 'contextmenu',
    //symbols of edit handles
    'centerHandleSymbol': createHandleSymbol('ellipse', 1),
    'vertexHandleSymbol': createHandleSymbol('square', 1),
    'newVertexHandleSymbol': createHandleSymbol('square', 0.4)
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
        map.on('drawtopstart', this._refresh, this);
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
        const layer = this._geometry.getLayer();
        if (layer.options['renderer'] !== 'canvas') {
            // doesn't need shadow if it's webgl or gpu renderer
            return;
        }
        const map = this.getMap();
        const uid = UID();
        const shadowId = EDIT_STAGE_LAYER_PREFIX + uid + '_shadow';
        this._shadowLayer = map.getLayer(shadowId);
        if (!this._shadowLayer) {
            const LayerType = layer.constructor;
            this._shadowLayer = new LayerType(shadowId);
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
        this.editing = true;
        this.prepare();
        const geometry = this._geometry;
        let shadow;

        const layer = this._geometry.getLayer();
        const needShadow = layer.options['renderer'] === 'canvas';
        this._geometryDraggble = geometry.options['draggable'];
        if (needShadow) {
            geometry.config('draggable', false);
            //edits are applied to a shadow of geometry to improve performance.
            shadow = geometry.copy();
            shadow.setSymbol(geometry._getInternalSymbol());
            //geometry copy没有将event复制到新建的geometry,对于编辑这个功能会存在一些问题
            //原geometry上可能绑定了其它监听其click/dragging的事件,在编辑时就无法响应了.
            shadow.copyEventListeners(geometry);
            if (geometry._getParent()) {
                shadow.copyEventListeners(geometry._getParent());
            }
            shadow._setEventTarget(geometry);
            //drag shadow by center handle instead.
            shadow.setId(null).config({
                'draggable': false
            });

            this._shadow = shadow;

            geometry.hide();
        } else if (geometry instanceof Marker) {
            geometry.config('draggable', true);
        }

        this._switchGeometryEvents('on');
        if (geometry instanceof Marker ||
            geometry instanceof Circle ||
            geometry instanceof Rectangle ||
            geometry instanceof Ellipse) {
            //ouline has to be added before shadow to let shadow on top of it, otherwise shadow's events will be overrided by outline
            this._createOrRefreshOutline();
        }
        if (this._shadowLayer) {
            this._shadowLayer.bringToFront().addGeometry(shadow);
        }
        if (!(geometry instanceof Marker)) {
            this._createCenterHandle();
        } else if (shadow) {
            shadow.config('draggable', true);
            shadow.on('dragend', this._onMarkerDragEnd, this);
        }
        if ((geometry instanceof Marker) && this.options['resize'] !== false) {
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
            this.fire('remove');
            return;
        }
        this._geometry.config('draggable', this._geometryDraggble);
        if (this._shadow) {
            delete this._shadow;
            delete this._geometryDraggble;
            this._geometry.show();
        }

        if (this._shadowLayer) {
            this._shadowLayer.remove();
            delete this._shadowLayer;
        }
        this._refreshHooks = [];
        if (this.options['symbol']) {
            this._geometry.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this.editing = false;
        this.fire('remove');
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
            // prevent _exeAndReset when dragging geometry in gl layers
            'dragstart': this._onDragStart,
            'dragend': this._onDragEnd,
            'positionchange shapechange': this._exeAndReset,
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
    }

    /**
     * create rectangle outline of the geometry
     * @private
     */
    _createOrRefreshOutline() {
        const geometry = this._geometry;
        const outline = this._editOutline;
        if (!outline) {
            this._editOutline = new EditOutline(this, this.getMap());
            this._addRefreshHook(this._createOrRefreshOutline);
        }
        let points = this._editOutline.points;

        if (geometry instanceof Marker) {
            this._editOutline.setPoints(geometry.getContainerExtent().toArray(points));
        } else {
            const map = this.getMap();
            const extent = geometry._getPrjExtent();
            points = extent.toArray(points);
            points.forEach(c => map._prjToContainerPoint(c, null, c));
            this._editOutline.setPoints(points);
        }

        return outline;
    }


    _createCenterHandle() {
        const map = this.getMap();
        const symbol = this.options['centerHandleSymbol'];
        let shadow;
        const cointainerPoint = map.coordToContainerPoint(this._geometry.getCenter());
        const handle = this.createHandle(cointainerPoint, {
            'symbol': symbol,
            'cursor': 'move',
            onDown: () => {
                if (this._shadow) {
                    shadow = this._shadow.copy();
                    const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
                    shadow.setSymbol(symbol).addTo(this._geometry.getLayer());
                }
            },
            onMove: (param) => {
                const offset = param['coordOffset'];
                if (shadow) {
                    shadow.translate(offset);
                } else {
                    this._geometry.translate(offset);
                }
            },
            onUp: () => {
                if (shadow) {
                    const shadowFirst = shadow.getFirstCoordinate();
                    const first = this._geometry.getFirstCoordinate();
                    const offset = shadowFirst.sub(first);
                    this._update('translate', offset);
                    shadow.remove();
                }
            }
        });
        this._addRefreshHook(() => {
            const center = this._geometry.getCenter();
            handle.setContainerPoint(map.coordToContainerPoint(center));
        });
    }

    _createHandleInstance(containerPoint, opts) {
        const map = this.getMap();
        const symbol = loadFunctionTypes(opts['symbol'], () => {
            return [
                map.getZoom(),
                {
                    '{bearing}': map.getBearing(),
                    '{pitch}': map.getPitch(),
                    '{zoom}': map.getZoom()
                }
            ];
        });
        const removeVertexOn = this.options['removeVertexOn'];
        const handle = new EditHandle(this, map, { symbol, cursor: opts['cursor'], events: removeVertexOn });
        handle.setContainerPoint(containerPoint);
        return handle;
    }

    createHandle(containerPoint, opts) {
        if (!opts) {
            opts = {};
        }
        const handle = this._createHandleInstance(containerPoint, opts);
        const me = this;

        function onHandleDragstart(param) {
            this._updating = true;
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
                opts.onDown.call(me, param['containerPoint'], param);
            }
            return false;
        }

        function onHandleDragging(param) {
            me._hideContext();
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
                opts.onMove.call(me, param);
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
            this._updating = false;
            return false;
        }

        handle.on('dragstart', onHandleDragstart, this);
        handle.on('dragging', onHandleDragging, this);
        handle.on('dragend', onHandleDragEnd, this);
        //拖动移图
        if (opts.onRefresh) {
            handle.refresh = opts.onRefresh;
        }
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
        //marker做特殊处理，利用像素求锚点
        const isMarker = geometry instanceof Marker;

        function getResizeAnchors() {
            if (isMarker) {
                const ext = geometry.getContainerExtent();
                return [
                    // ext.getMin(),
                    new Point(ext['xmin'], ext['ymin']),
                    new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymin']),
                    new Point(ext['xmax'], ext['ymin']),
                    new Point(ext['xmin'], (ext['ymin'] + ext['ymax']) / 2),
                    new Point(ext['xmax'], (ext['ymin'] + ext['ymax']) / 2),
                    new Point(ext['xmin'], ext['ymax']),
                    new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymax']),
                    new Point(ext['xmax'], ext['ymax'])
                ];
            }
            const ext = geometry._getPrjExtent();
            return [
                // ext.getMin(),
                new Point(ext['xmin'], ext['ymax']),
                new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymax']),
                new Point(ext['xmax'], ext['ymax']),
                new Point(ext['xmin'], (ext['ymax'] + ext['ymin']) / 2),
                new Point(ext['xmax'], (ext['ymax'] + ext['ymin']) / 2),
                new Point(ext['xmin'], ext['ymin']),
                new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymin']),
                new Point(ext['xmax'], ext['ymin']),
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
            const anchors = getResizeAnchors();
            for (let i = 0; i < anchors.length; i++) {
                //ignore anchors in blacklist
                if (Array.isArray(blackList)) {
                    const isBlack = blackList.some(ele => ele === i);
                    if (isBlack) {
                        continue;
                    }
                }
                const anchor = anchors[i],
                    point = isMarker ? anchor : map._prjToContainerPoint(anchor);
                if (resizeHandles.length < (anchors.length - blackList.length)) {
                    const handle = this.createHandle(point, {
                        'symbol': handleSymbol,
                        'cursor': cursors[i],
                        'axis': axis[i],
                        onMove: (function (_index) {
                            return function (e) {
                                me._updating = true;
                                onHandleMove(e.containerPoint, _index);
                                geometry.fire('resizing');
                            };
                        })(i),
                        onUp: () => {
                            me._updating = false;
                            onHandleUp();
                        }
                    });
                    // handle.setId(i);
                    anchorIndexes[i] = resizeHandles.length;
                    resizeHandles.push(handle);
                } else {
                    resizeHandles[anchorIndexes[i]].setContainerPoint(point);
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
        const geometryToEdit = this._shadow || this._geometry,
            map = this.getMap();
        if (!geometryToEdit._canEdit()) {
            if (console) {
                console.warn('A marker can\'t be resized with symbol:', geometryToEdit.getSymbol());
            }
            return;
        }

        if (!this._history) {
            this._recordHistory(getUpdates());
        }
        //only image marker and vector marker can be edited now.

        const symbol = geometryToEdit._getInternalSymbol();
        const dxdy = new Point(0, 0);
        if (isNumber(symbol['markerDx'])) {
            dxdy.x = symbol['markerDx'];
        }
        if (isNumber(symbol['markerDy'])) {
            dxdy.y = symbol['markerDy'];
        }

        let blackList = null;
        let verticalAnchor = 'middle';
        let horizontalAnchor = 'middle';

        if (Symbolizers.VectorMarkerSymbolizer.test(symbol)) {
            const type = symbol['markerType'];
            if (type === 'pin' || type === 'pie' || type === 'bar') {
                //as these types of markers' anchor stands on its bottom
                blackList = [5, 6, 7];
                verticalAnchor = 'bottom';
            } else if (type === 'rectangle') {
                blackList = [0, 1, 2, 3, 5];
                verticalAnchor = 'top';
                horizontalAnchor = 'left';
            }
        } else if (Symbolizers.ImageMarkerSymbolizer.test(symbol) ||
            Symbolizers.VectorPathMarkerSymbolizer.test(symbol)) {
            verticalAnchor = 'bottom';
            blackList = [5, 6, 7];
        }

        //defines what can be resized by the handle
        //0: resize width; 1: resize height; 2: resize both width and height.
        const resizeAbilities = [
            2, 1, 2,
            0, 0,
            2, 1, 2
        ];

        let aspectRatio;
        if (this.options['fixAspectRatio']) {
            const size = geometryToEdit.getSize();
            aspectRatio = size.width / size.height;
        }

        const resizeHandles = this._createResizeHandles(blackList, (containerPoint, i) => {
            if (blackList && blackList.indexOf(i) >= 0) {
                //need to change marker's coordinates
                const newCoordinates = map.containerPointToCoordinate(containerPoint.sub(dxdy));
                const coordinates = geometryToEdit.getCoordinates();
                newCoordinates.x = coordinates.x;
                geometryToEdit.setCoordinates(newCoordinates);
                this._updateCoordFromShadow(true);
                // geometryToEdit.setCoordinates(newCoordinates);
                //coordinates changed, and use mirror handle instead to caculate width and height
                const mirrorHandle = resizeHandles[resizeHandles.length - 1 - i];
                const mirror = mirrorHandle.getContainerPoint();
                containerPoint = mirror;
            }

            //caculate width and height
            const viewCenter = map.coordToContainerPoint(geometryToEdit.getCoordinates()).add(dxdy),
                symbol = geometryToEdit._getInternalSymbol();
            const wh = containerPoint.sub(viewCenter);
            if (verticalAnchor === 'bottom' && containerPoint.y > viewCenter.y) {
                wh.y = 0;
            }

            //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
            const vr = verticalAnchor === 'middle' ? 2 : 1;
            const hr = horizontalAnchor === 'left' ? 1 : 2;
            let width = Math.abs(wh.x) * hr,
                height = Math.abs(wh.y) * vr;
            if (aspectRatio) {
                width = Math.max(width, height * aspectRatio);
                height = width / aspectRatio;
            }
            const ability = resizeAbilities[i];
            if (!(geometryToEdit instanceof TextBox)) {
                if (aspectRatio || ability === 0 || ability === 2) {
                    symbol['markerWidth'] = Math.min(width, this._geometry.options['maxMarkerWidth'] || Infinity);
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    symbol['markerHeight'] = Math.min(height, this._geometry.options['maxMarkerHeight'] || Infinity);
                }
                geometryToEdit.setSymbol(symbol);
                if (geometryToEdit !== this._geometry) {
                    this._geometry.setSymbol(symbol);
                }
            } else {
                if (aspectRatio || ability === 0 || ability === 2) {
                    geometryToEdit.setWidth(width);
                    if (geometryToEdit !== this._geometry) {
                        this._geometry.setWidth(width);
                    }
                }
                if (aspectRatio || ability === 1 || ability === 2) {
                    geometryToEdit.setHeight(height);
                    if (geometryToEdit !== this._geometry) {
                        this._geometry.setHeight(height);
                    }
                }
            }
        }, () => {
            this._update(getUpdates());
        });

        function getUpdates() {
            const updates = [
                ['setCoordinates', geometryToEdit.getCoordinates().toArray()]
            ];
            if (geometryToEdit instanceof TextBox) {
                updates.push(['setWidth', geometryToEdit.getWidth()]);
                updates.push(['setHeight', geometryToEdit.getHeight()]);
            } else {
                updates.push(['setSymbol', geometryToEdit.getSymbol()]);
            }
            return updates;
        }
    }

    /**
     * Create circle editor
     * @private
     */
    createCircleEditor() {
        const geo = this._shadow || this._geometry;
        const map = this.getMap();

        if (!this._history) {
            this._recordHistory([
                ['setCoordinates', geo.getCoordinates().toArray()],
                ['setRadius', geo.getRadius()]
            ]);
        }

        this._createResizeHandles(null, handleContainerPoint => {
            const center = geo.getCenter();
            const mouseCoordinate = map.containerPointToCoord(handleContainerPoint);
            const wline = new LineString([[center.x, center.y], [mouseCoordinate.x, center.y]]);
            const hline = new LineString([[center.x, center.y], [center.x, mouseCoordinate.y]]);
            const r = Math.max(map.computeGeometryLength(wline), map.computeGeometryLength(hline));
            geo.setRadius(r);
            if (geo !== this._geometry) {
                this._geometry.setRadius(r);
            }
        }, () => {
            this._update('setRadius', geo.getRadius());
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
        const geometryToEdit = this._shadow || this._geometry;

        if (!this._history) {
            this._recordHistory(getUpdates());
        }

        const map = this.getMap();
        const isRect = this._geometry instanceof Rectangle;
        let aspectRatio;
        if (this.options['fixAspectRatio']) {
            aspectRatio = geometryToEdit.getWidth() / geometryToEdit.getHeight();
        }
        const resizeHandles = this._createResizeHandles(null, (mouseContainerPoint, i) => {
            //ratio of width and height
            const r = isRect ? 1 : 2;
            let pointSub, w, h;
            const handle = resizeHandles[i];
            const targetPoint = handle.getContainerPoint(); //mouseContainerPoint;
            const ability = resizeAbilities[i];
            if (isRect) {
                const mirror = resizeHandles[7 - i];
                const mirrorContainerPoint = mirror.getContainerPoint();
                pointSub = targetPoint.sub(mirrorContainerPoint);
                const absSub = pointSub.abs();
                w = map.pixelToDistance(absSub.x, 0);
                h = map.pixelToDistance(0, absSub.y);
                const size = geometryToEdit.getSize();
                const geoCoord = geometryToEdit.getCoordinates();
                const width = geometryToEdit.getWidth();
                const height = geometryToEdit.getHeight();
                const mouseCoordinate = map.containerPointToCoord(mouseContainerPoint);
                const mirrorCoordinate = map.containerPointToCoord(mirrorContainerPoint);
                const wline = new LineString([[mirrorCoordinate.x, mirrorCoordinate.y], [mouseCoordinate.x, mirrorCoordinate.y]]);
                const hline = new LineString([[mirrorCoordinate.x, mirrorCoordinate.y], [mirrorCoordinate.x, mouseCoordinate.y]]);
                //fix distance cal error
                w = map.computeGeometryLength(wline);
                h = map.computeGeometryLength(hline);
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
                    targetPoint.y = mirrorContainerPoint.y - size.height / 2;
                    mouseCoordinate.y = geoCoord.y;
                    if (i === 4) {
                        mouseCoordinate.x = Math.min(mouseCoordinate.x, geoCoord.x);
                    } else {
                        // use locate instead of containerPoint to fix precision problem
                        const mirrorCoord = map.locate(geoCoord, width, 0);
                        mouseCoordinate.x = map.locate(new Coordinate(mirrorCoord.x, mouseCoordinate.y), -w, 0).x;
                    }
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
                    targetPoint.x = mirrorContainerPoint.x - size.width / 2;
                    mouseCoordinate.x = geoCoord.x;
                    mouseCoordinate.y = Math.max(mouseCoordinate.y, mirrorCoordinate.y);
                } else {
                    // corner handles, relocate the target point according to aspect ratio.
                    if (aspectRatio) {
                        if (w > h * aspectRatio) {
                            h = w / aspectRatio;
                            targetPoint.y = mirrorContainerPoint.y + absSub.x * sign(pointSub.y) / aspectRatio;
                        } else {
                            w = h * aspectRatio;
                            targetPoint.x = mirrorContainerPoint.x + absSub.y * sign(pointSub.x) * aspectRatio;
                        }
                    }
                    // anchor at northwest and south west
                    if (i === 0 || i === 5) {
                        // use locate instead of containerPoint to fix precision problem
                        const mirrorCoord = i === 0 ? map.locate(geoCoord, width, 0) : map.locate(geoCoord, width, -height);
                        mouseCoordinate.x = map.locate(new Coordinate(mirrorCoord.x, mouseCoordinate.y), -w, 0).x;
                    } else {
                        mouseCoordinate.x = Math.min(mouseCoordinate.x, mirrorCoordinate.x);
                    }
                    mouseCoordinate.y = Math.max(mouseCoordinate.y, mirrorCoordinate.y);
                }
                //change rectangle's coordinates
                // const newCoordinates = map.viewPointToCoordinate(new Point(Math.min(targetPoint.x, mirrorContainerPoint.x), Math.min(targetPoint.y, mirrorContainerPoint.y)));
                geometryToEdit.setCoordinates(mouseCoordinate);
                this._updateCoordFromShadow(true);
                // geometryToEdit.setCoordinates(newCoordinates);

            } else {
                // const viewCenter = map.coordToViewPoint(geometryToEdit.getCenter());
                // pointSub = viewCenter.sub(targetPoint)._abs();
                // w = map.pixelToDistance(pointSub.x, 0);
                // h = map.pixelToDistance(0, pointSub.y);
                // if (aspectRatio) {
                //     w = Math.max(w, h * aspectRatio);
                //     h = w / aspectRatio;
                // }
                const center = geometryToEdit.getCenter();
                const mouseCoordinate = map.containerPointToCoord(targetPoint);
                const wline = new LineString([[center.x, center.y], [mouseCoordinate.x, center.y]]);
                const hline = new LineString([[center.x, center.y], [center.x, mouseCoordinate.y]]);
                w = map.computeGeometryLength(wline);
                h = map.computeGeometryLength(hline);
                if (aspectRatio) {
                    w = Math.max(w, h * aspectRatio);
                    h = w / aspectRatio;
                }
            }

            if (aspectRatio || ability === 0 || ability === 2) {
                geometryToEdit.setWidth(w * r);
                if (geometryToEdit !== this._geometry) {
                    this._geometry.setWidth(w * r);
                }
            }
            if (aspectRatio || ability === 1 || ability === 2) {
                geometryToEdit.setHeight(h * r);
                if (geometryToEdit !== this._geometry) {
                    this._geometry.setHeight(h * r);
                }
            }
        }, () => {
            this._update(getUpdates());
        });

        function getUpdates() {
            return [
                ['setCoordinates', geometryToEdit.getCoordinates().toArray()],
                ['setWidth', geometryToEdit.getWidth()],
                ['setHeight', geometryToEdit.getHeight()]
            ];
        }
    }

    /**
     * Editor for polygon
     * @private
     */
    createPolygonEditor() {

        const map = this.getMap(),
            geoToEdit = this._shadow || this._geometry,
            me = this;
        if (!this._history) {
            this._recordHistory('setCoordinates', Coordinate.toNumberArrays(geoToEdit.getCoordinates()));
        }

        const verticeLimit = geoToEdit instanceof Polygon ? 3 : 2;
        const propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        //{ ringIndex:ring }
        const vertexHandles = { 0: [] },
            newVertexHandles = { 0: [] };

        //大面积调用这个方法是非常耗时的
        function getVertexCoordinates(ringIndex = 0) {
            if (geoToEdit instanceof Polygon) {
                const coordinates = geoToEdit.getCoordinates()[ringIndex] || [];
                return coordinates.slice(0, coordinates.length - 1);
            } else {
                return geoToEdit.getCoordinates();
            }
        }

        function getVertexPrjCoordinates(ringIndex = 0) {
            if (ringIndex === 0) {
                return geoToEdit._getPrjCoordinates();
            }
            return geoToEdit._getPrjHoles()[ringIndex - 1];
        }

        function onVertexAddOrRemove() {
            //restore index property of each handles.
            for (const ringIndex in vertexHandles) {
                for (let i = vertexHandles[ringIndex].length - 1; i >= 0; i--) {
                    vertexHandles[ringIndex][i][propertyOfVertexIndex] = i;
                }
                for (let i = newVertexHandles[ringIndex].length - 1; i >= 0; i--) {
                    newVertexHandles[ringIndex][i][propertyOfVertexIndex] = i;
                }
            }
            me._updateCoordFromShadow();
        }

        function removeVertex(param) {
            me._updating = true;
            const handle = param['target'],
                index = handle[propertyOfVertexIndex];
            const ringIndex = isNumber(handle._ringIndex) ? handle._ringIndex : 0;
            const prjCoordinates = getVertexPrjCoordinates(ringIndex);
            if (prjCoordinates.length <= verticeLimit) {
                return;
            }
            const isEnd = (geoToEdit instanceof LineString) && (index === 0 || index === prjCoordinates.length - 1);
            prjCoordinates.splice(index, 1);
            if (ringIndex > 0) {
                //update hole prj
                geoToEdit._prjHoles[ringIndex - 1] = prjCoordinates;
            } else {
                //update shell prj
                geoToEdit._setPrjCoordinates(prjCoordinates);
            }
            geoToEdit._updateCache();
            //remove vertex handle
            vertexHandles[ringIndex].splice(index, 1)[0].delete();
            //remove two neighbor "new vertex" handles
            if (index < newVertexHandles[ringIndex].length) {
                newVertexHandles[ringIndex].splice(index, 1)[0].delete();
            }
            let nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles[ringIndex].length - 1;
            } else {
                nextIndex = index - 1;
            }
            newVertexHandles[ringIndex].splice(nextIndex, 1)[0].delete();
            if (!isEnd) {
                //add a new "new vertex" handle.
                newVertexHandles[ringIndex].splice(nextIndex, 0, createNewVertexHandle.call(me, nextIndex, ringIndex));
            }
            if (ringIndex > 0) {
                const coordiantes = geoToEdit.getCoordinates();
                //fix hole Vertex delete
                const ring = coordiantes[ringIndex];
                if (ring && Array.isArray(ring) && ring.length > 1) {
                    ring.splice(index, 1);
                    //update shadow coordinates
                    if (geoToEdit !== this._geometry) {
                        geoToEdit.setCoordinates(coordiantes);
                    }
                }
            }
            onVertexAddOrRemove();
            me._updating = false;
        }

        function moveVertexHandle(handleConatainerPoint, index, ringIndex = 0) {
            //for adsorption effect
            const snapTo = me._geometry.snapTo;
            if (snapTo && isFunction(snapTo)) {
                handleConatainerPoint = me._geometry.snapTo(handleConatainerPoint) || handleConatainerPoint;
            }
            const vertice = getVertexPrjCoordinates(ringIndex);
            const nVertex = map._containerPointToPrj(handleConatainerPoint.sub(getDxDy()));
            const pVertex = vertice[index];
            pVertex.x = nVertex.x;
            pVertex.y = nVertex.y;
            geoToEdit._updateCache();
            geoToEdit.onShapeChanged();
            me._updateCoordFromShadow(true);
            let nextIndex;
            if (index === 0) {
                nextIndex = newVertexHandles[ringIndex].length - 1;
            } else {
                nextIndex = index - 1;
            }
            //refresh two neighbor "new vertex" handles.
            if (newVertexHandles[ringIndex][index]) {
                newVertexHandles[ringIndex][index].refresh();
            }
            if (newVertexHandles[ringIndex][nextIndex]) {
                newVertexHandles[ringIndex][nextIndex].refresh();
            }
        }

        const hanldeDxdy = new Point(0, 0);
        function getDxDy() {
            const compiledSymbol = geoToEdit._getCompiledSymbol();
            hanldeDxdy.x = compiledSymbol.lineDx || 0;
            hanldeDxdy.y = compiledSymbol.lineDy || 0;
            return hanldeDxdy;
        }

        function createVertexHandle(index, ringIndex = 0, ringCoordinates) {
            //not get geometry coordiantes when ringCoordinates is not null
            //每个vertex都去获取geometry的coordinates太耗时了，应该所有vertex都复用传进来的ringCoordinates
            let vertex = (ringCoordinates || getVertexCoordinates(ringIndex))[index];
            const handle = me.createHandle(map.coordToContainerPoint(vertex)._add(getDxDy()), {
                'symbol': me.options['vertexHandleSymbol'],
                'cursor': 'pointer',
                'axis': null,
                onMove: function () {
                    moveVertexHandle(handle.getContainerPoint(), handle[propertyOfVertexIndex], ringIndex);
                },
                onRefresh: function (rIndex, ringCoordinates) {
                    vertex = (ringCoordinates || getVertexCoordinates(ringIndex))[handle[propertyOfVertexIndex]];
                    const containerPoint = map.coordToContainerPoint(vertex);
                    handle.setContainerPoint(containerPoint._add(getDxDy()));
                },
                onUp: function () {
                    me._updateCoordFromShadow();
                },
                onDown: function (param, e) {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        return;
                    }
                }
            });
            handle[propertyOfVertexIndex] = index;
            handle._ringIndex = ringIndex;
            handle.on(me.options['removeVertexOn'], removeVertex);
            return handle;
        }

        let pauseRefresh = false;
        function createNewVertexHandle(index, ringIndex = 0, ringCoordinates) {
            let vertexCoordinates = ringCoordinates || getVertexCoordinates(ringIndex);
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
                    const prjCoordinates = getVertexPrjCoordinates(ringIndex);
                    const vertexIndex = handle[propertyOfVertexIndex];
                    //add a new vertex
                    const cp = handle.getContainerPoint();
                    const pVertex = map._containerPointToPrj(cp);
                    //update shadow's vertice
                    prjCoordinates.splice(vertexIndex + 1, 0, pVertex);
                    if (ringIndex > 0) {
                        //update hole
                        geoToEdit._prjHoles[ringIndex - 1] = prjCoordinates;
                    } else {
                        geoToEdit._setPrjCoordinates(prjCoordinates);
                    }
                    geoToEdit._updateCache();

                    handle.opacity = 1;

                    //add two "new vertex" handles
                    newVertexHandles[ringIndex].splice(vertexIndex, 0, createNewVertexHandle.call(me, vertexIndex, ringIndex), createNewVertexHandle.call(me, vertexIndex + 1, ringIndex));
                    pauseRefresh = true;
                },
                onMove: function () {
                    moveVertexHandle(handle.getContainerPoint(), handle[propertyOfVertexIndex] + 1, ringIndex);
                },
                onUp: function (e) {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        pauseRefresh = false;
                        return;
                    }
                    const vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    removeFromArray(handle, newVertexHandles[ringIndex]);
                    handle.delete();
                    //add a new vertex handle
                    vertexHandles[ringIndex].splice(vertexIndex + 1, 0, createVertexHandle.call(me, vertexIndex + 1, ringIndex));
                    onVertexAddOrRemove();
                    me._updateCoordFromShadow();
                    pauseRefresh = false;
                },
                onRefresh: function (rIndex, ringCoordinates) {
                    vertexCoordinates = ringCoordinates || getVertexCoordinates(rIndex);
                    const vertexIndex = handle[propertyOfVertexIndex];
                    let nextIndex;
                    if (vertexIndex === vertexCoordinates.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = vertexIndex + 1;
                    }
                    const refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1 / 2);
                    const containerPoint = map.coordToContainerPoint(refreshVertex);
                    handle.setContainerPoint(containerPoint._add(getDxDy()));
                }
            });
            handle[propertyOfVertexIndex] = index;
            return handle;
        }
        if (geoToEdit instanceof Polygon) {
            const rings = geoToEdit.getHoles().length + 1;
            for (let ringIndex = 0; ringIndex < rings; ringIndex++) {
                vertexHandles[ringIndex] = [];
                newVertexHandles[ringIndex] = [];
                const vertexCoordinates = getVertexCoordinates(ringIndex);
                for (let i = 0, len = vertexCoordinates.length; i < len; i++) {
                    //reuse vertexCoordinates
                    vertexHandles[ringIndex].push(createVertexHandle.call(this, i, ringIndex, vertexCoordinates));
                    if (i < len - 1) {
                        //reuse vertexCoordinates
                        newVertexHandles[ringIndex].push(createNewVertexHandle.call(this, i, ringIndex, vertexCoordinates));
                    }
                }
                //1 more vertex handle for polygon
                newVertexHandles[ringIndex].push(createNewVertexHandle.call(this, vertexCoordinates.length - 1, ringIndex, vertexCoordinates));
            }

        } else {
            const ringIndex = 0;
            const vertexCoordinates = getVertexCoordinates(ringIndex);
            for (let i = 0, len = vertexCoordinates.length; i < len; i++) {
                vertexHandles[ringIndex].push(createVertexHandle.call(this, i, ringIndex, vertexCoordinates));
                if (i < len - 1) {
                    newVertexHandles[ringIndex].push(createNewVertexHandle.call(this, i, ringIndex, vertexCoordinates));
                }
            }
            if (newVertexHandles[ringIndex].length && geoToEdit.getCoordinates().length === 2) {
                newVertexHandles[ringIndex][0].options.symbol['markerDx'] = 12;
            }
        }
        this._addRefreshHook(() => {
            if (pauseRefresh) {
                return;
            }
            for (const ringIndex in newVertexHandles) {
                const ringCoordinates = getVertexCoordinates(ringIndex);
                for (let i = newVertexHandles[ringIndex].length - 1; i >= 0; i--) {
                    //reuse ringCoordinates
                    newVertexHandles[ringIndex][i].refresh(ringIndex, ringCoordinates);
                }
            }
            if (newVertexHandles[0].length && geoToEdit instanceof LineString) {
                if (geoToEdit.getCoordinates().length === 2) {
                    newVertexHandles[0][0].options.symbol['markerDx'] = 12;
                } else if (geoToEdit.getCoordinates().length > 2) {
                    newVertexHandles[0][0].options.symbol['markerDx'] = 0;
                }
            }
            for (const ringIndex in vertexHandles) {
                const ringCoordinates = getVertexCoordinates(ringIndex);
                for (let i = vertexHandles[ringIndex].length - 1; i >= 0; i--) {
                    //reuse ringCoordinates
                    vertexHandles[ringIndex][i].refresh(ringIndex, ringCoordinates);
                }
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
        const geoToEdit = this._shadow || this._geometry;

        const coords = geoToEdit.getCoordinates();
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

        if (this._history.length) {
            const lastOperation = this._history[this._history.length - 1];
            if (lastOperation[0] === method && JSON.stringify(lastOperation[1]) === JSON.stringify(args)) {
                return;
            }
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

    cancel() {
        if (!this._history || this._historyPointer === 0) {
            return this;
        }
        this._historyPointer = 0;
        const record = this._history[0];
        this._exeAndReset(record);
        return this;
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
            return this;
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

    _onDragStart() {
        this._updating = true;
    }

    _onDragEnd() {
        this._updating = false;
    }

    _exeHistory(record) {
        if (!Array.isArray(record)) {
            return;
        }
        const updating = this._updating;
        this._updating = true;
        const geoToEdit = this._shadow || this._geometry;
        const geo = this._geometry;
        if (Array.isArray(record[0])) {
            record[0].forEach(o => {
                const m = o[0],
                    args = o.slice(1);
                geoToEdit[m].apply(geoToEdit, args);
                if (geoToEdit !== geo) {
                    geo[m].apply(geo, args);
                }
            });
        } else {
            geoToEdit[record[0]].apply(geoToEdit, record[1]);
            if (geoToEdit !== geo) {
                geo[record[0]].apply(geo, record[1]);
            }
        }
        this._updating = updating;
    }

}

GeometryEditor.mergeOptions(options);

export default GeometryEditor;
