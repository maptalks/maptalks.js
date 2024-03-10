import Control from './Control';
declare class Reset extends Control {
    _reset: HTMLDivElement;
    _view: object;
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(): HTMLElement;
    onAdd(): void;
    setView(view: any): void;
    _getReset(): HTMLElement;
    _registerDomEvents(): void;
    onRemove(): void;
    _resetView(): void;
}
export default Reset;
