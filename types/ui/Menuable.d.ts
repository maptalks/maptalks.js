/**
 * Mixin of the context menu methods.
 * @mixin ui.Menuable
 */
declare const Menuable: {
    /**
     * Set a context menu
     * @param {Object} options - menu options
     * @return {*} this
     * @example
     * foo.setMenu({
     *  'width'  : 160,
     *  'custom' : false,
     *  'items' : [
     *      //return false to prevent event propagation
     *     {'item': 'Query', 'click': function() {alert('Query Clicked!'); return false;}},
     *     '-',
     *     {'item': 'Edit', 'click': function() {alert('Edit Clicked!')}},
     *     {'item': 'About', 'click': function() {alert('About Clicked!')}}
     *    ]
     * });
     * @function ui.Menuable.setMenu
     */
    setMenu(options: any): any;
    /**
    * get a context menu
    * @return {*} ui.Menu
    * @function ui.Menuable.getMenu
    */
    getMenu(): any;
    /**
     * Open the context menu, default on the center of the geometry or map.
     * @param {Coordinate} [coordinate=null] - coordinate to open the context menu
     * @return {*} this
     * @function ui.Menuable.openMenu
     */
    openMenu(coordinate: any): any;
    /**
     * Set menu items to the context menu
     * @param {Object[]} items - menu items
     * @return {*} this
     * @function ui.Menuable.setMenuItems
     */
    setMenuItems(items: any): any;
    /**
     * Get the context menu items
     * @return {Object[]}
     * @function ui.Menuable.getMenuItems
     */
    getMenuItems(): any;
    /**
     * Close the contexnt menu
     * @return {*} this
     * @function ui.Menuable.closeMenu
     */
    closeMenu(): any;
    /**
     * Remove the context menu
     * @return {*} this
     * @function ui.Menuable.removeMenu
     */
    removeMenu(): any;
    _bindMenu(): any;
    _unbindMenu(): any;
    /**
     * If contextmenu is not listened, open the menu in default.<br>
     * Otherwise, do nothing here.
     * @param  {Object} param - event parameter
     * @return {Boolean} true | false to stop event propagation
     * @private
     */
    _defaultOpenMenu(param: any): boolean;
};
export default Menuable;
