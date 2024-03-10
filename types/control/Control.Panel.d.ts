import DragHandler from '../handler/Drag';
import Control from './Control';
/**
 * @classdesc
 * Class for panel controls.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var panel = new Panel({
 *     position : {'bottom': '0', 'right': '0'},
 *     draggable : true,
 *     custom : false,
 *     content : '<div class="map-panel">hello </div>',
 *     closeButton : true
 * }).addTo(map);
 */
declare class Panel extends Control {
    draggable: DragHandler;
    _startPos: any;
    _startPosition: any;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(): any;
    /**
     * update control container
     * @return {control.Panel} this
     */
    update(): any;
    /**
     * Set the content of the Panel.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {control.Panel} this
     * @fires Panel#contentchange
     */
    setContent(content: any): this;
    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent(): any;
    _cancelOn(domEvent: any): boolean;
    _onDragStart(param: any): void;
    _onDragging(param: any): void;
    _onDragEnd(param: any): void;
    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints(): import("src").Coordinate[];
}
export default Panel;
