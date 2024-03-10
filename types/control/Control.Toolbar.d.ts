import Control from './Control';
/**
 * @classdesc
 * A toolbar control of the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var toolbar = new Toolbar({
 *     position : 'top-right',
 *     items: [
 *          {
 *            item: 'item1',
 *            click: function () {
 *              alert('item1 clicked');
 *            }
 *          },
 *          {
 *            item: 'item2',
 *            click: function () {
 *              alert('item2 clicked');
 *            }
 *          }
 *      ]
 * }).addTo(map);
 */
declare class Toolbar extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map: any): HTMLElement;
    _createDropMenu(index: any): HTMLElement;
    _getItems(): any;
}
export default Toolbar;
