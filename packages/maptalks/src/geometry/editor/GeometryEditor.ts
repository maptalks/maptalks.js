import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil, isNumber, sign, removeFromArray, UID, isFunction } from '../../core/util';
import { lowerSymbolOpacity } from '../../core/util/style';
import Class from '../../core/Class';
import Eventable from '../../core/Eventable';
import Point from '../../geo/Point';
import Coordinate from '../../geo/Coordinate';
import { Marker, TextBox, LineString, Polygon, Circle, Ellipse, Sector, Rectangle, Geometry } from '../';
import EditHandle from '../../renderer/edit/EditHandle';
import EditOutline from '../../renderer/edit/EditOutline';
import { loadFunctionTypes } from '../../core/mapbox';
import * as Symbolizers from '../../renderer/geometry/symbolizers';
import { GeometryEditOptionsType, GeometryEditSymbolType } from '../ext/Geometry.Edit';
import { getDefaultBBOX, pointsBBOX } from '../../core/util/bbox';
import Extent from '../../geo/Extent';

const EDIT_STAGE_LAYER_PREFIX = INTERNAL_LAYER_PREFIX + '_edit_stage_';

type GeometryEvents = {
    'symbolchange': any,
    // prevent _exeAndReset when dragging geometry in gl layers
    'dragstart': any,
    'dragend': any,
    'positionchange shapechange': any,
}

function createHandleSymbol(markerType: string, opacity: number): GeometryEditSymbolType {
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

/**
 * coordinate to containerPoint with altitude
 * @param map 
 * @param coordinate 
 * @returns 
 */
function coordinatesToContainerPoint(map, coordinate) {
    const glRes = map.getGLRes();
    //coordinates to glpoint
    const renderPoints = map.coordToPointAtRes(coordinate, glRes);
    const altitude = coordinate.z || 0;
    const point = map._pointAtResToContainerPoint(renderPoints, glRes, altitude);
    return point;
}


export function fixHandlePointCoordinates(geometry: Geometry, vertex: Coordinate, dragContainerPoint: Point) {
    const map = geometry.getMap();
    if (!vertex || vertex.z === 0) {
        return map.containerPointToCoord(dragContainerPoint)
    }
    const altitude = vertex.z;
    const glRes = map.getGLRes();
    //coordinates to glpoint
    const renderPoints = map.coordToPointAtRes(vertex, glRes);
    //没有海拔下的屏幕坐标
    const point1 = map._pointAtResToContainerPoint(renderPoints, glRes, 0);
    //有海拔下的屏幕坐标
    const point2 = map._pointAtResToContainerPoint(renderPoints, glRes, altitude);
    //屏幕坐标的偏移量
    const offset = point2.sub(point1);
    const containerPoint = dragContainerPoint.sub(offset);
    const coordinates = map.containerPointToCoord(containerPoint);
    coordinates.z = 0;
    const isPoint = !geometry.getGeometries && geometry.isPoint;
    if (isPoint) {
        coordinates.z = altitude;
    }
    return coordinates;


}

function onHandleDragstart(param: Record<string, any>): boolean {
    const geometryEditor = this.target;
    const opts = this.paramOptions;
    geometryEditor._updating = true;
    if (opts.onDown) {
        opts.onDown.call(geometryEditor, param['containerPoint'], param);
        /**
         * 更改几何图形启动事件，在拖动以更改几何图形时激发
         * @english
         * change geometry shape start event, fired when drag to change geometry shape.
         *
         * @event Geometry#handledragstart
         * @type {Object}
         * @property {String} type - handledragstart
         * @property {Geometry} target - the geometry fires the event
         */
        geometryEditor._geometry.fire('handledragstart');
    }
    return false;
}

function onHandleDragging(param: Record<string, any>): boolean {
    const geometryEditor = this.target;
    const opts = this.paramOptions;
    geometryEditor._hideContext();
    if (opts.onMove) {
        opts.onMove.call(geometryEditor, param);
        /**
         * 更改几何图形事件，在拖动以更改几何图形时激发
         * @english
         * changing geometry shape event, fired when dragging to change geometry shape.
         *
         * @event Geometry#handledragging
         * @type {Object}
         * @property {String} type - handledragging
         * @property {Geometry} target - the geometry fires the event
         */
        geometryEditor._geometry.fire('handledragging');
    }
    return false;
}

function onHandleDragEnd(ev: Record<string, any>): boolean {
    const geometryEditor = this.target;
    const opts = this.paramOptions;
    if (opts.onUp) {
        //run mouseup code for handle delete etc
        opts.onUp.call(geometryEditor, ev);
        /**
         * changed geometry shape event, fired when drag end to change geometry shape.
         *
         * @event Geometry#handledragend
         * @type {Object}
         * @property {String} type - handledragend
         * @property {Geometry} target - the geometry fires the event
         */
        geometryEditor._geometry.fire('handledragend');
    }
    geometryEditor._updating = false;
    return false;
}

const options: GeometryEditOptionsType = {
    //fix outline's aspect ratio when resizing
    'fixAspectRatio': false,
    // geometry's symbol when editing
    'symbol': null,
    'removeVertexOn': 'contextmenu',
    //symbols of edit handles
    'centerHandleSymbol': createHandleSymbol('ellipse', 1),
    'vertexHandleSymbol': createHandleSymbol('square', 1),
    'newVertexHandleSymbol': createHandleSymbol('square', 0.4),
    'collision': false,
    'collisionBufferSize': 0,
    'vertexZIndex': 0,
    'newVertexZIndex': 0,
    'shadowDraggable': false
};

/**
 * 内部使用的几何图形编辑器
 * @english
 * Geometry editor used internally for geometry editing.
 * @category geometry
 * @protected
 * @extends Class
 * @mixes Eventable
 */
class GeometryEditor extends Eventable(Class) {

    //@internal
    _geometry: any;
    //@internal
    _originalSymbol: any
    //@internal
    _shadowLayer: any
    //@internal
    _shadow: any
    //@internal
    _geometryDraggble: boolean
    //@internal
    _history: any
    //@internal
    _historyPointer: any
    //@internal
    _editOutline: any
    //@internal
    _refreshHooks: Array<any>
    //@internal
    _updating: boolean
    editing: boolean;
    options: GeometryEditOptionsType;

    /**
     * @param {Geometry} geometry geometry to edit
     * @param {Object} [opts=null] options
     * @param {Object} [opts.symbol=null] symbol of being edited.
     */
    constructor(geometry, opts: GeometryEditOptionsType) {
        super(opts);
        this._geometry = geometry;
        if (!this._geometry) {
            return;
        }
    }

    /**
     * 获取地图对象
     * @english
     * Get map
     * @return {Map} map
     */
    getMap(): any {
        return this._geometry.getMap();
    }

    /**
     * 准备编辑
     * @english
     * Prepare to edit
     */
    prepare(): void {
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

    //@internal
    _prepareEditStageLayer(): void {
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
     * 开始编辑
     * @english
     * Start to edit
     */
    start(): void {
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
                'draggable': this.options.shadowDraggable
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
     * 停止编辑
     * @english
     * Stop editing
     */
    stop(): void {
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
     * 编辑器是否在编辑
     * @english
     * Whether the editor is editing
     * @return {Boolean}
     */
    isEditing(): boolean {
        if (isNil(this.editing)) {
            return false;
        }
        return this.editing;
    }

    //@internal
    _getGeometryEvents(): GeometryEvents {
        return {
            'symbolchange': this._onGeoSymbolChange,
            // prevent _exeAndReset when dragging geometry in gl layers
            'dragstart': this._onDragStart,
            'dragend': this._onDragEnd,
            'positionchange shapechange': this._exeAndReset,
        };
    }

    //@internal
    _switchGeometryEvents(oper: any): void {
        if (this._geometry) {
            const events = this._getGeometryEvents();
            for (const p in events) {
                this._geometry[oper](p, events[p], this);
            }
        }
    }

    //@internal
    _onGeoSymbolChange(param: any): void {
        if (this._shadow) {
            this._shadow.setSymbol(param.target._getInternalSymbol());
        }
    }

    //@internal
    _onMarkerDragEnd(): void {
        this._update('setCoordinates', this._shadow.getCoordinates().toArray());
    }

    /**
     * 创建几何图形的矩形轮廓
     * @english
     * create rectangle outline of the geometry
     * @private
     */
    //@internal
    _createOrRefreshOutline(): any {
        const geometry = this._geometry;
        const outline = this._editOutline;
        if (!outline) {
            this._editOutline = new EditOutline(this, this.getMap());
            this._addRefreshHook(this._createOrRefreshOutline);
        }
        const points = this._editOutline.points;

        if (geometry instanceof Marker) {
            this._editOutline.setPoints(geometry.getContainerExtent().toArray(points));
        } else {
            // const map = this.getMap();
            // const extent = geometry._getPrjExtent();
            // points = extent.toArray(points);
            // points.forEach(c => map.prjToContainerPoint(c, null, c));
            // this._editOutline.setPoints(points);

            const coordinates = geometry.getShell();
            const editCenter = geometry._getEditCenter();
            const bbox = getDefaultBBOX();
            pointsBBOX(coordinates, bbox);
            const extent = new Extent(bbox[0], bbox[1], bbox[2], bbox[3]);
            const map = this.getMap();
            const points = extent.toArray().map(c => {
                c.z = editCenter.z;
                return coordinatesToContainerPoint(map, c);
            })
            this._editOutline.setPoints(points);
        }

        return outline;
    }


    //@internal
    _createCenterHandle(): void {
        const map = this.getMap();
        const symbol = this.options['centerHandleSymbol'];
        let shadow;
        // const cointainerPoint = map.coordToContainerPoint(this._geometry.getCenter());
        const cointainerPoint = coordinatesToContainerPoint(map, this._geometry._getEditCenter());
        const handle = this.createHandle(cointainerPoint, {
            ignoreCollision: true,
            'symbol': symbol,
            'cursor': 'move',
            onDown: (): void => {
                if (this._shadow) {
                    shadow = this._shadow.copy();
                    const symbol = lowerSymbolOpacity(shadow._getInternalSymbol(), 0.5);
                    shadow.setSymbol(symbol).addTo(this._geometry.getLayer());
                }
            },
            onMove: (param): void => {
                const offset = param['coordOffset'];
                if (shadow) {
                    shadow.translate(offset);
                } else {
                    this._geometry.translate(offset);
                }
            },
            onUp: (): void => {
                if (shadow) {
                    const shadowFirst = shadow.getFirstCoordinate();
                    const first = this._geometry.getFirstCoordinate();
                    const offset = shadowFirst.sub(first);
                    this._update('translate', offset);
                    shadow.remove();
                }
            }
        });
        this._addRefreshHook((): void => {
            // const center = this._geometry.getCenter();
            // handle.setContainerPoint(map.coordToContainerPoint(center));
            const center = this._geometry._getEditCenter();
            handle.setContainerPoint(coordinatesToContainerPoint(map, center));
        });
    }

    //@internal
    _createHandleInstance(containerPoint: Point, opts: GeometryEditOptionsType): EditHandle {
        opts = opts || {};
        const map = this.getMap();
        const symbol = loadFunctionTypes(opts['symbol'], (): any => {
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
        const handle = new EditHandle(this, map, { symbol, cursor: opts['cursor'], events: removeVertexOn as any, ignoreCollision: (opts as any).ignoreCollision });
        handle.setContainerPoint(containerPoint);
        return handle;
    }

    createHandle(containerPoint: any, opts: any): EditHandle {
        if (!opts) {
            opts = {};
        }
        const handle = this._createHandleInstance(containerPoint, opts);
        handle.paramOptions = opts;

        handle.on('dragstart', onHandleDragstart);
        handle.on('dragging', onHandleDragging);
        handle.on('dragend', onHandleDragEnd);
        //拖动移图
        if (opts.onRefresh) {
            handle.refresh = opts.onRefresh;
        }
        return handle;
    }

    /**
     * 为几何图形创建可以调整大小的事件
     * @english
     * create resize handles for geometry that can resize.
     * @param {Array} blackList handle indexes that doesn't display, to prevent change a geometry's coordinates
     * @param {fn} onHandleMove callback
     * @private
     */
    //@internal
    _createResizeHandles(blackList: Array<any>, onHandleMove: any, onHandleUp: any): any {
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
        let coords = [];
        function getResizeAnchors(): any {
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
            // const ext = geometry._getPrjExtent();
            //Rect,Ellipse,Circle etc
            const coordinates = geometry.getShell();
            const editCenter = geometry._getEditCenter();
            const bbox = getDefaultBBOX();
            pointsBBOX(coordinates, bbox);
            const extent = new Extent(bbox[0], bbox[1], bbox[2], bbox[3]);
            coords = [
                new Coordinate(extent['xmin'], extent['ymax']),
                new Coordinate((extent['xmax'] + extent['xmin']) / 2, extent['ymax']),
                new Coordinate(extent['xmax'], extent['ymax']),
                new Coordinate(extent['xmin'], (extent['ymax'] + extent['ymin']) / 2),
                new Coordinate(extent['xmax'], (extent['ymax'] + extent['ymin']) / 2),
                new Coordinate(extent['xmin'], extent['ymin']),
                new Coordinate((extent['xmax'] + extent['xmin']) / 2, extent['ymin']),
                new Coordinate(extent['xmax'], extent['ymin']),
            ];
            return coords.map(c => {
                c.z = editCenter.z;
                return coordinatesToContainerPoint(map, c);
            })
            // return [
            //     // ext.getMin(),
            //     // new Point(ext['xmin'], ext['ymax']),
            //     // new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymax']),
            //     // new Point(ext['xmax'], ext['ymax']),
            //     // new Point(ext['xmin'], (ext['ymax'] + ext['ymin']) / 2),
            //     // new Point(ext['xmax'], (ext['ymax'] + ext['ymin']) / 2),
            //     // new Point(ext['xmin'], ext['ymin']),
            //     // new Point((ext['xmax'] + ext['xmin']) / 2, ext['ymin']),
            //     // new Point(ext['xmax'], ext['ymin']),
            // ];
        }
        if (!blackList) {
            blackList = [];
        }
        const me = this;
        const resizeHandles = [],
            anchorIndexes = {},
            map = this.getMap(),
            handleSymbol = this.options['vertexHandleSymbol'];
        const fnLocateHandles = (): void => {
            const anchors = getResizeAnchors();
            for (let i = 0; i < anchors.length; i++) {
                //ignore anchors in blacklist
                if (Array.isArray(blackList)) {
                    const isBlack = blackList.some(ele => ele === i);
                    if (isBlack) {
                        continue;
                    }
                }
                const anchor = anchors[i], point = anchor, coord = coords[i];

                // point = isMarker ? anchor : map.prjToContainerPoint(anchor);
                if (resizeHandles.length < (anchors.length - blackList.length)) {
                    const handle = this.createHandle(point, {
                        'symbol': handleSymbol,
                        'cursor': cursors[i],
                        'axis': axis[i],
                        onMove: (function (_index: number): any {
                            return function (e: any): void {
                                me._updating = true;
                                onHandleMove(e.containerPoint, _index);
                                geometry.fire('resizing');
                            };
                        })(i),
                        onUp: (): void => {
                            me._updating = false;
                            onHandleUp();
                        }
                    });
                    // handle.setId(i);
                    anchorIndexes[i] = resizeHandles.length;
                    resizeHandles.push(handle);
                    //record handle coordinates
                    handle.coord = coord;
                } else {
                    //record handle coordinates
                    resizeHandles[anchorIndexes[i]].coord = coord;
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
     * 创建标记编辑器
     * @english
     * Create marker editor
     * @private
     */
    createMarkerEditor(): void {
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

        const resizeHandles = this._createResizeHandles(blackList, (containerPoint: any, i: number): void => {
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
            // const viewCenter = map.coordToContainerPoint(geometryToEdit.getCoordinates()).add(dxdy),
            const viewCenter = coordinatesToContainerPoint(map, geometryToEdit._getEditCenter()).add(dxdy),
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
        }, (): void => {
            this._update(getUpdates());
        });

        function getUpdates(): any {
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
     * 创建圆形编辑器
     * @english
     * Create circle editor
     * @private
     */
    createCircleEditor(): void {
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
            // const mouseCoordinate = map.containerPointToCoord(handleContainerPoint);
            const mouseCoordinate = fixHandlePointCoordinates(geo, center, handleContainerPoint);
            const wline = new LineString([[center.x, center.y], [mouseCoordinate.x, center.y]]);
            const hline = new LineString([[center.x, center.y], [center.x, mouseCoordinate.y]]);
            const r = Math.max(map.computeGeometryLength(wline), map.computeGeometryLength(hline));
            geo.setRadius(r);
            if (geo !== this._geometry) {
                this._geometry.setRadius(r);
            }
        }, (): void => {
            this._update('setRadius', geo.getRadius());
        });
    }

    /**
     * 创建椭圆或者矩形编辑器
     * @english
     * editor of ellipse or rectangle
     * @private
     */
    createEllipseOrRectEditor(): void {
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
        const resizeHandles = this._createResizeHandles(null, (mouseContainerPoint: any, i: number): void => {
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
                // const mouseCoordinate = map.containerPointToCoord(mouseContainerPoint);
                const mirrorCoordinate = mirror.coord;
                const mouseCoordinate = fixHandlePointCoordinates(geometryToEdit, geoCoord, mouseContainerPoint);
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
                mouseCoordinate.z = geoCoord.z;
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
                // const mouseCoordinate = map.containerPointToCoord(targetPoint);
                const mouseCoordinate = fixHandlePointCoordinates(geometryToEdit, center, mouseContainerPoint);
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
        }, (): void => {
            this._update(getUpdates());
        });

        function getUpdates(): object {
            return [
                ['setCoordinates', geometryToEdit.getCoordinates().toArray()],
                ['setWidth', geometryToEdit.getWidth()],
                ['setHeight', geometryToEdit.getHeight()]
            ];
        }
    }

    /**
     * 创建多边形编辑器
     * @english
     * Editor for polygon
     * @private
     */
    createPolygonEditor(): void {

        const map = this.getMap(),
            geoToEdit = this._shadow || this._geometry,
            me = this;
        if (!this._history) {
            this._recordHistory('setCoordinates', Coordinate.toNumberArrays(geoToEdit.getCoordinates()));
        }

        const verticeLimit = geoToEdit instanceof Polygon ? 3 : 2;
        const propertyOfVertexIndex = 'maptalks--editor-vertex-index';
        const { vertexZIndex, newVertexZIndex } = this.options;
        //{ ringIndex:ring }
        const vertexHandles = { 0: [] },
            newVertexHandles = { 0: [] };

        function updatePolyCoordinates(coordinates, ringIndex) {
            if (geoToEdit instanceof Polygon) {
                const rings = geoToEdit.getCoordinates();
                rings[ringIndex] = coordinates;
                geoToEdit.setCoordinates(rings);
            } else {
                geoToEdit.setCoordinates(coordinates);
            }
        }

        //大面积调用这个方法是非常耗时的
        function getVertexCoordinates(ringIndex: any = 0): Array<Coordinate> {
            if (geoToEdit instanceof Polygon) {
                const coordinates = geoToEdit.getCoordinates()[ringIndex] || [];
                return coordinates.slice(0, coordinates.length - 1);
            } else {
                return geoToEdit.getCoordinates();
            }
        }

        // function getVertexPrjCoordinates(ringIndex: number = 0): any {
        //     if (ringIndex === 0) {
        //         return geoToEdit._getPrjCoordinates();
        //     }
        //     return geoToEdit._getPrjHoles()[ringIndex - 1];
        // }

        function onVertexAddOrRemove(): void {
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

        function removeVertex(param: any): void {
            me._updating = true;
            const handle = param['target'],
                index = handle[propertyOfVertexIndex];
            const ringIndex = isNumber(handle._ringIndex) ? handle._ringIndex : 0;
            // const prjCoordinates = getVertexPrjCoordinates(ringIndex);
            // if (prjCoordinates.length <= verticeLimit) {
            //     return;
            // }
            // const isEnd = (geoToEdit instanceof LineString) && (index === 0 || index === prjCoordinates.length - 1);
            // prjCoordinates.splice(index, 1);

            // if (ringIndex > 0) {
            //     //update hole prj
            //     geoToEdit._prjHoles[ringIndex - 1] = prjCoordinates;
            // } else {
            //     //update shell prj
            //     geoToEdit._setPrjCoordinates(prjCoordinates);
            // }
            // geoToEdit._updateCache();

            const coordinates = getVertexCoordinates(ringIndex);
            if (coordinates.length <= verticeLimit) {
                console.warn(` Geometry.${geoToEdit.type} Require at least ${verticeLimit} vertices,Geometry: `, geoToEdit)
                return;
            }

            coordinates.splice(index, 1);

            updatePolyCoordinates(coordinates, ringIndex);

            //第一个顶点
            if (index === 0) {
                newVertexHandles[ringIndex][0].delete();
                newVertexHandles[ringIndex].splice(0, 1);
                //最后一个顶点
            } else if (index === vertexHandles[ringIndex].length - 1) {
                const len = newVertexHandles[ringIndex].length;
                newVertexHandles[ringIndex][len - 1].delete();
                newVertexHandles[ringIndex].splice(len - 1, 1);
            } else {
                //中间的顶点,删除两次
                newVertexHandles[ringIndex][index - 1].delete();
                newVertexHandles[ringIndex].splice(index - 1, 1);
                newVertexHandles[ringIndex][index - 1].delete();
                newVertexHandles[ringIndex].splice(index - 1, 1);

                newVertexHandles[ringIndex].splice(index - 1, 0, createNewVertexHandle.call(me, index - 1, ringIndex));
            }

            //remove vertex handle
            vertexHandles[ringIndex].splice(index, 1)[0].delete();

            if (ringIndex > 0) {
                const coordiantes = geoToEdit.getCoordinates();
                //fix hole Vertex delete
                const ring = coordiantes[ringIndex];
                if (ring && Array.isArray(ring) && ring.length > 1) {
                    //上面投影坐标里已经处理过了
                    // ring.splice(index, 1);
                    //update shadow coordinates
                    if (geoToEdit !== this._geometry) {
                        geoToEdit.setCoordinates(coordiantes);
                    }
                }
            }
            onVertexAddOrRemove();
            me._updating = false;

            /**
             * changed geometry shape event, fired when edit control vertex  remove
             *
             * @event Geometry#handleremove
             * @type {Object}
             * @property {String} type - handleremove
             * @property {Geometry} target - the geometry fires the event
             */
            me._geometry.fire('handleremove', Object.assign({}, param, { coordinate: map.containerPointToCoordinate(param.containerPoint), vertex: param.target }));
        }

        function moveVertexHandle(handleConatainerPoint: any, index: number, ringIndex: number = 0): void {
            //for adsorption effect
            const snapTo = me._geometry.snapTo;
            if (snapTo && isFunction(snapTo)) {
                handleConatainerPoint = me._geometry.snapTo(handleConatainerPoint) || handleConatainerPoint;
            }
            // const vertice = getVertexPrjCoordinates(ringIndex);
            // const nVertex = map._containerPointToPrj(handleConatainerPoint.sub(getDxDy()));
            // const pVertex = vertice[index];
            // pVertex.x = nVertex.x;
            // pVertex.y = nVertex.y;
            // geoToEdit._updateCache();
            // geoToEdit.onShapeChanged();

            const coordinates = getVertexCoordinates(ringIndex);
            const containerPoint = handleConatainerPoint.sub(getDxDy());
            const coordinate = fixHandlePointCoordinates(me._geometry, coordinates[index], containerPoint);
            const vertex = coordinates[index];
            vertex.x = coordinate.x;
            vertex.y = coordinate.y;
            geoToEdit.setCoordinates(geoToEdit.getCoordinates());


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
        function getDxDy(): any {
            const compiledSymbol = geoToEdit._getCompiledSymbol();
            hanldeDxdy.x = compiledSymbol.lineDx || 0;
            hanldeDxdy.y = compiledSymbol.lineDy || 0;
            return hanldeDxdy;
        }

        function createVertexHandle(index: number, ringIndex: number = 0, ringCoordinates: any) {
            //not get geometry coordiantes when ringCoordinates is not null
            //每个vertex都去获取geometry的coordinates太耗时了，应该所有vertex都复用传进来的ringCoordinates
            let vertex = (ringCoordinates || getVertexCoordinates(ringIndex))[index];
            // map.coordToContainerPoint(vertex)._add(getDxDy())
            const containerPoint = coordinatesToContainerPoint(map, vertex)._add(getDxDy());
            const handle = me.createHandle(containerPoint, {
                'symbol': me.options['vertexHandleSymbol'],
                'cursor': 'pointer',
                'axis': null,
                onMove: function () {
                    moveVertexHandle(handle.getContainerPoint(), handle[propertyOfVertexIndex], ringIndex);
                },
                onRefresh: function (rIndex, ringCoordinates) {
                    vertex = (ringCoordinates || getVertexCoordinates(ringIndex))[handle[propertyOfVertexIndex]];
                    if (vertex) {
                        // const containerPoint = map.coordToContainerPoint(vertex);
                        const containerPoint = coordinatesToContainerPoint(map, vertex);
                        handle.setContainerPoint(containerPoint._add(getDxDy()));
                    }
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
            handle.setZIndex(vertexZIndex);
            return handle;
        }

        let pauseRefresh = false;
        function createNewVertexHandle(index: number, ringIndex: number = 0, ringCoordinates: Array<Coordinate>): any {
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
                onDown: function (param: any, e: any): any {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        return;
                    }
                    // const prjCoordinates = getVertexPrjCoordinates(ringIndex);
                    // const vertexIndex = handle[propertyOfVertexIndex];
                    // //add a new vertex
                    // const cp = handle.getContainerPoint();
                    // const pVertex = map._containerPointToPrj(cp);
                    // //update shadow's vertice
                    // prjCoordinates.splice(vertexIndex + 1, 0, pVertex);
                    // if (ringIndex > 0) {
                    //     //update hole
                    //     geoToEdit._prjHoles[ringIndex - 1] = prjCoordinates;
                    // } else {
                    //     geoToEdit._setPrjCoordinates(prjCoordinates);
                    // }
                    // geoToEdit._updateCache();

                    const coordinates = getVertexCoordinates(ringIndex);
                    const vertexIndex = handle[propertyOfVertexIndex];
                    const preCoordinate = coordinates[vertexIndex];
                    const nextCoordinate = coordinates[vertexIndex + 1] || coordinates[0];
                    const middleCoordinate = preCoordinate.add(nextCoordinate).multi(1 / 2);
                    coordinates.splice(vertexIndex + 1, 0, middleCoordinate);
                    updatePolyCoordinates(coordinates, ringIndex);

                    handle.opacity = 1;

                    //add two "new vertex" handles
                    newVertexHandles[ringIndex].splice(vertexIndex, 0, createNewVertexHandle.call(me, vertexIndex, ringIndex), createNewVertexHandle.call(me, vertexIndex + 1, ringIndex));
                    pauseRefresh = true;
                },
                onMove: function (): void {
                    moveVertexHandle(handle.getContainerPoint(), handle[propertyOfVertexIndex] + 1, ringIndex);
                },
                onUp: function (e: any): void {
                    if (e && e.domEvent && e.domEvent.button === 2) {
                        pauseRefresh = false;
                        return;
                    }
                    const vertexIndex = handle[propertyOfVertexIndex];
                    //remove this handle
                    removeFromArray(handle, newVertexHandles[ringIndex]);
                    handle.delete();
                    //add a new vertex handle
                    vertexHandles[ringIndex].splice(vertexIndex, 0, createVertexHandle.call(me, vertexIndex, ringIndex));
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
                    if (vertexCoordinates[vertexIndex] && vertexCoordinates[nextIndex]) {
                        const refreshVertex = vertexCoordinates[vertexIndex].add(vertexCoordinates[nextIndex]).multi(1 / 2);
                        // const containerPoint = map.coordToContainerPoint(refreshVertex);
                        const containerPoint = coordinatesToContainerPoint(map, refreshVertex);
                        handle.setContainerPoint(containerPoint._add(getDxDy()));
                    }
                }
            });
            handle[propertyOfVertexIndex] = index;
            handle.setZIndex(newVertexZIndex);
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
        const renderer = map.getRenderer();
        if (renderer) {
            renderer.sortTopElements();
        }
        this._addRefreshHook((): void => {
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

    //@internal
    _refresh(): void {
        if (this._refreshHooks) {
            for (let i = this._refreshHooks.length - 1; i >= 0; i--) {
                this._refreshHooks[i].call(this);
            }
        }
    }

    //@internal
    _hideContext(): void {
        if (this._geometry) {
            this._geometry.closeMenu();
            this._geometry.closeInfoWindow();
        }
    }

    //@internal
    _addRefreshHook(fn: any): void {
        if (!fn) {
            return;
        }
        if (!this._refreshHooks) {
            this._refreshHooks = [];
        }
        this._refreshHooks.push(fn);
    }

    //@internal
    _update(method: any, ...args: any): void {
        this._exeHistory([method, args]);
        this._recordHistory(method, ...args);
    }

    //@internal
    _updateCoordFromShadow(ignoreRecord?: any): void {
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

    //@internal
    _recordHistory(method: any, ...args: any): void {
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
         * 编辑记录事件，在发生编辑并正在记录时激发
         * @english
         * edit record event, fired when an edit happend and being recorded
         *
         * @event Geometry#editrecord
         * @type {Object}
         * @property {String} type - editrecord
         * @property {Geometry} target - the geometry fires the event
         */
        this._geometry.fire('editrecord');
    }

    cancel(): GeometryEditor {
        if (!this._history || this._historyPointer === 0) {
            return this;
        }
        this._historyPointer = 0;
        const record = this._history[0];
        this._exeAndReset(record);
        return this;
    }

    /**
     * 获取视图历史记录中的上一个地图视图
     * @english
     * Get previous map view in view history
     * @return {Object} map view
     */
    undo(): any {
        if (this._isundoEdit()) {
            return this;
        }
        const record = this._history[--this._historyPointer];
        this._exeAndReset(record);
        return this;
    }

    /**
     * 获取视图历史记录中的下一个地图视图
     * @english
     * Get next view in view history
     * @return {Object} map view
     */
    redo(): any {
        if (this._isRedoEdit()) {
            return this;
        }
        const record = this._history[++this._historyPointer];
        this._exeAndReset(record);
        return this;
    }

    //@internal
    _exeAndReset(record: any): void {
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

    //@internal
    _onDragStart(): void {
        this._updating = true;
    }

    //@internal
    _onDragEnd(): void {
        this._updating = false;
    }

    //@internal
    _exeHistory(record: any): void {
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
                geoToEdit[m].call(geoToEdit, ...args);
                if (geoToEdit !== geo) {
                    geo[m].call(geo, ...args);
                }
            });
        } else {
            geoToEdit[record[0]].call(geoToEdit, ...record[1]);
            if (geoToEdit !== geo) {
                geo[record[0]].call(geo, ...record[1]);
            }
        }
        this._updating = updating;
    }
    _isRedoEdit(): boolean {
        if (!this._history || this._historyPointer === this._history.length - 1) {
            return true;
        }
        return false;
    }
    _isundoEdit(): boolean {
        if (!this._history || this._historyPointer === 0) {
            return true;
        }
        return false;
    }

}

GeometryEditor.mergeOptions(options);

export default GeometryEditor;
