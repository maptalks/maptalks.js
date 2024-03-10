import Control from './Control';
declare class Compass extends Control {
    _compass: HTMLDivElement;
    _bearing: number;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map: any): HTMLElement;
    onAdd(): void;
    _getCompass(): HTMLElement;
    _registerDomEvents(): void;
    _rotateCompass(): void;
    onRemove(): void;
    _resetView(): void;
}
export default Compass;
