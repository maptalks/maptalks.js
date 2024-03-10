import Map from '../map/Map';
import Control from './Control';
/**
 * @classdesc
 * An overview control for the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var overview = new Overview({
 *     position: {'bottom': '0', 'right': '0'},
 *     size: [300, 200]
 * }).addTo(map);
 */
declare class Overview extends Control {
    mapContainer: HTMLDivElement;
    button: HTMLDivElement;
    _overview: Map;
    _perspective: any;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(): HTMLElement;
    onAdd(): void;
    onRemove(): void;
    /**
     * Maximize overview control
     * @returns {control.Overview}
     */
    maxmize(): this;
    /**
     * Minimize overview control
     * @returns {control.Overview}
     */
    minimize(): this;
    /**
     * Return overview's map object
     * @returns {Map}
     */
    getOverviewMap(): Map;
    _onButtonClick(): void;
    _updateButtonText(): void;
    _createOverview(): void;
    _getOverviewZoom(): number;
    _onDragEnd(): void;
    _getPerspectiveCoords(): any;
    _update(): void;
    _updateSpatialReference(): void;
    _updateBaseLayer(): void;
}
export default Overview;
