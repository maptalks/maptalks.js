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

    statics : {
        'single' : true
    },

    /**
     * @property {String} [options.eventsToStop='mousedown dblclick click'] - The events which will be stop propagation.
     * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened menu.
     * @property {String}  [options.style='maptalks-toolbox']      - default style
     * @property {Boolean} [options.vertical=false]  - set it to true if you want the toolbox is show vertical.
     * @property {Object[]}  options.items   - toolbox items array, containing: item objects, "-" as a splitor line
     */
    options:{
        'eventsToStop' : 'mousedown dblclick click',
        'autoPan': false,
        'style': 'maptalks-toolbox',
        'vertical' : false,
        'items': []
    },

    initialize: function(options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * set items
     * @param {Array} items
     * @return {maptalks.ui.Toolbox}
     * @expose
     */
    setItems: function(items) {
        this.options['items'] = items;
        return this;
    },

    /**
     * get item from Toolbox
     * @return {Array} items
     */
    getItems:function() {
        return this.options['items'];
    },

    /**
     * get pixel size of menu
     * @return {Size} size
     */
    getSize:function() {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    _createDOM:function() {
        var dom = Z.DomUtil.createEl('div');
        if(this.options['style']) {
            Z.DomUtil.addClass(dom, this.options['style']);
        }
        var items = this.options['items'];
        if(items&&items.length>0) {
            var maxWidth=0,maxHeight=0;
            for(var i=0,len=items.length;i<len;i++) {
                var item = items[i];
                if(!item['hidden']) {
                    item['vertical'] = Z.Util.getValueOrDefault(item['vertical'], this.options['vertical']);
                    var buttonDom = new Z.ui.Toolbox.Button(item).getDom();
                    dom.appendChild(buttonDom);
                    maxWidth+=Z.Util.getValueOrDefault(item['width'],0)+2;
                    maxHeight+=Z.Util.getValueOrDefault(item['height'],0)+2;
                }
            }
            if(this.options['vertical']) {
                dom.style.height = maxHeight+'px';
            } else {
                dom.style.width = maxWidth+'px';
            }
        }
        return dom;
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

    _getWidth:function() {
        var defaultWidth = 160;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    //菜单监听地图的事件
    _registerEvents: function() {
        this.getMap().on('_zoomstart _zoomend _movestart', this.hide, this);

    },

    //菜单监听地图的事件
    _removeEvents: function() {
        this.getMap().off('_zoomstart _zoomend _movestart', this.hide, this);
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
        Z.DomUtil.on(_menuDom, 'click dblclick contextmenu', Z.DomUtil.stopPropagation);
        Z.DomUtil.addClass(_menuDom, 'maptalks-toolbox-button');
        _menuDom.appendChild(this._createIconDom(options));
        if(options['click']) {
            Z.DomUtil.on(_menuDom, 'click', options['click'], this);
        }
        if(options['mouseover']) {
            Z.DomUtil.on(_menuDom, 'mouseover', options['mouseover'], this);
        }
        if(options['mouseout']) {
            Z.DomUtil.on(_menuDom, 'mouseout', options['mouseout'], this);
        }
        var trigger = options['trigger']||'click';
        var me = this;
        if(trigger === 'click') {
            Z.DomUtil.on(_menuDom, 'click', function() {
                me._addEventToMenuItem(_menuDom, options);
            }, this);
        } else {
            Z.DomUtil.on(_menuDom, 'mouseover', function() {
                me._addEventToMenuItem(_menuDom, options);
            }, this);
        }
        return _menuDom;
    },

    _addEventToMenuItem: function(_parentDom, options) {
        if(options['children'] && options['children'].length>0) {
            var me = this;
            var dropdownMenu = me._createDropMenu(_parentDom, options);
            var trigger = options['trigger'];
            if(trigger === 'click') {
                Z.DomUtil.on(_parentDom, 'click', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display:block');
                }, this);
                Z.DomUtil.on(_parentDom, 'mouseover', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display:block');
                }, this);
            } else {
                Z.DomUtil.on(_parentDom, 'mouseover', function() {
                    Z.DomUtil.setStyle(dropdownMenu, 'display:block');
                }, this);
            }
            Z.DomUtil.on(_parentDom, 'mouseout', function() {
                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
            }, this);

            Z.DomUtil.on(dropdownMenu, 'mouseout', function() {
                Z.DomUtil.setStyle(dropdownMenu, 'display: none');
            }, this);
        }
    },

    _createDropMenu: function(_parentDom, options) {
        var vertical = Z.Util.getValueOrDefault(options['vertical'], false);
        var style = 'position: absolute;';
        var offset = this._getDropdownMenuOffset(_parentDom, options);
        if(vertical) {
            style+= 'left:'+offset['left']+'px';
        } else {
            style+= 'top:'+offset['top']+'px';
        }
        var appendSign = ((offset['left']>=0)&&(offset['top']>=0));
        var dropdownMenu = this._createDropMenuDom(_parentDom, options, style, appendSign);
        return dropdownMenu;
    },

    _getDropdownMenuOffset: function(_parentDom, options) {
        var length = options['children'].length;
        var height = Z.Util.getValueOrDefault(options['height'],20);
        var width = Z.Util.getValueOrDefault(options['width'],20);
        var doc_h = document.body.clientHeight;
        var doc_w = document.body.clientWidth;
        var parent_h = _parentDom.clientHeight;
        var parent_w = _parentDom.clientWidth;
        var point = Z.DomUtil.getPagePosition(_parentDom);
        var parent_top = point['y'];
        var parent_left = point['x'];
        var vertical = Z.Util.getValueOrDefault(options['vertical'], false);
        var dropMenu_top = parent_h, dropMenu_left = parent_w;
        if(!vertical) {//垂直
            height = height*length;
            if(parent_top+parent_h+height>doc_h) {
                dropMenu_top = -(parent_h*3/2+height);
            } else {
                dropMenu_top = parent_h;
            }
        } else {
            width = width*length;
            if(parent_left+parent_w+width>doc_w) {
                dropMenu_left = -(parent_w*3/2+width);
            } else {
                dropMenu_left = parent_w;
            }
        }
        return {'top': dropMenu_top, 'left': dropMenu_left};
    },

    _createDropMenuDom: function(_parentDom, options, style, appendSign) {
        var dom = _parentDom.children[1];
        if(dom) Z.DomUtil.removeDomNode(dom);
        var dropdownMenu = Z.DomUtil.createElOn('ul', style);
        //构造下拉菜单
        var items = options['children'];
        if(items&&items.length>0) {
            for(var i=0,len=items.length;i<len;i++) {
                var item = items[i];
                if(item['vertical']=== undefined) {
                    item['vertical'] = !Z.Util.getValueOrDefault(item['vertical'],options['vertical']);
                }
                if(appendSign) {
                    dropdownMenu.appendChild(this._createMenuDom(item, 'li'));
                } else {
                    dropdownMenu.insertBefore(this._createMenuDom(item, 'li'), dropdownMenu.firstChild);
                }
            }
        }
        _parentDom.appendChild(dropdownMenu);
        return dropdownMenu;
    },

    _createIconDom : function(options) {
        var _spanDom = Z.DomUtil.createEl('span');
        var icon = options['icon'];
        var content = options['item'];
        var title = options['title'];
        var html = options['html'];
        if(icon) {
            var width = Z.Util.getValueOrDefault(options['iconWidth'],options['width']);
            var height = Z.Util.getValueOrDefault(options['iconHeight'],options['height']);
            var _imgDom = Z.DomUtil.createEl('img');
            _imgDom.src=icon;
            _imgDom.border=0;
            _imgDom.width=width;
            _imgDom.height=height;
            if(title) {
                _imgDom.title=title;
            }
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
            if(content) {
                if(typeof content === 'string') {
                    _spanDom.innerText = content;
                } else {
                    _spanDom.appendChild(content);
                }
            }
            if(html) {
                _spanDom.appendChild(content);
            }
           return _spanDom;
        }
    },

    /**
     * 获取button dom
     */
    getDom: function() {
        return this._dom;
    }
});
