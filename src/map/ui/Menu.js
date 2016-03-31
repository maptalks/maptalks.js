/**
 * @classdesc
 * Class for context menu, useful for interactions with right clicks on the map.
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
     * @cfg {Object} options menu属性
     */
    options: {
        'autoPan': false,
        'custom' : false,
        'width'  : 160,
        'style'  : 'default',//black|white
        'position' : null,
        'items'  : []
    },

    initialize: function(options) {
        Z.Util.setOptions(this, options);
    },

    addTo:function(target) {
        this._target = target;
    },

    getMap:function() {
        if (this._target instanceof Z.Map) {
            return this._target;
        }
        return this._target.getMap();
    },

    /**
     * 设置菜单项目
     * @param {Array} items 菜单项
     * @return {maptalks.ui.Menu} 菜单
     * @expose
     */
    setItems: function(items) {
        this.options['items'] = items;
        return this;
    },

    /**
     * 获取设置的菜单项
     * @return {*} [description]
     */
    getItems:function() {
        return this.options['items'];
    },

    _getDomOffset:function() {
        return new Z.Point(-17, 10);
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

    _createMenuItemDom: function() {
        var me = this;
        var ul = Z.DomUtil.createEl('ul');
        Z.DomUtil.addClass(ul,'maptalks-menu-items');
        var items = this.getItems();
        function onMenuClick(index) {
            return function(e) {
                    var result = this._callback({'target':me, 'index':index});
                    if (result === false) {
                        return;
                    }
                    me.hide();
                }
        }
        for (var i=0, len=items.length;i<len;i++) {
            var item = items[i];
            var itemDOM;
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

    /**
     * Register the events for menu to listen.
     * @private
     */
    _registerEvents: function() {
        this.getMap().on('_zoomstart _zoomend _movestart _dblclick _click', this.hide, this);
    },

    /**
     * Remove event listeners
     * @private
     */
    _removeEvents: function() {
        this.getMap().off('_zoomstart _zoomend _movestart _dblclick _click', this.hide, this);
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
        if (Z.Util.isArray(options)) {
            options = {
                'items' : options
            };
        }
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
