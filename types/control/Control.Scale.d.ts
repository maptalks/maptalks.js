import Control from './Control';
declare class Scale extends Control {
    _scaleContainer: HTMLDivElement;
    _mScale: HTMLDivElement;
    _iScale: HTMLDivElement;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map: any): HTMLDivElement;
    onRemove(): void;
    _addScales(): void;
    _update(): void;
    _updateScales(maxMeters: any): void;
    _updateMetric(maxMeters: any): void;
    _updateImperial(maxMeters: any): void;
    _updateScale(scale: any, text: any, ratio: any): void;
    _getRoundNum(num: any): number;
}
export default Scale;
