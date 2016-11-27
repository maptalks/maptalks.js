/**
 * @classdesc
 * A toolbar control of the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Toolbar
 * @param {Object} [options=null] - options defined in [maptalks.control.Toolbar]{@link maptalks.control.Toolbar#options}
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
maptalks.control.Toolbar = maptalks.control.Control.extend(/** @lends maptalks.control.Toolbar.prototype */{

    /**
     * @property {Object}   options - options
     * @property {String|Object}   [options.position="top-right"]          - position of the toolbar control.
     * @property {Boolean}  [options.vertical=true]                        - Whether the toolbar is a vertical one.
     * @property {Object[]} options.items                                  - items on the toolbar
     */
    options:{
        'height' : 28,
        'vertical' : false,
        'position' : 'top-right',
        'items'     : {
            //default buttons
        }
    },

    buildOn: function (map) {
        this._map = map;
        var dom = maptalks.DomUtil.createEl('div');
        var ul = maptalks.DomUtil.createEl('ul', 'maptalks-toolbar-hx');
        dom.appendChild(ul);

        if (this.options['vertical']) {
            maptalks.DomUtil.addClass(dom, 'maptalks-toolbar-vertical');
        } else {
            maptalks.DomUtil.addClass(dom, 'maptalks-toolbar-horizonal');
        }
        var me = this;
        function onButtonClick(fn, index, childIndex, targetDom) {
            var item = me._getItems()[index];
            return function (e) {
                maptalks.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex, 'dom': targetDom});
            };
        }

        var items = this.options['items'];
        if (maptalks.Util.isArrayHasData(items)) {
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                var li = maptalks.DomUtil.createEl('li');
                if (this.options['height'] !== 28) {
                    li.style.lineHeight = this.options['height'] + 'px';
                }
                li.style.height = this.options['height'] + 'px';
                li.style.cursor = 'pointer';
                if (maptalks.DomUtil.isHTML(item['item'])) {
                    li.style.textAlign = 'center';
                    var itemSize = maptalks.DomUtil.measureDom('div', item['item']);
                    //vertical-middle
                    li.innerHTML = '<div style="margin-top:' + (this.options['height'] - itemSize['height']) / 2 + 'px;">' + item['item'] + '</div>';
                } else {
                    li.innerHTML = item['item'];
                }
                if (item['click']) {
                    maptalks.DomUtil.on(li, 'click', (onButtonClick)(item['click'], i, null, li));
                }
                if (maptalks.Util.isArrayHasData(item['children'])) {
                    var dropMenu = this._createDropMenu(i);
                    li.appendChild(dropMenu);
                    li._menu = dropMenu;
                    maptalks.DomUtil.on(li, 'mouseover', function () {
                        this._menu.style.display = '';
                    });
                    maptalks.DomUtil.on(li, 'mouseout', function () {
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
                maptalks.DomUtil.stopPropagation(e);
                return fn({'target':item, 'index':index, 'childIndex': childIndex});
            };
        }
        var menuDom = maptalks.DomUtil.createEl('div', 'maptalks-dropMenu');
        menuDom.style.display = 'none';
        menuDom.appendChild(maptalks.DomUtil.createEl('em', 'maptalks-ico'));
        var menuUL = maptalks.DomUtil.createEl('ul');
        menuDom.appendChild(menuUL);
        var children = this._getItems()[index]['children'];
        var liWidth = 0, i, len;
        for (i = 0, len = children.length; i < len; i++) {
            var size = maptalks.StringUtil.stringLength(children[i]['item'], '12px');
            if (size.width > liWidth) {
                liWidth = size.width;
            }
        }
        for (i = 0, len = children.length; i < len; i++) {
            var child = children[i];
            var li = maptalks.DomUtil.createEl('li');
            li.innerHTML = '<a href="javascript:;">' + child['item'] + '</a>';
            li.style.cursor = 'pointer';
            li.style.width = (liWidth + 24) + 'px';// 20 for text-intent
            maptalks.DomUtil.on(li.childNodes[0], 'click', (onButtonClick)(child['click'], index, i));
            menuUL.appendChild(li);
        }
        return menuDom;
    },

    _getItems:function () {
        return this.options['items'];
    }
});
