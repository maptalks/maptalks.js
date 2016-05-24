/**
 * @classdesc
 * Class for context menu, useful for interactions with right clicks on the map.
 *
 * Menu items is set to options.items or by setItems method.
 *
 * Normally items is a object array, containing:
 * 1. item object: {'item': 'This is a menu text', 'click': function() {alert('oops! You clicked!');)}}
 * 2. minus string "-", which will draw a splitor line on the menu.
 *
 * If options.custom is set to true, the menu is considered as a customized one. Then items is the customized html codes or HTMLElement.
 *
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - construct options
 * @memberOf maptalks.ui
 * @name Menu
 */
Z.ui.Menu = Z.ui.UIComponent.extend(/** @lends maptalks.ui.Menu.prototype */{

    statics : {
        'single' : true
    },

    /**
     * @property {Object} options
     * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened menu.
     * @property {Number}  [options.width=160]      - default width
     * @property {String|HTMLElement} [options.custom=false]  - set it to true if you want a customized menu, customized html codes or a HTMLElement is set to items.
     * @property {Object[]|String|HTMLElement}  options.items   - html code or a html element is options.custom is true. Or a menu items array, containing: item objects, "-" as a splitor line
     */
    options: {
        'eventsToStop' : 'mousedown dblclick click',
        'autoPan': false,
        'width'  : 160,
        'custom' : false,
        'items'  : []
    },

    initialize: function(options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * Set the items of the menu.
     * @param {Object[]|String|HTMLElement} items - items of the menu
     * return {maptalks.ui.Menu} this
     */
    setItems: function(items) {
        this.options['items'] = items;
        return this;
    },

    /**
     * Get items of  the menu.
     * @return {Object[]|String|HTMLElement} - items of the menu
     */
    getItems:function() {
        return this.options['items'];
    },

    _createDOM:function() {
        if (this.options['custom']) {
            if (Z.Util.isString(this.options['items'])) {
                var container = Z.DomUtil.createEl('div');
                container.innerHTML = this.options['items'];
                return container;
            } else {
                return this.options['items'];
            }
        } else {
            var dom = Z.DomUtil.createEl('div');
            Z.DomUtil.addClass(dom, 'maptalks-menu');
            dom.style.width = this._getMenuWidth()+'px';
            var arrow = Z.DomUtil.createEl('em');
            Z.DomUtil.addClass(arrow, 'maptalks-ico');
            var menuItems = this._createMenuItemDom();
            dom.appendChild(arrow);
            dom.appendChild(menuItems);
            return dom;
        }
    },

    /**
     * Offset of the menu DOM to fit the click position.
     * @return {maptalks.Point} offset
     * @private
     */
    _getDomOffset:function() {
        return new Z.Point(-17, 10);
    },

    _createMenuItemDom: function() {
        var me = this;
        var ul = Z.DomUtil.createEl('ul');
        Z.DomUtil.addClass(ul,'maptalks-menu-items');
        var items = this.getItems();
        function onMenuClick(index) {
            return function(e) {
                    var result = this._callback({'target':me, 'owner':me._owner, 'index':index});
                    if (result === false) {
                        return;
                    }
                    me.hide();
                }
        }
        var item, itemDOM;
        for (var i=0, len=items.length;i<len;i++) {
            item = items[i];
            itemDOM;
            if ('-' === item || '_' === item) {
                itemDOM = Z.DomUtil.createEl('li');
                Z.DomUtil.addClass(itemDOM, 'maptalks-menu-splitter');
            } else {
                itemDOM = Z.DomUtil.createEl('li');
                itemDOM.innerHTML = item['item'];
                itemDOM._callback = item['click'];
                Z.DomUtil.on(itemDOM,'click',(onMenuClick)(i));
            }
            ul.appendChild(itemDOM);
        }
        return ul;
    },

    _getMenuWidth:function() {
        var defaultWidth = 160;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    _getEvents: function() {
        return {
            '_zoomstart _zoomend _movestart _dblclick _click' : this.hide
        };
    }
});

/**
 * Mixin of the context menu methods.
 * @mixin
 * @memberOf maptalks.ui
 * @name Menu.Mixin
 */
Z.ui.Menu.Mixin={
    /**
    * Set a context menu
    * @param {Object} options - menu options
    * @return {*} this
    */
    setMenu: function(options) {
        this._menuOptions = options;
        if (this._menu) {
            Z.Util.setOptions(this._menu, options);
        } else {
            this.on('contextmenu', this._defaultOpenMenu, this);
        }
        return this;
    },

    /**
    * Open the context menu
    * @param {maptalks.Coordinate} [coordinate=null] - coordinate to open the context menu
    * @return {*} this
    */
    openMenu: function(coordinate) {
        var map = (this instanceof Z.Map)?this:this.getMap();
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
     * Get the menu options
     * @return {Object} menuOptions
     */
    getMenuOptions: function() {
        if (!this._menuOptions) {
            return null;
        }
        return Z.Util.extend({}, this._menuOptions);
    },

    /**
    * Set menu items to the context menu
    * @param {Object[]} items - menu items
    * @return {*} this
    */
    setMenuItems: function(items) {
        if (this._menuOptions) {
            this._menuOptions['items'] = items;
        }
        if (this._menu) {
            this._menu.setItems(items);
        }
        return this;
    },

    /**
     * Get the context menu items
     * @return {Object[]}
     */
    getMenuItems:function() {
        if (this._menu) {
            return this._menu.getItems();
        } else {
            return null;
        }
    },

    /**
    * Close the contexnt menu
    * @return {*} this
    */
    closeMenu: function() {
        if(this._menu) {
            this._menu.hide();
        }
        return this;
    },

    /**
     * Remove the context menu
     * @return {*} this
     */
    removeMenu:function() {
        this.off('contextmenu', this._defaultOpenMenu, this);
        this._unbindMenu();
        delete this._menuOptions;
        return this;
    },

    _bindMenu: function(options) {
        this._menu = new Z.ui.Menu(options);
        this._menu.addTo(this);

        return this;
    },

    _unbindMenu:function() {
        if (this._menu) {
            this.closeMenu();
            this._menu.remove();
            delete this._menu;
        }
        return this;
    },

     /**
     * 应用没有注册contextmenu事件时, 默认在contextmenu事件时打开右键菜单
     * 如果注册过contextmenu事件, 则不做任何操作
     * @param  {*} param [description]
     * @return {*}       [description]
     * @default
     */
    _defaultOpenMenu:function(param) {
        if (this.listens('contextmenu')>1) {
            return;
        } else {
            this.openMenu(param['coordinate']);
        }
    }
};
