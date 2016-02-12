//package
Z.control = {};

/**
 * 组件类
 * @class maptalks.Control
 * @extends maptalks.Class
 * @author Maptalks Team
 */
Z.Control = Z.Class.extend({
    includes: [Z.Eventable],

    statics: {
        /**
         * @static
         * @cfg {Object} top_left 左上角
         */
        'top_left' : {'top': '20','left': '20'},
        /**
         * @static
         * @cfg {Object} top_right 右上角
         */
        'top_right' : {'top': '40','right': '60'},
        /**
         * @static
         * @cfg {Object} bottom_left 左下角
         */
        'bottom_left' : {'bottom': '20','left': '60'},
        /**
         * @static
         * @cfg {Object} bottom_right 右下角
         */
        'bottom_right' : {'bottom': '20','right': '60'}
    },

    /**
     * @cfg {Object} options 组件配置
     */
    options:{

    },

    /**
     * @constructor
     * @param {Object} options
     * @returns {maptalks.Control}
     */
    initialize: function (options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * 将组件添加到指定的map上
     * @param {maptalks.Map} map对象
     * @returns {maptalks.Control}
     * @expose
     */
    addTo: function (map) {
        this.remove();
        this._map = map;
        var controlContainer = map._panels.controlWrapper;
        this._container = Z.DomUtil.createEl('div');
        Z.DomUtil.setStyle(this._container, 'position:absolute');
        Z.DomUtil.addStyle(this._container, 'z-index', 3);
        Z.DomUtil.on(this._container, 'mousedown mousemove click dblclick contextmenu', Z.DomUtil.stopPropagation)
        var controlDom = this.buildOn(map);
        if(controlDom) {
            this._updatePosition();
            this._container.appendChild(controlDom);
            controlContainer.appendChild(this._container);
        }
        return this;
    },

    getMap:function() {
        return this._map;
    },

    _updatePosition: function(){
        var position = this.options['position'];
        for (var p in position) {
            if (position.hasOwnProperty(p)) {
                position[p] = parseInt(position[p]);
                this._container.style[p] = position[p]+'px';
            }
        }
        this.fire('positionupdate', {
            'target' : this,
            //copy the position
            'position' : Z.Util.extend({},this.options['position'])
        });
    },

    /**
     * 获取组件显示的位置
     * @return {Object} {'top': '40','left': '60'}
     * @expose
     */
    getPosition: function () {
        return Z.Util.extend({},this.options['position']);
    },

    /**
     * 设置组件显示位置
     * @param {Object} {'top': '40','left': '60'}
     * @expose
     */
    setPosition: function (position) {
        this.options['position'] = Z.Util.extend({},position);
        this._updatePosition();
        return this;
    },

    getContainerPoint:function() {
        var position = this.options['position'];

        var size = this._map.getSize();
        var x,y;
        if (!Z.Util.isNil(position['top'])) {
            x = position['top'];
        } else if (!Z.Util.isNil(position['bottom'])) {
            x = size['height'] - position['bottom'];
        }
        if (!Z.Util.isNil(position['left'])) {
            y = position['left'];
        } else if (!Z.Util.isNil(position['right'])) {
            y = size['width'] - position['right'];
        }
        return new Z.Point(x,y);
    },

    /**
     * 获取组件容器
     * @return container dom
     * @expose
     */
    getContainer: function () {
        return this._container;
    },

    /**
     *显示label属性面板
     */
    show: function() {
        this._container.style.display="";
        return this;
    },

    /**
     *隐藏label属性面板
     */
    hide: function() {
        this._container.style.display="none";
        return this;
    },

    /**
     * 删除组件
     * @expose
     */
    remove: function () {
        if (!this._map) {
            return this;
        }
        Z.DomUtil.removeDomNode(this._container);
        if (this._onRemove) {
            this._onRemove(this._map);
        }
        delete this._map;
        delete this._container;
        return this;
    }

});


Z.Map.include({
    /**
     * 添加control
     * @member maptalks.Map
     * @param {maptalks.Control} control
     * @expose
     */
    addControl: function (control) {
        if (!!this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * 删除control
     * @member maptalks.Map
     * @param {maptalks.Control} control
     * @expose
     */
    removeControl: function (control) {
        control.remove();
        return this;
    }

});
