import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import UIComponent from './UIComponent';
declare const UIMarker_base: {
    new (...args: any[]): {
        _handlers: any[];
        addHandler(name: any, handlerClass: any): any;
        removeHandler(name: any): any;
        _clearHandlers(): void;
    };
} & typeof UIComponent;
/**
 *
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate. <br>
 *
 * @category ui
 * @extends ui.UIComponent
 * @mixes Handlerable
 * @memberOf ui
 * @example
 * var dom = document.createElement('div');
 * dom.innerHTML = 'hello ui marker';
 * var marker = new maptalks.ui.UIMarker([0, 0], {
 *      draggable : true,
 *      content : dom
 *  }).addTo(map);
 */
declare class UIMarker extends UIMarker_base {
    _markerCoord: Coordinate;
    _mousedownEvent: MouseEvent;
    _mouseupEvent: MouseEvent;
    _touchstartTime: number;
    /**
     * As it's renderered by HTMLElement such as a DIV, it: <br>
     * 1. always on the top of all the map layers <br>
     * 2. can't be snapped as it's not drawn on the canvas. <br>
     * @param  {Coordinate} coordinate - UIMarker's coordinates
     * @param {Object} options - options defined in [UIMarker]{@link UIMarker#options}
     */
    constructor(coordinate: any, options: any);
    _getClassName(): string;
    /**
     * Sets the coordinates
     * @param {Coordinate} coordinates - UIMarker's coordinate
     * @returns {UIMarker} this
     * @fires UIMarker#positionchange
     */
    setCoordinates(coordinates: any): this;
    /**
     * Gets the coordinates
     * @return {Coordinate} coordinates
     */
    getCoordinates(): Coordinate;
    getCenter(): Coordinate;
    getAltitude(): any;
    setAltitude(alt: any): this;
    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {UIMarker} this
     * @fires UIMarker#contentchange
     */
    setContent(content: any): this;
    /**
     * Gets the content of the UIMarker
     * @return {String|HTMLElement} content
     */
    getContent(): any;
    onAdd(): void;
    /**
     * Show the UIMarker
     * @returns {UIMarker} this
     * @fires UIMarker#showstart
     * @fires UIMarker#showend
     */
    show(): this;
    /**
     * Flash the UIMarker, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {UIMarker} this
     */
    flash(interval: any, count: any, cb: any, context: any): any;
    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn(): any;
    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {Point} offset
     */
    getOffset(): Point;
    /**
     * Gets UIMarker's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin(): string;
    onDomRemove(): void;
    /**
     * Whether the uimarker is being dragged.
     * @returns {Boolean}
     */
    isDragging(): any;
    _registerDOMEvents(dom: any): void;
    _onDomEvents(e: any): void;
    _removeDOMEvents(dom: any): void;
    _mouseClickPositionIsChange(): boolean;
    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints(): any[];
    _getViewPoint(): any;
    _getDefaultEvents(): object;
    _setPosition(): void;
    onZoomFilter(): void;
    isVisible(): boolean;
    isSupportZoomFilter(): boolean;
}
export default UIMarker;
