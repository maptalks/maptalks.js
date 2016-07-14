/**
 * @classdesc
 * A toolbar control of the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Toolbar
 * @param {Object}   options - construct options
 * @param {String|Object}   [options.position="top-right"]  - position of the toolbar control.
 * @param {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
 * @param {Object[]} options.items                                  - items on the toolbar
 * @example
 * var toolbar = new maptalks.control.Toolbar({
 *     position : 'top-right',
 *     items: [
 *          {
 *            item: 'item1',
 *            click: function () {
 *              alert('item1 clicked');
 *            }
 *          },
 *          {
 *            item: 'item2',
 *            click: function () {
 *              alert('item2 clicked');
 *            }
 *          }
 *      ]
 * }).addTo(map);
 */
Z.control.Toolbar = Z.control.Control.extend(/** @lends maptalks.control.Toolbar.prototype */{

    /**
     * @property {Object}   options - options
     * @property {String|Object}   [options.position="top-right"]  - position of the toolbar control.
     * @property {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
     * @property {Object[]} options.items                                  - items on the toolbar
     */
    options:{
        'vertical' : false,
        'position' : 'top-right',
        'items'     : {
            //default buttons
        }
    },

    buildOn: function (map) {
        this._map = map;
        var dom = Z.DomUtil.createEl('div');
        var ul = Z.DomUtil.createEl('ul', 'maptalks-toolbar-hx');
        dom.appendChild(ul);

        if (this.options['vertical']) {
            Z.DomUtil.addClass(dom, 'maptalks-toolbar-vertical');
        } else {
            Z.DomUtil.addClass(dom, 'maptalks-toolbar-horizonal');
        }
        var me = this;
        function onButtonClick(fn, index, childIndex, targetDom) {
            var item = me._getItems()[index];
            return function (e) {
                Z.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex, 'dom': targetDom});
            };
        }

        var items = this.options['items'];
        if (Z.Util.isArrayHasData(items)) {
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                var li = Z.DomUtil.createEl('li');
                li.innerHTML = item['item'];
                li.style.cursor = 'pointer';
                if (item['click']) {
                    Z.DomUtil.on(li, 'click', (onButtonClick)(item['click'], i, null, li));
                }
                if (Z.Util.isArrayHasData(item['children'])) {
                    var dropMenu = this._createDropMenu(i);
                    li.appendChild(dropMenu);
                    li._menu = dropMenu;
                    Z.DomUtil.on(li, 'mouseover', function () {
                        this._menu.style.display = '';
                    });
                    Z.DomUtil.on(li, 'mouseout', function () {
                        this._menu.style.display = 'none';
                    });
                }
                ul.appendChild(li);
            }
        }
        return dom;
    },

    _createDropMenu:function (index) {
        var me = this;
        function onButtonClick(fn, index, childIndex) {
            var item = me._getItems()[index]['children'][childIndex];
            return function (e) {
                Z.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex});
            };
        }
        var menuDom = Z.DomUtil.createEl('div', 'maptalks-dropMenu');
        menuDom.style.display = 'none';
        menuDom.appendChild(Z.DomUtil.createEl('em', 'maptalks-ico'));
        var menuUL = Z.DomUtil.createEl('ul');
        menuDom.appendChild(menuUL);
        var children = this._getItems()[index]['children'];
        var liWidth = 0, i, len;
        for (i = 0, len = children.length; i < len; i++) {
            var size = Z.StringUtil.stringLength(children[i]['item'], '12px');
            if (size.width > liWidth) {
                liWidth = size.width;
            }
        }
        for (i = 0, len = children.length; i < len; i++) {
            var child = children[i];
            var li = Z.DomUtil.createEl('li');
            li.innerHTML = '<a href="javascript:;">' + child['item'] + '</a>';
            li.style.cursor = 'pointer';
            li.style.width = liWidth + 'px';// 16 for li padding
            Z.DomUtil.on(li.childNodes[0], 'click', (onButtonClick)(child['click'], index, i));
            menuUL.appendChild(li);
        }
        return menuDom;
    },

    _getItems:function () {
        return this.options['items'];
    }
});
