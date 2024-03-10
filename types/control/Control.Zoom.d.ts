import Control from './Control';
/**
 * @classdesc
 * A zoom control with buttons to zoomin/zoomout and a slider indicator for the zoom level.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var zoomControl = new Zoom({
 *     position : 'top-left',
 *     slider : true,
 *     zoomLevel : false
 * }).addTo(map);
 */
declare class Zoom extends Control {
    _levelDOM: HTMLElement;
    _zoomInButton: HTMLElement;
    _zoomOutButton: HTMLElement;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map: any): HTMLElement;
    onRemove(): void;
    _update(): void;
    _updateText(): void;
    _registerDomEvents(): void;
    _onZoomInClick(e: any): void;
    _onZoomOutClick(e: any): void;
}
export default Zoom;
