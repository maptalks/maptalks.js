/**
 * @classdesc
 * Represents a toolbox ui component for geometries.
 * @class
 * @category ui
 * @extends Z.ui.UIComponent
 * @memberOf maptalks.ui
 * @name Toolbox
 */
Z.ui.Toolbox = Z.ui.UIComponent.extend(/** @lends maptalks.ui.Toolbox.prototype */{

    /**
     * @cfg {Object} options toolbox attribute
     */
    options:{
        'autoPan': false,
        'style': 'maptalks-toolbox',
        'vertical' : false,
        'items': []
    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * set items
     * @param {Array} items
     * @return {maptalks.ui.Toolbox}
     * @expose
     */
    setItems: function (items) {
        this.options['items'] = items;
        return this;
    },

    /**
     * get item from Toolbox
     * @return {Array} items
     */
    getItems:function () {
        return this.options['items'];
    },

    /**
     * get pixel size of menu
     * @return {Size} size
     */
    getSize:function () {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    _prepareDOM:function () {
        var container = this._map._panels.toolboxContainer;
        container.innerHTML = '';
        var dom = this._dom = this._createDOM();
        Z.DomUtil.on(dom, 'mousedown dblclick', Z.DomUtil.stopPropagation);
        dom.style.position = 'absolute';
        dom.style.left = -99999 + 'px';
        dom.style.top = -99999 + 'px';
        container.appendChild(dom);
        this._size = new Z.Size(dom.clientWidth + 6, dom.clientHeight);
        dom.style.display = 'none';
        this._map._toolbox =  {
            'target' : this
        };
        return dom;
    },

    _createDOM:function () {
        var dom = Z.DomUtil.createEl('div');
        if (this.options['style']) {
            Z.DomUtil.addClass(dom, this.options['style']);
        }
        var items = this.options['items'];
        if (items && items.length > 0) {
            var maxWidth = 0, maxHeight = 0;
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                if (!item['hidden']) {
                    item['vertical'] = Z.Util.getValueOrDefault(item['vertical'], this.options['vertical']);
                    var buttonDom = new Z.ui.Toolbox.Button(item).getDom();
                    dom.appendChild(buttonDom);
                    maxWidth += Z.Util.getValueOrDefault(item['width'], 0) + 2;
                    maxHeight += Z.Util.getValueOrDefault(item['height'], 0) + 2;
                }
            }
            if (this.options['vertical']) {
                dom.style.height = maxHeight + 'px';
            } else {
                dom.style.width = maxWidth + 'px';
            }
        }
        return dom;
    },

    _createMenuItemDom: function () {
        var me = this;
        var ul = Z.DomUtil.createEl('ul');
        Z.DomUtil.addClass(ul, 'maptalks-menu-items');
        var items = this.getItems();
        function onMenuClick(index) {
            return function (e) {
                var result = this._callback({'target':me, 'index':index});
                if (result === false) {
                    return;
                }
                me.hide();
            };
        }
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            var itemDOM;
            if ('-' === item || '_' === item) {
                itemDOM = Z.DomUtil.createEl('li');
                Z.DomUtil.addClass(itemDOM, 'maptalks-menu-splitter');
            } else {
                itemDOM = Z.DomUtil.createEl('li');
                itemDOM.innerHTML = item['item'];
                itemDOM._callback = item['click'];
                Z.DomUtil.on(itemDOM, 'click', (onMenuClick)(i));
            }
            ul.appendChild(itemDOM);
        }
        return ul;
    },

    _getDOM:function () {
        return this._dom;
    },

    _getWidth:function () {
        var defaultWidth = 160;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    //菜单监听地图的事件
    _registerEvents: function () {
        this._map.on('_zoomstart _zoomend _movestart', this.hide, this);

    },

    //菜单监听地图的事件
    _removeEvents: function () {
        this._map.off('_zoomstart _zoomend _movestart', this.hide, this);
    },

    //获取菜单显示位置
    _getAnchor: function (coordinate) {
        if (!coordinate) {
            coordinate = this._target.getCenter();
        }
        var anchor = this._map.coordinateToViewPoint(coordinate);
        //offset menu on the top of the arrow
        return anchor.add(new Z.Point(-17, 10));
    }

});

/**
 * 按钮控件
 * @class maptalks.Button
 * @extends maptalks.Class
 * @author Maptalks Team
 */
Z.ui.Toolbox.Button = Z.Class.extend({

    /**
     * @cfg {Object} options 按钮属性
     */
    options:{
        'hidden': false,
        'icon' : '',
        'text' : '左',
        'click' : null,
        'mouseover' : null,
        'mouseout' : null,
        'children' : []
    },

    /**
     * 初始化按钮
     * @constructor
     * @param {Object} options
     * @returns {maptalks.Button}
     */
    initialize: function (options) {
        if (options) {
            this._dom = this._createDom(options);
        }
    },

    _createDom : function (options) {
        return this._createMenuDom(options);
    },

    _createMenuDom : function (options, tag) {
        var _menuDom = Z.DomUtil.createEl('span');
        if (tag) {
            _menuDom = Z.DomUtil.createEl(tag);
        }
        var width = Z.Util.getValueOrDefault(options['width'], 16);
        var height = Z.Util.getValueOrDefault(options['height'], 16);
        var vertical = Z.Util.getValueOrDefault(options['vertical'], false);
        var block = 'inline-block';
        if (vertical) {
            block = 'block';
        }
        _menuDom.style.cssText = 'text-align:center;display:-moz-inline-box;display:' + block + ';width:' + width + 'px;height:' + height + 'px;';
        Z.DomUtil.on(_menuDom, 'click dblclick contextmenu', Z.DomUtil.stopPropagation);
        Z.DomUtil.addClass(_menuDom, 'maptalks-toolbox-button');
        _menuDom.appendChild(this._createIconDom(options));
        if (options['click']) {
            Z.DomUtil.on(_menuDom, 'click', options['click'], this);
        }
        if (options['mouseover']) {
            Z.DomUtil.on(_menuDom, 'mouseover', options['mouseover'], this);
        }
        if (options['mouseout']) {
            Z.DomUtil.on(_menuDom, 'mouseout', options['mouseout'], this);
        }
        _menuDom = this._createDropMenu(_menuDom, options, tag);
        return _menuDom;
    },

    _createDropMenu: function (_parentDom, options, tag) {
        var vertical = Z.Util.getValueOrDefault(options['vertical'], false);
        var block = 'block';
        function addMenuDropEvent(dropdownMenu, trigger, tag) {
            if (trigger === 'click') {
                Z.DomUtil.on(_parentDom, 'click', function () {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: ' + block);
                }, this);
                Z.DomUtil.on(dropdownMenu, 'mouseover', function () {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: ' + block);
                }, this);
            } else {
                Z.DomUtil.on(_parentDom, 'mouseover', function () {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: ' + block);
                }, this);
            }

            Z.DomUtil.on(dropdownMenu, 'mouseout', function () {
                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
            }, this);

            Z.DomUtil.on(_parentDom, 'mouseout', function () {
                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
            }, this);
        }
        if (options['children'] && options['children'].length > 0) {
            var style = 'display: none; position: absolute;';
            var width = Z.Util.getValueOrDefault(options['width'], 20);
            var height = Z.Util.getValueOrDefault(options['height'], 20);
            if (vertical) {
                style += 'left:' + width + 'px';
            } else {
                style += 'top:' + height + 'px';
            }
            var dropdownMenu = Z.DomUtil.createElOn('ul', style);

            // var menuClass = this._getMenuClass(options, tag);
            // Z.DomUtil.addClass(dropdownMenu, menuClass);

            var trigger = options['trigger'];

            addMenuDropEvent(dropdownMenu, trigger, tag);

            //构造下拉菜单
            var items = options['children'];
            if (items && items.length > 0) {
                for (var i = 0, len = items.length; i < len; i++) {
                    var item = items[i];
                    item['vertical'] = !Z.Util.getValueOrDefault(item['vertical'], options['vertical']);
                    dropdownMenu.appendChild(this._createMenuDom(item, 'li'));
                }
            }
            _parentDom.appendChild(dropdownMenu);
        }
        return _parentDom;
    },

    _createIconDom : function (options) {
        var _spanDom = Z.DomUtil.createEl('span');
        var icon = options['icon'];
        var content = options['item'];
        var title = options['title'];
        var html = options['html'];
        if (icon) {
            var width = Z.Util.getValueOrDefault(options['iconWidth'], options['width']);
            var height = Z.Util.getValueOrDefault(options['iconHeight'], options['height']);
            var _imgDom = Z.DomUtil.createEl('img');
            _imgDom.src = icon;
            _imgDom.border = 0;
            _imgDom.width = width;
            _imgDom.height = height;
            if (title) {
                _imgDom.title = title;
            }
            _spanDom.appendChild(_imgDom);
            if (content) {
                if (html) {
                    if (typeof content === 'string') {
                        _spanDom.innerText = content;
                    } else {
                        _spanDom.appendChild(content);
                    }
                } else {
                    _spanDom.innerText = content;
                }
            }
            return _spanDom;
        } else {
            var _contentSpanDom = Z.DomUtil.createEl('span');
            if (content) {
                if (typeof content === 'string') {
                    _spanDom.innerText = content;
                } else {
                    _spanDom.appendChild(content);
                }
            }
            if (html) {
                _spanDom.appendChild(content);
            }
            return _spanDom;
        }
    },

    /**
     * 获取button dom
     */
    getDom: function () {
        return this._dom;
    }
});
