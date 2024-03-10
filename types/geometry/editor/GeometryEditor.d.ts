import Class from '../../core/Class';
import EditHandle from '../../renderer/edit/EditHandle';
declare const GeometryEditor_base: {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        off(eventsOff: string, handler: Function, context: any): any;
        removeEventListener(): any;
        listens(eventType: string, handler?: Function, context?: any): any;
        getListeningEvents(): string[];
        copyEventListeners(target: any): any;
        fire(): any;
        _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
        _switch(to: any, eventKeys: any, context: any): any;
        _clearListeners(eventType: any): void;
        _clearAllListeners(): void;
        _setEventParent(parent: any): any;
        _setEventTarget(target: any): any;
        _fire(eventType: string, param: any): any;
    };
} & typeof Class;
/**
 * Geometry editor used internally for geometry editing.
 * @category geometry
 * @protected
 * @extends Class
 * @mixes Eventable
 */
declare class GeometryEditor extends GeometryEditor_base {
    _geometry: any;
    _originalSymbol: any;
    _shadowLayer: any;
    editing: boolean;
    _geometryDraggble: boolean;
    _shadow: any;
    _history: any;
    _historyPointer: any;
    _editOutline: any;
    _refreshHooks: Array<any>;
    _updating: boolean;
    /**
     * @param {Geometry} geometry geometry to edit
     * @param {Object} [opts=null] options
     * @param {Object} [opts.symbol=null] symbol of being edited.
     */
    constructor(geometry: any, opts: any);
    /**
     * Get map
     * @return {Map} map
     */
    getMap(): any;
    /**
     * Prepare to edit
     */
    prepare(): void;
    _prepareEditStageLayer(): void;
    /**
     * Start to edit
     */
    start(): void;
    /**
     * Stop editing
     */
    stop(): void;
    /**
     * Whether the editor is editing
     * @return {Boolean}
     */
    isEditing(): boolean;
    _getGeometryEvents(): {
        symbolchange: (param: any) => void;
        dragstart: () => void;
        dragend: () => void;
        'positionchange shapechange': (record: any) => void;
    };
    _switchGeometryEvents(oper: any): void;
    _onGeoSymbolChange(param: any): void;
    _onMarkerDragEnd(): void;
    /**
     * create rectangle outline of the geometry
     * @private
     */
    _createOrRefreshOutline(): any;
    _createCenterHandle(): void;
    _createHandleInstance(containerPoint: any, opts: any): EditHandle;
    createHandle(containerPoint: any, opts: any): EditHandle;
    /**
     * create resize handles for geometry that can resize.
     * @param {Array} blackList handle indexes that doesn't display, to prevent change a geometry's coordinates
     * @param {fn} onHandleMove callback
     * @private
     */
    _createResizeHandles(blackList: any, onHandleMove: any, onHandleUp: any): any[];
    /**
     * Create marker editor
     * @private
     */
    createMarkerEditor(): void;
    /**
     * Create circle editor
     * @private
     */
    createCircleEditor(): void;
    /**
     * editor of ellipse or rectangle
     * @private
     */
    createEllipseOrRectEditor(): void;
    /**
     * Editor for polygon
     * @private
     */
    createPolygonEditor(): void;
    _refresh(): void;
    _hideContext(): void;
    _addRefreshHook(fn: any): void;
    _update(method: any, ...args: any[]): void;
    _updateCoordFromShadow(ignoreRecord?: any): void;
    _recordHistory(method: any, ...args: any[]): void;
    cancel(): this;
    /**
     * Get previous map view in view history
     * @return {Object} map view
     */
    undo(): this;
    /**
     * Get next view in view history
     * @return {Object} map view
     */
    redo(): this;
    _exeAndReset(record: any): void;
    _onDragStart(): void;
    _onDragEnd(): void;
    _exeHistory(record: any): void;
}
export default GeometryEditor;
