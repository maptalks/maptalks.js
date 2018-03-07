import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import { getExternalResources } from '../../core/util/resource';
import { stopPropagation } from '../../core/util/dom';
import VectorLayer from '../../layer/VectorLayer';
import MapTool from './MapTool';
import RegisterModes from './DrawToolGeometry';

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
     * @param  {Object} modeAction.action the action of DrawTool: click, drag, clickDblclick
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
     * Register modes for DrawTool
     * @param modes
     */
    static registeredModes(modes) {
        if (modes) {
            for (const key of Reflect.ownKeys(modes)) {
                DrawTool.registerMode(key, modes[key]);
            }
        }
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
         * @type {{click: *, mousemove: *, dblclick: *, mousedown: *, mouseup: *, drag: *}}
         */
        this.events = {
            'click': this._firstClickHandler,
            'mousemove': this._mouseMoveHandler,
            'dblclick': this._doubleClickHandler,
            'mousedown': this._mouseDownHandler,
            'mouseup': this._mouseUpHandler,
            'drag': this._mouseMoveHandler
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
        if (action !== 'clickDblclick' || !this._historyPointer) {
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
        if (action !== 'clickDblclick' || isNil(this._historyPointer) || this._historyPointer === this._clickCoords.length) {
            return this;
        }
        const coords = this._clickCoords.slice(0, ++this._historyPointer);
        registerMode.update(coords, this._geometry);
        return this;
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
        const action = this._getRegisterMode()['action'];
        if (action === 'drag') {
            const map = this.getMap();
            this._mapDraggable = map.options['draggable'];
            map.config({
                'draggable' : false
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
                if (action[i] === 'drag') {
                    _events['mousemove'] = this.events[action[i]];
                } else {
                    _events[action[i]] = this.events[action[i]];
                }
            }
            return _events;
        }
        return null;
    }

    _addGeometryToStage(geometry) {
        const drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
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
            if (this._clickCoords.length > 0 &&
                this.getMap().computeLength(coordinate, this._clickCoords[this._clickCoords.length - 1]) < 0.01) {
                return;
            }
            if (!(this._historyPointer === null)) {
                this._clickCoords = this._clickCoords.slice(0, this._historyPointer);
            }
            this._clickCoords.push(coordinate);
            this._historyPointer = this._clickCoords.length;
            if (registerMode['limitClickCount'] && registerMode['limitClickCount'] === this._historyPointer) {
                registerMode['update'](this._clickCoords, this._geometry, event);
                this.endDraw(event);
            } else {
                registerMode['update'](this._clickCoords, this._geometry, event);
            }
            this._fireEvent('drawvertex', event);
        }
        if (this.getMode() === 'point') {
            this.endDraw(event);
        }
    }

    /**
     * 第一次事件创建相关geometry
     * @param event
     * @private
     */
    _createGeometry(event) {
        const registerMode = this._getRegisterMode();
        const coordinate = event['coordinate'];
        const symbol = this.getSymbol();
        if (!this._geometry) {
            this._clickCoords = [coordinate];
            this._geometry = registerMode['create'](this._clickCoords, event);
            if (symbol) {
                this._geometry.setSymbol(symbol);
            }
            this._addGeometryToStage(this._geometry);
            this._fireEvent('drawstart', event);
        }
    }

    /**
     * handle mouse move event
     * FIXME 当为freehand模式时，鼠标按下松开而不移动会造成构造的geometry不完整
     * @param event
     * @private
     */
    _mouseMoveHandler(event) {
        const map = this.getMap();
        const coordinate = event['coordinate'];
        if (!this._geometry || !map || map.isInteracting()) {
            return;
        }
        if (map.computeLength(coordinate, this._clickCoords[this._clickCoords.length - 1]) < 0.01) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(event);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const registerMode = this._getRegisterMode();
        const path = this._clickCoords.slice(0, this._historyPointer);
        if (path && path.length > 0 && coordinate.equals(path[path.length - 1])) {
            return;
        }
        if (!registerMode.freehand) {
            registerMode['update'](path.concat([coordinate]), this._geometry, event);
        } else {
            if (!(this._historyPointer === null)) {
                this._clickCoords = this._clickCoords.slice(0, this._historyPointer);
            }
            this._clickCoords.push(coordinate);
            this._historyPointer = this._clickCoords.length;
            registerMode['update'](this._clickCoords, this._geometry, event);
        }
        this._fireEvent('mousemove', event);
    }

    /**
     * handle mouse double click event
     * @param event
     * @private
     */
    _doubleClickHandler(event) {
        this.endDraw(event);
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
        if (action === 'drag') {
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

DrawTool.registeredModes(RegisterModes);

export default DrawTool;
