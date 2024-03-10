import Point from '../geo/Point';
import UIComponent from './UIComponent';
/**
 * @classdesc
 * Class for context menu, useful for interactions with right clicks on the map.
 * @category ui
 * @extends ui.UIComponent
 * @memberOf ui
 */
declare class Menu extends UIComponent {
    /**
     * Menu items is set to options.items or by setItems method. <br>
     * <br>
     * Normally items is a object array, containing: <br>
     * 1. item object: {'item': 'This is a menu text', 'click': function() {alert('oops! You clicked!');)}} <br>
     * 2. minus string "-", which will draw a splitor line on the menu. <br>
     * <br>
     * If options.custom is set to true, the menu is considered as a customized one. Then items is the customized html codes or HTMLElement. <br>
     * @param {Object} options - options defined in [ui.Menu]{@link ui.Menu#options}
     */
    constructor(options: any);
    _getClassName(): string;
    addTo(owner: any): any;
    /**
     * Set the items of the menu.
     * @param {Object[]|String|HTMLElement} items - items of the menu
     * return {ui.Menu} this
     * @example
     * menu.setItems([
     *      //return false to prevent event propagation
     *     {'item': 'Query', 'click': function() {alert('Query Clicked!'); return false;}},
     *     '-',
     *     {'item': 'Edit', 'click': function() {alert('Edit Clicked!')}},
     *     {'item': 'About', 'click': function() {alert('About Clicked!')}}
     * ]);
     */
    setItems(items: any): this;
    /**
     * Get items of  the menu.
     * @return {Object[]|String|HTMLElement} - items of the menu
     */
    getItems(): any;
    /**
     * Create the menu DOM.
     * @protected
     * @return {HTMLElement} menu's DOM
     */
    buildOn(): any;
    /**
     * Offset of the menu DOM to fit the click position.
     * @return {Point} offset
     * @private
     */
    getOffset(): Point;
    getTransformOrigin(): string;
    getEvents(): {
        '_zoomstart _zoomend _movestart _dblclick _click': () => void;
    };
    _createMenuItemDom(): HTMLElement;
    _getMenuWidth(): any;
}
export default Menu;
