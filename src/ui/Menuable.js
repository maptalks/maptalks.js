import Map from '../map/Map';
import Geometry from '../geometry/Geometry';
import Menu from './Menu';

/**
 * Mixin of the context menu methods.
 * @mixin ui.Menuable
 */
const Menuable = {
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
    setMenu(options) {
        this._menuOptions = options;

        if (this._menu) {
            this._menu.setOptions(options);
        } else {
            this.on('contextmenu', this._defaultOpenMenu, this);
        }
        return this;
    },

    /**
     * Open the context menu, default on the center of the geometry or map.
     * @param {Coordinate} [coordinate=null] - coordinate to open the context menu
     * @return {*} this
     * @function ui.Menuable.openMenu
     */
    openMenu(coordinate) {
        const map = (this instanceof Map) ? this : this.getMap();
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._menu) {
            if (this._menuOptions && map) {
                this._bindMenu(this._menuOptions);
                this._menu.show(coordinate);
            }
        } else {
            this._menu.show(coordinate);
        }
        return this;
    },

    /**
     * Set menu items to the context menu
     * @param {Object[]} items - menu items
     * @return {*} this
     * @function ui.Menuable.setMenuItems
     */
    setMenuItems(items) {
        if (!this._menuOptions) {
            this._menuOptions = {};
        }
        if (Array.isArray(items)) {
            this._menuOptions['custom'] = false;
        }
        this._menuOptions['items'] = items;
        this.setMenu(this._menuOptions);
        return this;
    },

    /**
     * Get the context menu items
     * @return {Object[]}
     * @function ui.Menuable.getMenuItems
     */
    getMenuItems() {
        if (this._menu) {
            return this._menu.getItems();
        } else if (this._menuOptions) {
            return this._menuOptions['items'] || [];
        }
        return [];
    },

    /**
     * Close the contexnt menu
     * @return {*} this
     * @function ui.Menuable.closeMenu
     */
    closeMenu() {
        if (this._menu) {
            this._menu.hide();
        }
        return this;
    },

    /**
     * Remove the context menu
     * @return {*} this
     * @function ui.Menuable.removeMenu
     */
    removeMenu() {
        this.off('contextmenu', this._defaultOpenMenu, this);
        this._unbindMenu();
        delete this._menuOptions;
        return this;
    },

    _bindMenu(options) {
        this._menu = new Menu(options);
        this._menu.addTo(this);

        return this;
    },

    _unbindMenu() {
        if (this._menu) {
            this.closeMenu();
            this._menu.remove();
            delete this._menu;
        }
        return this;
    },

    /**
     * If contextmenu is not listened, open the menu in default.<br>
     * Otherwise, do nothing here.
     * @param  {Object} param - event parameter
     * @return {Boolean} true | false to stop event propagation
     * @private
     */
    _defaultOpenMenu(param) {
        if (this.listens('contextmenu') > 1) {
            return true;
        } else {
            this.openMenu(param['coordinate']);
            return false;
        }
    }
};

Map.include(Menuable);
Geometry.include(Menuable);

export default Menuable;
