import MapTool from './MapTool';
import { Geometry } from './../../geometry';
import { Layer } from './../../layer';
import { Coordinate } from './../../geo';
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
declare class DrawTool extends MapTool {
    _events: object;
    _geometry: Geometry;
    _drawToolLayer: Layer;
    _mapAutoPanAtEdge: boolean;
    _geometryEvents: boolean;
    _historyPointer: any;
    _clickCoords: Array<Coordinate>;
    _mapDoubleClickZoom: boolean;
    _mapDraggable: boolean;
    _ending: boolean;
    _vertexes: Array<any>;
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
    static registerMode(name: any, modeAction: any): void;
    /**
     * Get mode actions by mode name
     * @param  {String} name DrawTool mode name
     * @return {Object}      mode actions
     */
    static getRegisterMode(name: any): any;
    /**
     * In default, DrawTool supports the following modes: <br>
     * [Point, LineString, Polygon, Circle, Ellipse, Rectangle, ArcCurve, QuadBezierCurve, CubicBezierCurve] <br>
     * You can easily add new mode to DrawTool by calling [registerMode]{@link DrawTool.registerMode}
     * @param {Object} [options=null] - construct options
     * @param {String} [options.mode=null]   - mode of the draw tool
     * @param {Object} [options.symbol=null] - symbol of the geometries drawn
     * @param {Boolean} [options.once=null]  - whether disable immediately once drawn a geometry.
     * @param {Boolean} [options.autoPanAtEdge=false]  - Whether to make edge judgement or not.
     */
    constructor(options: any);
    /**
     * Get current mode of draw tool
     * @return {String} mode
     */
    getMode(): string;
    /**
     * Set mode of the draw tool
     * @param {String} mode - mode of the draw tool
     * @expose
     */
    setMode(mode: string): this;
    /**
     * Get symbol of the draw tool
     * @return {Object} symbol
     */
    getSymbol(): any;
    /**
     * Set draw tool's symbol
     * @param {Object} symbol - symbol set
     * @returns {DrawTool} this
     */
    setSymbol(symbol: any): this;
    /**
     * Get geometry is currently drawing
     * @return {Geometry} geometry currently drawing
     */
    getCurrentGeometry(): Geometry;
    onAdd(): void;
    onEnable(): this;
    onDisable(): this;
    /**
     * Undo drawing, only applicable for click/dblclick mode
     * @return {DrawTool} this
     */
    undo(): this;
    /**
     * Redo drawing, only applicable for click/dblclick mode
     * @return {DrawTool} this
     */
    redo(): this;
    /**
     * check should recor history
     * @param actions
     * @returns {boolean}
     * @private
     */
    _shouldRecordHistory(actions: any): boolean;
    _checkMode(): void;
    _saveMapCfg(): void;
    _restoreMapCfg(): void;
    _loadResources(): void;
    _getProjection(): any;
    _getRegisterMode(): any;
    getEvents(): {};
    /**
     * mouse down start draw
     * @param event
     * @private
     */
    _mouseDownHandler(event: any): void;
    /**
     * handle mouse up event
     * @param event
     * @private
     */
    _mouseUpHandler(event: any): void;
    /**
     * handle mouse first click handle
     * @param event
     * @private
     */
    _clickHandler(event: any): void;
    /**
     * 第一次事件创建相关geometry
     * @param event
     * @private
     */
    _createGeometry(event: any): void;
    /**
     * handle mouse move event
     * @param event
     * @private
     */
    _mouseMoveHandler(event: any): void;
    /**
     * handle mouse double click event
     * @param event
     * @private
     */
    _doubleClickHandler(event: any): void;
    _addGeometryToStage(geometry: any): void;
    /**
     * End current draw
     * @param {Object} [param=null] params of drawend event
     * @returns {DrawTool} this
     */
    endDraw(param: any): this;
    _clearStage(): void;
    /**
     * Get container point of the mouse event
     * @param  {Event} event -  mouse event
     * @return {Point}
     * @private
     */
    _getMouseContainerPoint(event: any): any;
    _isValidContainerPoint(containerPoint: any): boolean;
    _getSnapResult(snapTo: any, containerPoint: any): {
        prjCoord: Coordinate;
        effectedVertex: any;
    };
    _getDrawLayer(): Layer;
    _fireEvent(eventName: any, param: any): void;
}
export default DrawTool;
