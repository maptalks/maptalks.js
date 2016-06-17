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
    getItems: function() {
        return this.options['items'];
    },

    /**
     * get pixel size of menu
     * @return {Size} size
     */
    getSize: function() {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    _createDOM: function() {
        var dom = Z.DomUtil.createEl('div');
        if(this.options['style']) {
            Z.DomUtil.addClass(dom, this.options['style']);
        }
        var items = this.options['items'];
        if(items&&items.length>0) {
            var maxWidth = 0,maxHeight=0;
            for(var i = 0,len = items.length; i < len; i++) {
                var item = items[i];
                if(!item['hidden']) {
                    item['vertical'] = item['vertical']||this.options['vertical'];
                    var menuDom = this._createMenuDom(item);
                    dom.appendChild(menuDom);
                    maxWidth += (item['width']||0)+4;
                    maxHeight += (item['height']||0)+2;
                }
            }
            if(this.options['vertical']) {
                dom.style.height = maxHeight+'px';
            } else {
                dom.style.width = maxWidth+'px';
            }
        }
        this._toolboxDom = dom;
        return dom;
    },

    _getWidth: function() {
        var defaultWidth = 160;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    //菜单监听地图的事件
    _registerEvents: function() {
        this._map = this.getMap();
        this._map.on('_zoomstart _zoomend _movestart', this.hide, this);
    },

    //菜单监听地图的事件
    _removeEvents: function() {
        this._map.off('_zoomstart _zoomend _movestart', this.hide, this);
        this._removeDomEvents(this._toolboxDom);
    },

    _removeDomEvents: function(dom) {
        var children = dom.childNodes;
        for(var i=0,len=children.length;i<len;i++) {
            var node = children[i];
            if(node && node.childNodes.length>0) {
                this._removeDomEvents(node);
            } else {
                this._removeEventsFromDom(node);
            }
        }

    },

    _removeEventsFromDom: function(dom) {
        Z.DomUtil.off(dom, 'click')
                 .off(dom, 'mouseover')
                 .off(dom, 'mouseout')
                 .off(dom, 'mousedown')
                 .off(dom, 'dblclick')
                 .off(dom, 'contextmenu');
        Z.DomUtil.removeDomNode(dom);
        dom = null;
    },

    _createMenuDom : function(options, tag) {
        var _menuDom = Z.DomUtil.createEl('span');
        if(tag) {
            _menuDom = Z.DomUtil.createEl(tag);
        }
        var width = options['width'] || 16;
        var height = options['height'] || 16;
        var vertical = options['vertical'];
        if(vertical === undefined || vertical == null) {
            vertical = false;
        }
        var block = 'inline-block';
        if(vertical) {
            block = 'block';
        }
        _menuDom.style.cssText = 'text-align:center;display:-moz-inline-box;display:' + block
                               + ';width:' + width + 'px;height:' + height + 'px;';

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
        if(options['mousedown']) {
            Z.DomUtil.on(_menuDom, 'mousedown', options['mousedown'], this);
        }
        if(options['mouseup']) {
            Z.DomUtil.on(_menuDom, 'mouseup', options['mouseup'], this);
        }
        this._addEventToMenuItem(_menuDom, options);
        var me = this;
        var trigger = options['trigger']||'click';
        if(trigger === 'click') {
            Z.DomUtil.on(_menuDom, 'click', function() {
                me._showDropMenu(_menuDom, options);
            }, this);
        } else if (trigger === 'mouseover'){
            Z.DomUtil.on(_menuDom, 'mouseover', function() {
                me._showDropMenu(_menuDom, options);
            }, this);
        }
        return _menuDom;
    },

    _addEventToMenuItem: function(_parentDom, options) {
        if(options['children'] && options['children'].length>0) {
            var me = this;
            var _dropdownMenu = me._createDropMenu(_parentDom, options);
            var trigger = options['trigger'];
            if(trigger === 'click') {
                Z.DomUtil.on(_parentDom, 'click', function() {
                    Z.DomUtil.setStyle(_dropdownMenu, 'display : block');
                }, this);
                Z.DomUtil.on(_dropdownMenu, 'mouseover', function() {
                    Z.DomUtil.setStyle(_dropdownMenu, 'display : block');
                }, this);
            } else if (trigger === 'mouseover') {
                Z.DomUtil.on(_parentDom, 'mouseover', function() {
                    Z.DomUtil.setStyle(_dropdownMenu, 'display : block');
                }, this);
            }
            Z.DomUtil.on(_parentDom, 'mouseout', function() {
                Z.DomUtil.setStyle(_dropdownMenu, 'display : none');
                _dropdownMenu.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
            }, this);
            Z.DomUtil.on(_dropdownMenu, 'mouseout mouseup', function() {
                Z.DomUtil.setStyle(_dropdownMenu, 'display : none');
                _dropdownMenu.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
            }, this);
        }
    },

    _showDropMenu: function(parentDom, options) {
        if(options['children'] && options['children'].length >0) {
            var offset = this._getDropdownMenuOffset(parentDom, options);
            var dom = parentDom.lastChild;
            dom.style.cssText = 'position: absolute; top:'+offset['top']+'px; left:'+offset['left']+'px;';
            this.fire('showmenuend');
        }
    },

    _getDropdownMenuOffset: function(_parentDom, options) {
        var children = options['children'];
        var height = 16, width = 16;
        if(children && children.length > 0) {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                height += child['height']||0;
                width += child['width']||0;
            }
        }
        var doc_h = document.body.clientHeight;
        var doc_w = document.body.clientWidth;
        var parent_h = _parentDom.clientHeight;
        var parent_w = _parentDom.clientWidth;
        var point = Z.DomUtil.getPagePosition(_parentDom);
        var parent_top = point['y'];
        var parent_left = point['x'];
        var vertical = options['vertical'];
        if(vertical === undefined || vertical == null) {
            vertical = false;
        }
        var dropMenu_top = parent_h, dropMenu_left = parent_w;
        if(!vertical) {//垂直
            if(parent_top + parent_h + height > doc_h) {
                dropMenu_top = -height+parent_h/2;
            } else {
                dropMenu_top = parent_h;
            }
            dropMenu_left = _parentDom.offsetLeft;
        } else {
            if(parent_left+parent_w+width>doc_w) {
                dropMenu_left = -(parent_w*3/2+width);
            } else {
                dropMenu_left = parent_w;
            }
            dropMenu_top = _parentDom.offsetTop;
        }
        return {'top': dropMenu_top, 'left': dropMenu_left};
    },

    _createDropMenu: function(_parentDom, options) {
        var vertical = options['vertical'];
        if(vertical === undefined || vertical == null) {
            vertical = false;
        }
        var style = 'position: absolute;';
        var width = options['width'] || 20;
        var height = options['height'] || 20;
        if(vertical) {
            style+= 'left: -10000px;';
        } else {
            style+= 'top: -10000px;';
        }
        return this._createDropMenuDom(_parentDom, options, style);
    },

    _createDropMenuDom: function(_parentDom, options, style) {
        var dom = _parentDom.children[1];
        if(dom) Z.DomUtil.removeDomNode(dom);
        var _dropdownMenu = Z.DomUtil.createElOn('ul', style);
        //构造下拉菜单
        var items = options['children'];
        if(items&&items.length>0) {
            for(var i=0,len=items.length;i<len;i++) {
                var item = items[i];
                if(item['vertical']=== undefined) {
                    item['vertical'] = !(item['vertical']||options['vertical']);
                }
                _dropdownMenu.appendChild(this._createMenuDom(item, 'li'));
            }
        }
        _parentDom.appendChild(_dropdownMenu);
        return _dropdownMenu;
    },

    _createIconDom: function(options) {
        var _spanDom = Z.DomUtil.createEl('span');
        var icon = options['icon'];
        var content = options['item'];
        var title = options['title'];
        var html = options['html'];
        if(icon) {
            var width = options['iconWidth']||options['width'];
            var height = options['iconHeight']||options['height'];
            var _imgDom = Z.DomUtil.createEl('img');
            _imgDom.src = icon;
            _imgDom.border = 0;
            _imgDom.width = width;
            _imgDom.height = height;
            if(title) {
                _imgDom.title = title;
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
    }

});
