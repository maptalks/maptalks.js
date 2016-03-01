/**
 * @classdesc
 * Class for button on a [maptalks.Toolbar]{@link maptalks.Toolbar}
 * @class
 * @extends maptalks.Class
 * @param {Object} options - construct options
 */
Z.Button = Z.Class.extend(/** @lends maptalks.Button.prototype */{

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
    initialize: function(options) {
        if(options) {
            this._dom = this._createDom(options);
        }
    },

    _createDom : function(options) {
        return this._createMenuDom(options);
    },

    _createMenuDom : function(options, tag) {
        var _menuDom = Z.DomUtil.createEl('span');
        if(tag) {
            _menuDom = Z.DomUtil.createEl(tag);
        }
        var width = Z.Util.getValueOrDefault(options['width'],16);
        var height = Z.Util.getValueOrDefault(options['height'],16);
        var vertical = Z.Util.getValueOrDefault(options['vertical'],false);
        var block = 'inline-block';
        if(vertical) {
            block = 'block';
        }
        _menuDom.style.cssText='text-align:center;display:-moz-inline-box;display:'+block+';width:'+width+'px;height:'+height+'px;';
        _menuDom.style.cssText
        Z.DomUtil.on(_menuDom, 'click dblclick contextmenu', Z.DomUtil.stopPropagation);
        Z.DomUtil.addClass(_menuDom, 'maptalks-control-button');
        _menuDom.appendChild(this._createIconDom(options));
        if(options['click']) {
            Z.DomUtil.on(_menuDom, 'click', options['click'], this);
        }
        if(options['mouseover']) {
            Z.DomUtil.on(_menuDom, 'mouseover', options['mouseover'], this);
        } else {
            Z.DomUtil.on(_menuDom, 'mouseover', function() {
                Z.DomUtil.removeClass(_menuDom, 'maptalks-control-button');
                Z.DomUtil.addClass(_menuDom, 'maptalks-control-button-hover');
            }, this);
        }
        if(options['mouseout']) {
            Z.DomUtil.on(_menuDom, 'mouseout', options['mouseout'], this);
        } else {
            Z.DomUtil.on(_menuDom, 'mouseout', function() {
                Z.DomUtil.removeClass(_menuDom, 'maptalks-control-button-hover');
                Z.DomUtil.addClass(_menuDom, 'maptalks-control-button');
            }, this);
        }
        _menuDom = this._createDropMenu(_menuDom, options, tag);
        return _menuDom;
    },

    _createDropMenu: function(_parentDom, options, tag) {
        var vertical = Z.Util.getValueOrDefault(options['vertical'],false);
        var block = 'inline-block';
        if(vertical) {
            block = 'block';
        }
        function addMenuDropEvent(dropdownMenu, trigger, tag) {
            if(trigger === 'click') {
                Z.DomUtil.on(_parentDom, 'click', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: '+block);
                }, this);
                Z.DomUtil.on(dropdownMenu, 'mouseover', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: '+block);
                }, this);
            } else {
                Z.DomUtil.on(_parentDom, 'mouseover', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display: '+block);
                }, this);
            }

//            Z.DomUtil.on(_parentDom, 'mouseout', function() {
//                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
//            }, this);

            Z.DomUtil.on(dropdownMenu, 'mouseout', function() {
                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
            }, this);
        }
        if(options['children'] && options['children'].length>0) {
            var dropdownMenu = Z.DomUtil.createElOn('ul', 'display: none;');
            var menuClass = this._getMenuClass(options, tag);
            Z.DomUtil.addClass(dropdownMenu, menuClass);

            var trigger = options['trigger'];

            addMenuDropEvent(dropdownMenu,trigger, tag);

            //构造下拉菜单
            var items = options['children'];
            if(items&&items.length>0) {
                for(var i=0,len=items.length;i<len;i++) {
                    var item = items[i];
                    item['vertical'] = Z.Util.getValueOrDefault(item['vertical'],options['vertical']);
                    item['position'] = options['position'];
                    dropdownMenu.appendChild(this._createMenuDom(item, 'li'));
                }
            }
            _parentDom.appendChild(dropdownMenu);
        }
        return _parentDom;
    },

    _createIconDom : function(options) {
        var _spanDom = Z.DomUtil.createEl('span');
        var icon = options['icon'];
        var content = options['item'];
        var html = options['html'];
        if(icon) {
            var width = Z.Util.getValueOrDefault(options['iconWidth'],options['width']);
            var height = Z.Util.getValueOrDefault(options['iconHeight'],options['height']);
            var _imgDom = Z.DomUtil.createEl('img');
            _imgDom.src=icon;
            _imgDom.border=0;
            _imgDom.width=width;
            _imgDom.height=height;
            _spanDom.appendChild(_imgDom);
            if(content) {
                if(html) {
                    if(typeof content === 'string') {
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
            if(typeof content === 'string') {
                _spanDom.innerText = content;
            } else {
                _spanDom.appendChild(content);
            }
           return _spanDom;
        }
    },

    _getMenuClass: function(options, tag) {
        var className = '';
        var vertical = options['vertical'];
        var position = options['position'];
        if (vertical) {//菜单垂直
            className = this._getClassName(position);
            if(position['bottom']) {
                if(position['right']) {
                    className = 'maptalks-control-menu-right-up';
                } else if (position['left']){
                    className = 'maptalks-control-menu-left-up';
                }
            }
        } else {
            if (position['bottom']) {
                if(tag) {
                    className = this._getClassName(position);
                    if(position['right']) {
                        className = 'maptalks-control-menu-right-up';
                    } else if(position['left']) {
                        className = 'maptalks-control-menu-left-up';
                    }
                } else {
                    className = 'maptalks-control-menu-up';
                }
            } else {
//                if(tag) {
//                    className = this._getClassName(position);
//                } else {
                    className = 'maptalks-control-menu-down';
//                }
            }
        }
        return className;
    },

    _getClassName : function(position) {
        if (position['left']) {
            return 'maptalks-control-menu-right';
        } else if (position['right']) {
            return 'maptalks-control-menu-left';
        } else {
            return 'maptalks-control-menu-right';
        }
    },

    /**
     * 获取button dom
     */
    getDom: function() {
        return this._dom;
    }
});
