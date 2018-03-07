import { INTERNAL_LAYER_PREFIX } from '../../core/Constants';
import { isNil } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import { getExternalResources } from '../../core/util/resource';
import { stopPropagation } from '../../core/util/dom';
import Coordinate from '../../geo/Coordinate';
import Point from '../../geo/Point';
import Marker from '../../geometry/Marker';
import Polygon from '../../geometry/Polygon';
import LineString from '../../geometry/LineString';
import Circle from '../../geometry/Circle';
import Ellipse from '../../geometry/Ellipse';
import ArcCurve from '../../geometry/ArcCurve';
import CubicBezierCurve from '../../geometry/CubicBezierCurve';
import QuadBezierCurve from '../../geometry/QuadBezierCurve';
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
        if (action === 'clickDblclick') {
            return {
                'click': this._clickForPath,
                'mousemove': this._mousemoveForPath,
                'dblclick': this._dblclickForPath
            };
        } else if (action === 'click') {
            return {
                'click': this._clickForPoint
            };
        } else if (action === 'drag') {
            return {
                'mousedown': this._mousedownToDraw
            };
        }
        return null;
    }

    _addGeometryToStage(geometry) {
        const drawLayer = this._getDrawLayer();
        drawLayer.addGeometry(geometry);
    }

    _clickForPoint(param) {
        const registerMode = this._getRegisterMode();
        this._geometry = registerMode['create'](param['coordinate'], param);
        if (this.options['symbol'] && this.options.hasOwnProperty('symbol')) {
            this._geometry.setSymbol(this.options['symbol']);
        }
        this.endDraw();
    }

    _clickForPath(param) {
        const registerMode = this._getRegisterMode();
        const coordinate = param['coordinate'];
        const symbol = this.getSymbol();
        if (!this._geometry) {
            this._clickCoords = [coordinate];
            this._geometry = registerMode['create'](this._clickCoords, param);
            if (symbol) {
                this._geometry.setSymbol(symbol);
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
            this._fireEvent('drawstart', param);
        } else {
            if (!isNil(this._historyPointer)) {
                this._clickCoords = this._clickCoords.slice(0, this._historyPointer);
            }
            this._clickCoords.push(coordinate);
            this._historyPointer = this._clickCoords.length;
            registerMode['update'](this._clickCoords, this._geometry, param);
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
            this._fireEvent('drawvertex', param);

        }
    }

    _mousemoveForPath(param) {
        const map = this.getMap();
        if (!this._geometry || !map || map.isInteracting()) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const coordinate = param['coordinate'];
        const registerMode = this._getRegisterMode();
        const path = this._clickCoords.slice(0, this._historyPointer);
        if (path && path.length > 0 && coordinate.equals(path[path.length - 1])) {
            return;
        }
        registerMode['update'](path.concat([coordinate]), this._geometry, param);
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
        this._fireEvent('mousemove', param);
    }

    _dblclickForPath(param) {
        if (!this._geometry) {
            return;
        }
        const containerPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(containerPoint)) {
            return;
        }
        const registerMode = this._getRegisterMode();
        const path = this._clickCoords;
        if (path.length < 2) {
            return;
        }
        //remove duplicate vertexes
        const nIndexes = [];
        for (let i = 1, len = path.length; i < len; i++) {
            if (path[i].x === path[i - 1].x && path[i].y === path[i - 1].y) {
                nIndexes.push(i);
            }
        }
        for (let i = nIndexes.length - 1; i >= 0; i--) {
            path.splice(nIndexes[i], 1);
        }

        if (path.length < 2 || (this._geometry && (this._geometry instanceof Polygon) && path.length < 3)) {
            return;
        }
        registerMode['update'](path, this._geometry, param);
        this.endDraw(param);
    }

    _mousedownToDraw(param) {
        const map = this._map;
        const registerMode = this._getRegisterMode();
        const me = this,
            firstPoint = this._getMouseContainerPoint(param);
        if (!this._isValidContainerPoint(firstPoint)) {
            return false;
        }

        function genGeometry(evt) {
            const symbol = me.getSymbol();
            let geometry = me._geometry;
            if (!geometry) {
                geometry = registerMode['create'](evt.coordinate, evt);
                geometry.setSymbol(symbol);
                me._addGeometryToStage(geometry);
                me._geometry = geometry;
            } else {
                registerMode['update'](evt.coordinate, geometry, evt);
            }
        }

        function onMouseMove(evt) {
            if (!this._geometry) {
                return false;
            }
            const current = this._getMouseContainerPoint(evt);
            if (!this._isValidContainerPoint(current)) {
                return false;
            }
            genGeometry(evt);
            this._fireEvent('mousemove', param);
            return false;
        }
        const onMouseUp = function (evt) {
            map.off('mousemove', onMouseMove, this);
            map.off('mouseup', onMouseUp, this);
            if (!this.options['ignoreMouseleave']) {
                map.off('mouseleave', onMouseUp, this);
            }
            if (!this._geometry) {
                return false;
            }
            const current = this._getMouseContainerPoint(evt);
            if (this._isValidContainerPoint(current)) {
                genGeometry(evt);
            }
            this.endDraw(param);
            return false;
        };

        this._fireEvent('drawstart', param);
        genGeometry(param);
        map.on('mousemove', onMouseMove, this);
        map.on('mouseup', onMouseUp, this);
        if (!this.options['ignoreMouseleave']) {
            map.on('mouseleave', onMouseUp, this);
        }
        return false;
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

DrawTool.registerMode('circle', {
    'action': 'drag',
    'create': function (coordinate) {
        return new Circle(coordinate, 0);
    },
    'update': function (coordinate, geometry) {
        const map = geometry.getMap();
        const radius = map.computeLength(geometry.getCenter(), coordinate);
        geometry.setRadius(radius);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('ellipse', {
    'action': 'drag',
    'create': function (coordinate) {
        return new Ellipse(coordinate, 0, 0);
    },
    'update': function (coordinate, geometry) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const rx = map.computeLength(center, new Coordinate({
            x: coordinate.x,
            y: center.y
        }));
        const ry = map.computeLength(center, new Coordinate({
            x: center.x,
            y: coordinate.y
        }));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('rectangle', {
    'action': 'drag',
    'create': function (coordinate, param) {
        const rect = new Polygon([]);
        rect._firstClick = param['containerPoint'];
        return rect;
    },
    'update': function (coordinate, geometry, param) {
        const map = geometry.getMap();
        const containerPoint = param['containerPoint'];
        const firstClick = geometry._firstClick;
        const ring = [
            [firstClick.x, firstClick.y],
            [containerPoint.x, firstClick.y],
            [containerPoint.x, containerPoint.y],
            [firstClick.x, containerPoint.y],
        ];
        geometry.setCoordinates(ring.map(c => map.containerPointToCoord(new Point(c))));
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('point', {
    'action': 'click',
    'create': function (coordinate) {
        return new Marker(coordinate);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('polygon', {
    'action': 'clickDblclick',
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        const symbol = geometry.getSymbol();
        geometry.setCoordinates(path);

        const layer = geometry.getLayer();
        if (layer) {
            let polygon = layer.getGeometryById('polygon');
            if (!polygon && path.length >= 3) {
                polygon = new Polygon([path], {
                    'id': 'polygon'
                });
                if (symbol) {
                    const pSymbol = extendSymbol(symbol, {
                        'lineOpacity': 0
                    });
                    polygon.setSymbol(pSymbol);
                }
                polygon.addTo(layer);
            }
            if (polygon) {
                polygon.setCoordinates(path);
            }
        }
    },
    'generate': function (geometry) {
        return new Polygon(geometry.getCoordinates(), {
            'symbol': geometry.getSymbol()
        });
    }
});

DrawTool.registerMode('linestring', {
    'action': 'clickDblclick',
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('arccurve', {
    'action': 'clickDblclick',
    'create': function (path) {
        return new ArcCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('quadbeziercurve', {
    'action': 'clickDblclick',
    'create': function (path) {
        return new QuadBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('cubicbeziercurve', {
    'action': 'clickDblclick',
    'create': function (path) {
        return new CubicBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('boxZoom', {
    'action': 'drag',
    'create': function (coordinate) {
        const marker = new Marker(coordinate);
        marker._firstClick = coordinate;
        return marker;
    },
    'update': function (coordinate, geometry, param) {
        const map = geometry.getMap();
        const p1 = map.coordToContainerPoint(geometry._firstClick),
            p2 = param['containerPoint'];
        const coord = map.containerPointToCoordinate(new Coordinate(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y)));
        geometry.setCoordinates(coord)
            .updateSymbol({
                markerWidth  : Math.abs(p1.x - p2.x),
                markerHeight : Math.abs(p1.y - p2.y)
            });
    },
    'generate': function (geometry) {
        return geometry;
    }
});

export default DrawTool;
