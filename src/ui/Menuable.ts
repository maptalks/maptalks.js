import Map from '../map/Map';
import Geometry from '../geometry/Geometry';
import Menu, { MenuItem, MenuOptionsType } from './Menu';
import { Coordinate } from '../geo';

interface MenuAbles {
    _menuOptions: MenuOptionsType;
    _menu: Menu;
    setMenu(options: MenuOptionsType): this;
    getMenu(): Menu;
    openMenu(coordinate?: Coordinate): this;
    setMenuItems(items: Array<MenuItem>): this;
    getMenuItems(): Array<MenuItem>;
    closeMenu(): this;
    removeMenu(): this;
    _bindMenu(): this;
    _unbindMenu(): this;
    _defaultOpenMenu(param: any): boolean;
}


declare module "../geometry/Geometry" {

    interface Geometry extends MenuAbles {

    }
}

declare module "../map/Map" {

    interface Map extends MenuAbles {

    }
}

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
    setMenu(options: MenuOptionsType) {
        this._menuOptions = options;

        if (this._menu) {
            this._menu.setOptions(options);
        } else {
            this.on('contextmenu', this._defaultOpenMenu, this);
        }
        return this;
    },

    /**
    * get a context menu
    * @return {*} ui.Menu
    * @function ui.Menuable.getMenu
    */
    getMenu(): Menu {
        return this._menu;
    },

    /**
     * Open the context menu, default on the center of the geometry or map.
     * @param {Coordinate} [coordinate=null] - coordinate to open the context menu
     * @return {*} this
     * @function ui.Menuable.openMenu
     */
    openMenu(coordinate?: Coordinate) {
        const map = (this instanceof Map) ? this : this.getMap();
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._menu) {
            if (this._menuOptions && map) {
                this._bindMenu();
                this._menu.show(coordinate);
            }
        } else {
            this._menu.show(coordinate);
        }
        /**
           * openmenu event
           *
           * @event Geometry#openmenu
           * @type {Object}
           * @property {String} type - openmenu
           * @property {Geometry} target - the geometry fires the event
           */

        /**
         * openmenu event
         *
         * @event Map#openmenu
         * @type {Object}
         * @property {String} type - openmenu
         * @property {Map} target - the Map fires the event
         */
        this.fire('openmenu', {
            coordinate
        });
        return this;
    },

    /**
     * Set menu items to the context menu
     * @param {Object[]} items - menu items
     * @return {*} this
     * @function ui.Menuable.setMenuItems
     */
    setMenuItems(items: Array<MenuItem>) {
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
    getMenuItems(): Array<MenuItem> {
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
        /**
       * closemenu event
       *
       * @event Geometry#closemenu
       * @type {Object}
       * @property {String} type - closemenu
       * @property {Geometry} target - the geometry fires the event
       */

        /**
         * closemenu event
         *
         * @event Map#closemenu
         * @type {Object}
         * @property {String} type - closemenu
         * @property {Map} target - the Map fires the event
         */
        this.fire('closemenu', {});
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
        /**
        * removemenu event
        *
        * @event Geometry#removemenu
        * @type {Object}
        * @property {String} type - removemenu
        * @property {Geometry} target - the geometry fires the event
        */

        /**
         * removemenu event
         *
         * @event Map#removemenu
         * @type {Object}
         * @property {String} type - removemenu
         * @property {Map} target - the Map fires the event
         */
        this.fire('removemenu', {});
        return this;
    },

    _bindMenu() {
        if (!this._menuOptions) {
            return this;
        }
        this._menu = new Menu(this._menuOptions);
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
        // 如果用户想自定义右键菜单，其不应该setMenu,既然其设置了说明就是想用默认的menu,应该根据是否设置了menu为参考依据而不是 contextmenu监听次数
        this.openMenu(param['coordinate']);
        return false;
    }
};

Map.include(Menuable);
Geometry.include(Menuable);

export default Menuable;
