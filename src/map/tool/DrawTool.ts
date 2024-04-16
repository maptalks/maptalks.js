import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { extend, isFunction, isNil, isNumber } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import { getExternalResources } from '../../core/util/resource';
import { stopPropagation } from '../../core/util/dom';
import Polygon from '../../geometry/Polygon';
import Point from '../../geo/Point';
import Geometry from '../../geometry/Geometry';
import VectorLayer from '../../layer/VectorLayer';
import MapTool from './MapTool';

export type DrawToolOptions = {
    mode?: string,
    symbol?: any,
    once?: boolean,
    autoPanAtEdge?: boolean,
    blockGeometryEvents?: boolean,
    zIndex?: number,
    doubleClickZoom?: boolean,
    ignoreMouseleave?: boolean,
    enableAltitude?: boolean
}

export type modeActionType = {
    action?: string|Array<string>,
    create?: any,
    update?: any,
    generate?: any,
    clickLimit?: number|string
}

/**
 * 配置项
 *
 * @english
 * @property {Object} [options=null] - construct options
 * @property {String} [options.mode=null]   - mode of the draw tool
 * @property {Object} [options.symbol=null] - symbol of the geometries drawn
 * @property {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
 * @property {Boolean} [options.autoPanAtEdge=false]  - Whether to make edge judgement or not.
 * @property {Boolean} [options.blockGeometryEvents=false]  - Whether Disable geometryEvents when drawing.
 * @property {Number} [options.zIndex=Number.MAX_VALUE]  - drawlayer zIndex.The default drawn layer will be at the top
 * @memberOf DrawTool
 * @instance
 */
const options: DrawToolOptions = {
    'symbol': {
        'lineColor': '#000',
        'lineWidth': 2,
        'lineOpacity': 1,
        'polygonFill': '#fff',
        'polygonOpacity': 0.3
    },
    'doubleClickZoom': false,
    'mode': null,
    'once': false,
    'autoPanAtEdge': false,
    'ignoreMouseleave': true,
    'blockGeometryEvents': false,
    'zIndex': Number.MAX_VALUE,
    'enableAltitude': true
};

const registeredMode = {};

/**
 * 图形绘制工具类
 *
 * @english
 * A map tool to help draw geometries.
 * @category maptool
 * @extends MapTool
 * @example
 * var drawTool = new DrawTool({
 *     mode : 'Polygon',
 *     symbol : {
 *         'lineColor' : '#000',
 *         'lineWidth' : 5
 *     },
 *     once : true
 * }).addTo(map);
 */
class DrawTool extends MapTool {
    _vertexes: Array<any>;
    _historyPointer: any;
    _events: any;
    _geometry?: any;
    _drawToolLayer?: any;
    _mapAutoPanAtEdge?: boolean;
    _geometryEvents?: boolean;
    _mapDoubleClickZoom?: boolean;
    _ending: boolean;
    _mapDraggable?: boolean;
    _clickCoords?: Array<any>;
    _layers?: Array<any>;

    /**
     * 为DrawTool注册一个新mode
     *
     * @english
     * Register a new mode for DrawTool
     * @param name                  mode name
     * @param modeAction            modeActions
     * @param modeAction.action     the action of DrawTool: click, mousedown, clickDblclick
     * @param modeAction.create     the create method of drawn geometry
     * @param modeAction.update     the update method of drawn geometry
     * @param modeAction.generate   the method to generate geometry at the end of drawing.
     * @example
     * //Register "CubicBezierCurve" mode to draw Cubic Bezier Curves.
     * DrawTool.registerMode('CubicBezierCurve', {
        'action': 'clickDblclick',
        'create': path => new CubicBezierCurve(path),
        'update': (path, geometry) => {
            geometry.setCoordinates(path);
        },
        'generate': geometry => geometry
       }
     });
     */
    static registerMode(name: string, modeAction:modeActionType) {
        registeredMode[name.toLowerCase()] = modeAction;
    }

    /**
     * 根据name获取mode actions
     *
     * @english
     * Get mode actions by mode name
     * @param name      DrawTool mode name
     * @return          mode actions
     */
    static getRegisterMode(name: string):any {
        return registeredMode[name.toLowerCase()];
    }

    /**
     * 实例化DrawTool工具
     *
     * @english
     * In default, DrawTool supports the following modes: <br>
     * [Point, LineString, Polygon, Circle, Ellipse, Rectangle, ArcCurve, QuadBezierCurve, CubicBezierCurve] <br>
     * You can easily add new mode to DrawTool by calling [registerMode]{@link DrawTool.registerMode}
     * @param options=null                  - construct options
     * @param options.mode=null             - mode of the draw tool
     * @param options.symbol=null           - symbol of the geometries drawn
     * @param options.once=null             - whether disable immediately once drawn a geometry.
     * @param options.autoPanAtEdge=false   - Whether to make edge judgement or not.
     */
    constructor(options: DrawToolOptions) {
        super(options);
        this._checkMode();
        /**
         * events
         * @type {{click: DrawTool._clickHandler, mousemove: DrawTool._mouseMoveHandler, dblclick: DrawTool._doubleClickHandler, mousedown: DrawTool._mouseDownHandler, mouseup: DrawTool._mouseUpHandler}}
         * @private
         */
        this._events = {
            'click': this._clickHandler,
            'mousemove touchmove': this._mouseMoveHandler,
            'dblclick': this._doubleClickHandler,
            'mousedown touchstart': this._mouseDownHandler,
            'mouseup touchend': this._mouseUpHandler,
            'mousemove': this._mouseMoveHandler,
            'mousedown': this._mouseDownHandler,
            'mouseup': this._mouseUpHandler
        };
    }

    /**
     * 获取当前mode
     *
     * @english
     * Get current mode of draw tool
     * @return mode
     */
    getMode():string {
        if (this.options['mode']) {
            return this.options['mode'].toLowerCase();
        }
        return null;
    }

    /**
     * 设置mode
     *
     * @english
     * Set mode of the draw tool
     * @param mode - mode of the draw tool
     * @returns {DrawTool} this
     * @expose
     */
    setMode(mode:string):DrawTool {
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
            this._restoreMapCfg();
            this._saveMapCfg();
        }
        return this;
    }

    /**
     * 获取DrawTool的symbol属性
     *
     * @english
     * Get symbol of the draw tool
     * @return symbol
     */
    getSymbol():any {
        const symbol = this.options['symbol'];
        if (symbol) {
            return extendSymbol(symbol);
        } else {
            return extendSymbol(this.options['symbol']);
        }
    }

    /**
     * 设置DrawTool的symbol属性
     *
     * @english
     * Set draw tool's symbol
     * @param symbol - symbol set
     * @returns {DrawTool} this
     */
    setSymbol(symbol:any):DrawTool {
        if (!symbol) {
            return this;
        }
        this.options['symbol'] = symbol;
        if (this._geometry) {
            this._geometry.setSymbol(symbol);
        }
        return this;
    }

    /**
     * 获取当前绘制图形
     *
     * @english
     * Get geometry is currently drawing
     * @return geometry currently drawing
     */
    getCurrentGeometry():Geometry {
        return this._geometry;
    }

    onAdd() {
        this._checkMode();
    }

    onEnable() {
        this._saveMapCfg();
        this._drawToolLayer = this._getDrawLayer();
        this._clearStage();
        this._loadResources();
        const map = this.getMap();
        if (this.options['autoPanAtEdge']) {
            this._mapAutoPanAtEdge = map.options['autoPanAtEdge'];
            if (!this._mapAutoPanAtEdge) {
                map.config({ autoPanAtEdge: true });
            }
        }
        this._geometryEvents = map.options['geometryEvents'];
        if (this.options['blockGeometryEvents']) {
            map.config('geometryEvents', false);
        }
        return this;
    }

    onDisable() {
        const map = this.getMap();
        this._restoreMapCfg();
        this.endDraw({ ignoreEndEvent: true });
        if (this._map) {
            map.removeLayer(this._getDrawLayer());
            if (this.options['autoPanAtEdge']) {
                if (!this._mapAutoPanAtEdge) {
                    map.config({ autoPanAtEdge: false });
                }
            }
        }
        if (this.options['blockGeometryEvents']) {
            map.config('geometryEvents', this._geometryEvents);
        }
        return this;
    }

    /**
     * 撤消绘图，仅适用于点击/删除模式
     *
     * @english
     * Undo drawing, only applicable for click/dblclick mode
     * @return this
     */
    undo():DrawTool {
        const registerMode = this._getRegisterMode();
        const action = registerMode.action;
        if (!this._shouldRecordHistory(action) || !this._historyPointer) {
            return this;
        }
        const coords = this._clickCoords.slice(0, --this._historyPointer);
        registerMode.update(this.getMap().getProjection(), coords, this._geometry);
        return this;
    }

    /**
     * 重做绘图，只适用于click/dblclick模式
     *
     * @english
     * Redo drawing, only applicable for click/dblclick mode
     * @return this
     */
    redo():DrawTool {
        const registerMode = this._getRegisterMode();
        const action = registerMode.action;
        if (!this._shouldRecordHistory(action) || isNil(this._historyPointer) || this._historyPointer === this._clickCoords.length) {
            return this;
        }
        const coords = this._clickCoords.slice(0, ++this._historyPointer);
        registerMode.update(this.getMap().getProjection(), coords, this._geometry);
        return this;
    }

    /**
     * 检查历史记录
     *
     * @english
     * check should recor history
     * @param actions
     * @returns {boolean}
     * @private
     */
    _shouldRecordHistory(actions) {
        return Array.isArray(actions) && actions[0] === 'click' && actions[1] === 'mousemove' && actions[2] === 'dblclick';
    }

    _checkMode() {
        this._getRegisterMode();
    }

    _saveMapCfg() {
        const map = this.getMap();
        this._mapDoubleClickZoom = map.options['doubleClickZoom'];
        map.config({
            'doubleClickZoom': this.options['doubleClickZoom']
        });
        const actions = this._getRegisterMode()['action'];
        let dragging = false;
        for (let i = 0; i < actions.length; i++) {
            if (actions[i].indexOf('mousedown') >= 0 || actions[i].indexOf('touchstart') >= 0) {
                dragging = true;
                break;
            }
        }
        if (dragging) {
            const map = this.getMap();
            this._mapDraggable = map.options['draggable'];
            map.config({
                'draggable': false
            });
        }
    }

    _restoreMapCfg() {
        const map = this.getMap();
        map.config({
            'doubleClickZoom': this._mapDoubleClickZoom
        });
        if (!isNil(this._mapDraggable)) {
            map.config('draggable', this._mapDraggable);
        }
        delete this._mapDraggable;
        delete this._mapDoubleClickZoom;
    }

    _loadResources() {
        const symbol = this.getSymbol();
        const resources = getExternalResources(symbol);
        if (resources.length > 0) {
            //load external resources at first
            this._drawToolLayer._getRenderer().loadResources(resources);
        }
    }

    _getProjection() {
        return this._map.getProjection();
    }

    _getRegisterMode() {
        const mode = this.getMode();
        const registerMode = DrawTool.getRegisterMode(mode);
        if (!registerMode) {
            throw new Error(mode + ' is not a valid mode of DrawTool.');
        }
        return registerMode;
    }

    getEvents() {
        const action = this._getRegisterMode()['action'];
        const _events = {};
        if (Array.isArray(action)) {
            for (let i = 0; i < action.length; i++) {
                _events[action[i]] = this._events[action[i]];
            }
            return _events;
        }
        return null;
    }

    /**
     * 鼠标按下开始绘画
     *
     * @english
     * mouse down start draw
     * @param event
     * @private
     */
    _mouseDownHandler(event:any) {
        this._createGeometry(event);
    }

    /**
     * 监听 mouse up 事件
     *
     * @english
     * handle mouse up event
     * @param event
     * @private
     */
    _mouseUpHandler(event:any) {
        this.endDraw(event);
    }

    /**
     * 监听mouse first click点击事件
     *
     * @english
     * handle mouse first click handle
     * @param event
     * @private
     */
    _clickHandler(event:any) {
        event.enableAltitude = this.options.enableAltitude;
        const map:any = this.getMap();
        const registerMode = this._getRegisterMode();
        // const coordinate = event['coordinate'];
        //dbclick will trigger two click
        if (this._clickCoords && this._clickCoords.length) {
            const len = this._clickCoords.length;
            const prjCoord = map._pointToPrj(event['point2d']);
            if (this._clickCoords[len - 1].equals(prjCoord)) {
                return;
            }
        }
        if (!this._geometry) {
            this._createGeometry(event);
        } else {
            let prjCoord = map._pointToPrj(event['point2d']);
            if (!isNil(this._historyPointer)) {
                this._clickCoords = this._clickCoords.slice(0, this._historyPointer);
            }
            //for snap effect
            const snapTo = this._geometry.snapTo;
            if (snapTo && isFunction(snapTo)) {
                const snapResult = this._getSnapResult(snapTo, event.containerPoint);
                prjCoord = snapResult.prjCoord;
                this._clickCoords = this._clickCoords.concat(snapResult.effectedVertex);
                // ensure snap won't trigger again when dblclick
                if (this._clickCoords[this._clickCoords.length - 1].equals(prjCoord)) {
                    return;
                }
            }
            this._clickCoords.push(prjCoord);
            this._historyPointer = this._clickCoords.length;
            event.drawTool = this;
            registerMode['update'](map.getProjection(), this._clickCoords, this._geometry, event);
            if (this.getMode() === 'point') {
                this.endDraw(event);
                return;
            }
            /**
             * drawvertex事件
             *
             * @english
             * drawvertex event.
             *
             * @event DrawTool#drawvertex
             * @type {Object}
             * @property {String} type              - drawvertex
             * @property {DrawTool} target          - draw tool
             * @property {Geometry} geometry        - geometry drawn
             * @property {Coordinate} coordinate    - coordinate of the event
             * @property {Point} containerPoint     - container point of the event
             * @property {Point} viewPoint          - view point of the event
             * @property {Event} domEvent           - dom event
             */
            if (this._clickCoords.length <= 1) {
                this._fireEvent('drawstart', event);
            } else {
                this._fireEvent('drawvertex', event);
            }

            if (registerMode['clickLimit'] && registerMode['clickLimit'] === this._historyPointer) {
                // registerMode['update']([coordinate], this._geometry, event);
                this.endDraw(event);
            }
        }
    }

    /**
     * 第一次事件创建相关geometry
     *
     * @param event
     * @private
     */
    _createGeometry(event:any) {
        const mode = this.getMode();
        const map:any = this.getMap()
        const registerMode = this._getRegisterMode();
        const prjCoord = map._pointToPrj(event['point2d']);
        const symbol = this.getSymbol();
        if (!this._geometry) {
            /**
            * drawprepare事件。在drawstart之前。
            *
            * @english
            * drawprepare event.Note that it occurs before drawstart
            *
            * @event DrawTool#drawprepare
            * @type {Object}
            * @property {String} type           - drawprepare
            * @property {DrawTool} target       - draw tool
            * @property {Coordinate} coordinate - coordinate of the event
            * @property {Point} containerPoint  - container point of the event
            * @property {Point} viewPoint       - view point of the event
            * @property {Event} domEvent        - dom event
            */
            this._fireEvent('drawprepare', event);
            this._clickCoords = [prjCoord];
            event.drawTool = this;
            this._geometry = registerMode['create'](this.getMap().getProjection(), this._clickCoords, event);
            if (symbol && mode !== 'point') {
                this._geometry.setSymbol(symbol);
            } else if (this.options.hasOwnProperty('symbol')) {
                this._geometry.setSymbol(this.options['symbol']);
            }
            this._addGeometryToStage(this._geometry);
            /**
             * drawstart事件
             *
             * @english
             * drawstart event.
             *
             * @event DrawTool#drawstart
             * @type {Object}
             * @property {String} type - drawstart
             * @property {DrawTool} target - draw tool
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawstart', event);
            // snapTo First coordinate point
            const snapTo = this._geometry.snapTo;
            if (snapTo && isFunction(snapTo)) {
                const snapResult = this._getSnapResult(snapTo, event.containerPoint);
                const map = this.getMap();
                if (map && snapResult) {
                    const prjCoord = snapResult.prjCoord;
                    this._clickCoords = [prjCoord];
                    registerMode['update'](map.getProjection(), this._clickCoords, this._geometry, event);
                }
            }
        }
        if (mode === 'point' && event.type !== 'mousemove') {
            this.endDraw(event);
        }
    }


    /**
     * 监听鼠标移动
     *
     * @english
     * handle mouse move event
     * @param event
     * @private
     */
    _mouseMoveHandler(event) {
        event.enableAltitude = this.options.enableAltitude;
        const map:any = this.getMap();
        if (!map || map.isInteracting()) {
            return;
        }
        if (this.getMode() === 'point' && !this._geometry) {
            this._createGeometry(event);
            return;
        }
        if (!this._geometry) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(event);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        let prjCoord = map._pointToPrj(event['point2d']);
        // for snap effect
        let snapAdditionVertex = [];
        const snapTo = this._geometry.snapTo;
        if (snapTo && isFunction(snapTo)) {
            const snapResult = this._getSnapResult(snapTo, containerPoint);
            prjCoord = snapResult.prjCoord;
            snapAdditionVertex = snapResult.effectedVertex;
        }
        const projection = map.getProjection();
        event.drawTool = this;
        const registerMode = this._getRegisterMode();
        if (this._shouldRecordHistory(registerMode.action)) {
            const path = this._clickCoords.slice(0, this._historyPointer);
            if (path && path.length > 0 && prjCoord.equals(path[path.length - 1])) {
                return;
            }
            registerMode['update'](projection, path.concat(snapAdditionVertex, [prjCoord]), this._geometry, event);
        } else {
            //free hand mode
            registerMode['update'](projection, prjCoord, this._geometry, event);
        }
        /**
         * mousemove事件
         *
         * @english
         * mousemove event.
         *
         * @event DrawTool#mousemove
         * @type {Object}
         * @property {String} type - mousemove
         * @property {DrawTool} target - draw tool
         * @property {Geometry} geometry - geometry drawn
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mousemove', event);
    }

    /**
     * 监听double click事件
     *
     * @english
     * handle mouse double click event
     * @param event
     * @private
     */
    _doubleClickHandler(event) {
        event.enableAltitude = this.options.enableAltitude;
        if (!this._geometry) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(event);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const registerMode = this._getRegisterMode();
        const clickCoords = this._clickCoords;
        if (!clickCoords || clickCoords.length < 2) {
            return;
        }
        const mode = this.getMode();
        // Polygon ,FreeHandPolygon
        if (mode && mode.indexOf('polygon') > -1 && clickCoords.length < 3) {
            return;
        }
        const projection = this.getMap().getProjection();
        //remove duplicate vertexes
        const path = [clickCoords[0]];
        for (let i = 1, len = clickCoords.length; i < len; i++) {
            if (clickCoords[i].x !== clickCoords[i - 1].x || clickCoords[i].y !== clickCoords[i - 1].y) {
                path.push(clickCoords[i]);
            }
        }
        if (path.length < 2 || (this._geometry && (this._geometry instanceof Polygon) && path.length < 3)) {
            return;
        }
        event.drawTool = this;
        registerMode['update'](projection, path, this._geometry, event);
        this.endDraw(event);
    }

    _addGeometryToStage(geometry) {
        const drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    }

    /**
     * 结束当前绘制
     *
     * @english
     * End current draw
     * @param [param=null] params of drawend event
     * @returns this
     */
    endDraw(param:any):DrawTool {
        if (!this._geometry || this._ending) {
            return this;
        }
        this._ending = true;
        const geometry = this._geometry;
        this._clearStage();
        param = param || {};
        this._geometry = geometry;
        /**
         * drawend event.
         *
         * @event DrawTool#drawend
         * @type {Object}
         * @property {String} type - drawend
         * @property {DrawTool} target - draw tool
         * @property {Geometry} geometry - geometry drawn
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        if (!param.ignoreEndEvent) {
            this._fireEvent('drawend', param);
        }
        delete this._geometry;
        if (this.options['once']) {
            this.disable();
        }
        delete this._ending;
        delete this._historyPointer;
        if (this._vertexes) {
            this._vertexes = [];
        }
        return this;
    }

    _clearStage() {
        this._getDrawLayer().clear();
        delete this._geometry;
        delete this._clickCoords;
    }

    /**
     * 获取鼠标事件 ontainer point 信息
     *
     * @english
     * Get container point of the mouse event
     * @param event -  mouse event
     * @return
     * @private
     */
    _getMouseContainerPoint(event:Event):Point {
        const action = this._getRegisterMode()['action'];
        if (action[0].indexOf('mousedown') >= 0 || action[0].indexOf('touchstart') >= 0) {
            //prevent map's event propogation
            stopPropagation(event['domEvent']);
        }
        return event['containerPoint'];
    }

    _isValidContainerPoint(containerPoint) {
        const mapSize = this._map.getSize();
        const w = mapSize['width'],
            h = mapSize['height'];
        if (containerPoint.x < 0 || containerPoint.y < 0) {
            return false;
        } else if (containerPoint.x > w || containerPoint.y > h) {
            return false;
        }
        return true;
    }

    _getSnapResult(snapTo, containerPoint) {
        const map:any = this.getMap();
        const lastContainerPoints = [];
        if (this.options.edgeAutoComplete) {
            const lastCoord = this._clickCoords[(this._historyPointer || 1) - 1];
            lastContainerPoints.push(map.prjToContainerPoint(lastCoord));
            const beforeLastCoord = this._clickCoords[(this._historyPointer || 1) - 2];
            if (beforeLastCoord) {
                lastContainerPoints.push(map.prjToContainerPoint(beforeLastCoord));
            }
        }
        const snapResult = snapTo(containerPoint, lastContainerPoints);
        containerPoint = (snapResult.effectedVertex ? snapResult.point : snapResult) || containerPoint;
        const prjCoord = map._containerPointToPrj(containerPoint);
        if (snapResult.effectedVertex) {
            snapResult.effectedVertex = snapResult.effectedVertex.map(vertex => map._containerPointToPrj(vertex));
        }
        return {
            prjCoord,
            effectedVertex: snapResult.effectedVertex || []
        };
    }

    _getDrawLayer() {
        const drawLayerId = INTERNAL_LAYER_PREFIX + 'drawtool';
        let drawToolLayer:any = this._map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new VectorLayer(drawLayerId, {
                'enableSimplify': false,
                'enableAltitude': this.options['enableAltitude'],
                'zIndex': this.options.zIndex
            });
            this._map.addLayer(drawToolLayer);
        }
        this._pushLayers(drawToolLayer);
        return drawToolLayer;
    }

    _fireEvent(eventName, param) {
        if (!param) {
            param = {};
        }
        param = extend({}, param);
        if (this._geometry) {
            param['geometry'] = this._getRegisterMode()['generate'](this._geometry, { drawTool: this });
            param.tempGeometry = this._geometry;
        }
        MapTool.prototype._fireEvent.call(this, eventName, param);
    }

    _pushLayers(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            layers = [layers];
        }
        this._layers = this._layers || [];
        layers.forEach(layer => {
            if (this._layers.indexOf(layer) === -1) {
                this._layers.push(layer);
            }
        });
        return this;
    }

    _outLayers(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            layers = [layers];
        }
        this._layers = this._layers || [];
        layers.forEach(layer => {
            for (let i = 0, len = this._layers.length; i < len; i++) {
                if (layer === this._layers[i]) {
                    this._layers.splice(i, 1);
                    break;
                }
            }
        });
        return this;
    }

    /**
    * 设置Layer的zIndex
    * @english
    * set draw inner layers zIndex
    * @param  {Number} zIndex -  draw layer zIndex
    * @return this
    */
    setLayerZIndex(zIndex):DrawTool {
        if (!isNumber(zIndex)) {
            return this;
        }
        this.options.zIndex = zIndex;
        this._layers = this._layers || [];
        this._layers.forEach(layer => {
            if (layer && layer.setZIndex) {
                layer.setZIndex(zIndex);
            }
        });
        return this;
    }

}

DrawTool.mergeOptions(options);

export default DrawTool;
