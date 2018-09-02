import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import { getExternalResources } from '../../core/util/resource';
import { stopPropagation } from '../../core/util/dom';
import Polygon from '../../geometry/Polygon';
import VectorLayer from '../../layer/VectorLayer';
import MapTool from './MapTool';

/**
 * @property {Object} [options=null] - construct options
 * @property {String} [options.mode=null]   - mode of the draw tool
 * @property {Object} [options.symbol=null] - symbol of the geometries drawn
 * @property {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
 * @memberOf DrawTool
 * @instance
 */
const options = {
    'symbol': {
        'lineColor': '#000',
        'lineWidth': 2,
        'lineOpacity': 1,
        'polygonFill': '#fff',
        'polygonOpacity': 0.3
    },
    'doubleClickZoom' : false,
    'mode': null,
    'once': false,
    'ignoreMouseleave' : true
};

const registeredMode = {};

/**
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

    /**
     * Register a new mode for DrawTool
     * @param  {String} name       mode name
     * @param  {Object} modeAction modeActions
     * @param  {Object} modeAction.action the action of DrawTool: click, mousedown, clickDblclick
     * @param  {Object} modeAction.create the create method of drawn geometry
     * @param  {Object} modeAction.update the update method of drawn geometry
     * @param  {Object} modeAction.generate the method to generate geometry at the end of drawing.
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
    static registerMode(name, modeAction) {
        registeredMode[name.toLowerCase()] = modeAction;
    }

    /**
     * Get mode actions by mode name
     * @param  {String} name DrawTool mode name
     * @return {Object}      mode actions
     */
    static getRegisterMode(name) {
        return registeredMode[name.toLowerCase()];
    }

    /**
     * In default, DrawTool supports the following modes: <br>
     * [Point, LineString, Polygon, Circle, Ellipse, Rectangle, ArcCurve, QuadBezierCurve, CubicBezierCurve] <br>
     * You can easily add new mode to DrawTool by calling [registerMode]{@link DrawTool.registerMode}
     * @param {Object} [options=null] - construct options
     * @param {String} [options.mode=null]   - mode of the draw tool
     * @param {Object} [options.symbol=null] - symbol of the geometries drawn
     * @param {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
     */
    constructor(options) {
        super(options);
        this._checkMode();
        /**
         * events
         * @type {{click: DrawTool._firstClickHandler, mousemove: DrawTool._mouseMoveHandler, dblclick: DrawTool._doubleClickHandler, mousedown: DrawTool._mouseDownHandler, mouseup: DrawTool._mouseUpHandler}}
         * @private
         */
        this._events = {
            'click': this._firstClickHandler,
            'mousemove': this._mouseMoveHandler,
            'dblclick': this._doubleClickHandler,
            'mousedown': this._mouseDownHandler,
            'mouseup': this._mouseUpHandler
        };
    }

    /**
     * Get current mode of draw tool
     * @return {String} mode
     */
    getMode() {
        if (this.options['mode']) {
            return this.options['mode'].toLowerCase();
        }
        return null;
    }

    /**
     * Set mode of the draw tool
     * @param {String} mode - mode of the draw tool
     * @expose
     */
    setMode(mode) {
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
     * Get symbol of the draw tool
     * @return {Object} symbol
     */
    getSymbol() {
        const symbol = this.options['symbol'];
        if (symbol) {
            return extendSymbol(symbol);
        } else {
            return extendSymbol(this.options['symbol']);
        }
    }

    /**
     * Set draw tool's symbol
     * @param {Object} symbol - symbol set
     * @returns {DrawTool} this
     */
    setSymbol(symbol) {
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
     * Get geometry is currently drawing
     * @return {Geometry} geometry currently drawing
     */
    getCurrentGeometry() {
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
        return this;
    }

    onDisable() {
        const map = this.getMap();
        this._restoreMapCfg();
        this.endDraw();
        if (this._map) {
            map.removeLayer(this._getDrawLayer());
        }
        return this;
    }

    /**
     * Undo drawing, only applicable for click/dblclick mode
     * @return {DrawTool} this
     */
    undo() {
        const registerMode = this._getRegisterMode();
        const action = registerMode.action;
        if (!this._shouldRecordHistory(action) || !this._historyPointer) {
            return this;
        }
        const coords = this._clickCoords.slice(0, --this._historyPointer);
        registerMode.update(coords, this._geometry);
        return this;
    }

    /**
     * Redo drawing, only applicable for click/dblclick mode
     * @return {DrawTool} this
     */
    redo() {
        const registerMode = this._getRegisterMode();
        const action = registerMode.action;
        if (!this._shouldRecordHistory(action) || isNil(this._historyPointer) || this._historyPointer === this._clickCoords.length) {
            return this;
        }
        const coords = this._clickCoords.slice(0, ++this._historyPointer);
        registerMode.update(coords, this._geometry);
        return this;
    }

    /**
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
        if (actions.indexOf('mousedown') > -1) {
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
     * mouse down start draw
     * @param event
     * @private
     */
    _mouseDownHandler(event) {
        this._createGeometry(event);
    }

    /**
     * handle mouse up event
     * @param event
     * @private
     */
    _mouseUpHandler(event) {
        this.endDraw(event);
    }

    /**
     * handle mouse first click handle
     * @param event
     * @private
     */
    _firstClickHandler(event) {
        const registerMode = this._getRegisterMode();
        const coordinate = event['coordinate'];
        if (!this._geometry) {
            this._createGeometry(event);
        } else {
            if (!isNil(this._historyPointer)) {
                this._clickCoords = this._clickCoords.slice(0, this._historyPointer);
            }
            this._clickCoords.push(coordinate);
            this._historyPointer = this._clickCoords.length;
            if (registerMode['clickLimit'] && registerMode['clickLimit'] === this._historyPointer) {
                registerMode['update']([coordinate], this._geometry, event);
                this.endDraw(event);
            } else {
                registerMode['update'](this._clickCoords, this._geometry, event);
            }
            /**
             * drawvertex event.
             *
             * @event DrawTool#drawvertex
             * @type {Object}
             * @property {String} type - drawvertex
             * @property {DrawTool} target - draw tool
             * @property {Geometry} geometry - geometry drawn
             * @property {Coordinate} coordinate - coordinate of the event
             * @property {Point} containerPoint  - container point of the event
             * @property {Point} viewPoint       - view point of the event
             * @property {Event} domEvent                 - dom event
             */
            this._fireEvent('drawvertex', event);
        }
    }

    /**
     * 第一次事件创建相关geometry
     * @param event
     * @private
     */
    _createGeometry(event) {
        const mode = this.getMode();
        const registerMode = this._getRegisterMode();
        const coordinate = event['coordinate'];
        const symbol = this.getSymbol();
        if (!this._geometry) {
            this._clickCoords = [coordinate];
            this._geometry = registerMode['create'](this._clickCoords, event);
            if (symbol && mode !== 'point') {
                this._geometry.setSymbol(symbol);
            } else if (this.options.hasOwnProperty('symbol')) {
                this._geometry.setSymbol(this.options['symbol']);
            }
            this._addGeometryToStage(this._geometry);
            /**
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
        }
        if (mode === 'point') {
            this.endDraw(event);
        }
    }

    /**
     * handle mouse move event
     * @param event
     * @private
     */
    _mouseMoveHandler(event) {
        const map = this.getMap();
        const coordinate = event['coordinate'];
        if (!this._geometry || !map || map.isInteracting()) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(event);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const registerMode = this._getRegisterMode();
        if (this._shouldRecordHistory(registerMode.action)) {
            const path = this._clickCoords.slice(0, this._historyPointer);
            if (path && path.length > 0 && coordinate.equals(path[path.length - 1])) {
                return;
            }
            registerMode['update'](path.concat([coordinate]), this._geometry, event);
        } else {
            registerMode['update']([coordinate], this._geometry, event);
        }
        /**
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
     * handle mouse double click event
     * @param event
     * @private
     */
    _doubleClickHandler(event) {
        if (!this._geometry) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(event);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const registerMode = this._getRegisterMode();
        const clickCoords = this._clickCoords;
        if (clickCoords.length < 2) {
            return;
        }
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
        registerMode['update'](path, this._geometry, event);
        this.endDraw(event);
    }

    _addGeometryToStage(geometry) {
        const drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    }

    /**
     * End current draw
     * @param {Object} [param=null] params of drawend event
     * @returns {DrawTool} this
     */
    endDraw(param) {
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
        this._fireEvent('drawend', param);
        delete this._geometry;
        if (this.options['once']) {
            this.disable();
        }
        delete this._ending;
        return this;
    }

    _clearStage() {
        this._getDrawLayer().clear();
        delete this._geometry;
        delete this._clickCoords;
    }

    /**
     * Get container point of the mouse event
     * @param  {Event} event -  mouse event
     * @return {Point}
     * @private
     */
    _getMouseContainerPoint(event) {
        const action = this._getRegisterMode()['action'];
        if (action === 'mousedown') {
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

    _getDrawLayer() {
        const drawLayerId = INTERNAL_LAYER_PREFIX + 'drawtool';
        let drawToolLayer = this._map.getLayer(drawLayerId);
        if (!drawToolLayer) {
            drawToolLayer = new VectorLayer(drawLayerId, {
                'enableSimplify': false
            });
            this._map.addLayer(drawToolLayer);
        }
        return drawToolLayer;
    }

    _fireEvent(eventName, param) {
        if (!param) {
            param = {};
        }
        if (this._geometry) {
            param['geometry'] = this._getRegisterMode()['generate'](this._geometry).copy();
        }
        MapTool.prototype._fireEvent.call(this, eventName, param);
    }

}

DrawTool.mergeOptions(options);

export default DrawTool;
