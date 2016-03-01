/**
 * @classdesc
 * Represents a toolbox ui component for geometries.
 * @class
 * @extends Z.ui.UIComponent
 */
Z.ui.Toolbox = Z.ui.UIComponent.extend(/** @lends maptalks.ui.Toolbox.prototype */{

    /**
     * @cfg {Object} options 工具栏属性
     */
    options:{
        'position' : {
            'bottom': '0',
            'right': '0'
        },
        'classname': '',
        'vertical' : false,
        'items': []
    },

    buildOn: function (map) {
        this._map = map;
        this._toolbarContainer = Z.DomUtil.createEl('div');
        if(this.options['className']) {
            Z.DomUtil.addClass(this._toolbarContainer, this.options['className']);
        } else {
            if(this.options['vertical']) {
                Z.DomUtil.addClass(this._toolbarContainer, 'maptalks-control-toolbar-vertical');
            } else {
                Z.DomUtil.addClass(this._toolbarContainer, 'maptalks-control-toolbar');
            }
        }
        var items = this.options['items'];
        if(items&&items.length>0) {
            for(var i=0,len=items.length;i<len;i++) {
                var item = items[i];
                if(!item['hidden']) {
                    item['vertical'] = Z.Util.getValueOrDefault(item['vertical'],this.options['vertical']);
                    item['position'] = this.options['position'];
                    var buttonDom = new Z.Button(item).getDom();
                    this._toolbarContainer.appendChild(buttonDom);
                }
            }
        }
        return this._toolbarContainer;
    }
});
