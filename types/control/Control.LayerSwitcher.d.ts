import Control from './Control';
/**
 * @classdesc
 * A LayerSwitcher control for the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var LayerSwitcher = new LayerSwitcher({
 *     position : {'top': '0', 'right': '0'}
 * }).addTo(map);
*/
declare class LayerSwitcher extends Control {
    container: HTMLDivElement;
    panel: HTMLDivElement;
    button: HTMLButtonElement;
    /**
     * method to build DOM of the control
     * @return {HTMLDOMElement}
     */
    buildOn(): HTMLElement;
    onAdd(): void;
    onRemove(): void;
    _show(): void;
    _hide(e: any): void;
    _createPanel(): void;
    _renderLayers(map: any, elm: any): void;
    _isExcluded(layer: any): boolean;
    _renderLayer(layer: any, isBase: any, parentChecked?: boolean): HTMLElement;
}
export default LayerSwitcher;
