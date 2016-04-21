/**
 * @classdesc
 * A toolbar control of the map.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Toolbar
 * @param {Object}   options - construct options
 * @param {Object}   [options.position=maptalks.Control.top_right]  - position of the toolbar control.
 * @param {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
 * @param {Object[]} options.items                                  - items on the toolbar
 */
Z.control.Toolbar = Z.Control.extend(/** @lends maptalks.control.Toolbar.prototype */{

    /**
     * @property {Object}   options - options
     * @property {Object}   [options.position=maptalks.Control.top_right]  - position of the toolbar control.
     * @property {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
     * @property {Object[]} options.items                                  - items on the toolbar
     */
    options:{
        'vertical' : false,
        'position' : Z.Control['top_right'],
        'menuClass': null,
        'dropMenuClass': null,
        'items'     : {
            //default buttons
        }
    },

    buildOn: function (map) {
        this._map = map;
        var dom = Z.DomUtil.createEl('div');
        var ul = Z.DomUtil.createEl('ul','maptalks-toolbar-hx');
        dom.appendChild(ul);
        var className = this.options['menuClass'];
        if(className) {
            Z.DomUtil.addClass(dom, className);
        } else {
            if(this.options['vertical']) {
                Z.DomUtil.addClass(dom, 'maptalks-toolbar-vertical');
            } else {
                Z.DomUtil.addClass(dom, 'maptalks-toolbar-horizonal');
            }
        }
        var me = this;
        function onButtonClick(fn, index, childIndex, targetDom) {
            var item = me._getItems()[index];
            return function(e) {
                Z.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex, 'dom': targetDom, 'event' : e});
            }
        }

        var items = this.options['items'];
        if(Z.Util.isArrayHasData(items)) {
            for(var i=0,len=items.length;i<len;i++) {
                var item = items[i];
                var li = Z.DomUtil.createEl('li');
                li.innerHTML = item['item'];
                li.style.cursor='pointer';
                if (item['click']) {
                    Z.DomUtil.on(li,'click',(onButtonClick)(item['click'], i, null, li));
                }
                if (Z.Util.isArrayHasData(item['children'])) {
                    var dropMenu = this._createDropMenu(i);
                    li.appendChild(dropMenu);
                    li._menu = dropMenu;
                    Z.DomUtil.on(li,'mouseover',function() {
                        this._menu.style.display = "";
                    });
                    Z.DomUtil.on(li,'mouseout',function() {
                        this._menu.style.display = "none";
                    });
                }
                ul.appendChild(li);
            }
        }
        return dom;
    },

    _createDropMenu:function(index) {
        var me = this;
        function onButtonClick(fn, index, childIndex) {
            var item = me._getItems()[index]['children'][childIndex];
            return function(e) {
                    Z.DomUtil.stopPropagation(e);
                    return fn({'target':item, 'index':index, 'childIndex': childIndex});
                }
        }
        var dropMenuClass = this.options['dropMenuClass'];
        if(!dropMenuClass) {
            dropMenuClass = 'maptalks-dropMenu';
        }
        var menuDom = Z.DomUtil.createEl('div', dropMenuClass);
        menuDom.style.display = "none";
        menuDom.appendChild(Z.DomUtil.createEl('em','maptalks-ico'));
        var menuUL = Z.DomUtil.createEl('ul');
        menuDom.appendChild(menuUL);
        var children = this._getItems()[index]['children'];
        var liWidth = 0;
        for(var i=0,len=children.length;i<len;i++) {
            var size = Z.StringUtil.stringLength(children[i]['item'],'12px');
            if (size.width > liWidth) {
                liWidth = size.width;
            }
        }
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var li = Z.DomUtil.createEl('li');
            li.innerHTML = '<a href="javascript:;">'+child['item']+'</a>'
            li.style.cursor = 'pointer';
            li.style.width = (liWidth+30)+'px';// 30 for li padding
            Z.DomUtil.on(li.childNodes[0],'click',(onButtonClick)(child['click'], index, i));
            menuUL.appendChild(li);
        }
        return menuDom;
    },

    _getItems:function() {
        return this.options['items'];
    }
});
