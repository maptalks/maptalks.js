/**
 * @namespace
 */
Z.ui={};
/**
 * @classdesc
 * Base class for all the ui component classes.
 * @class
 * @abstract
 * @mixes maptalks.Eventable
 */
Z.ui.UIComponent = Z.Class.extend(/** @lends maptalks.ui.UIComponent.prototype */{
    includes: [Z.Eventable],
    /**
     * 将UI组件添加到对象上
     * @param {maptalks.Map} map/geometry
     */
    addTo: function(target) {
        if(target instanceof Z.Map) {
            this._map = target;
        } else {
            this._map = target.getMap();
        }
        this._target = target;
        this._registerEvents();
        return this;
    },

    /**
     * remove it
     * @expose
     */
    remove: function() {
        this.hide();
        this._removeEvents();
        delete this._target;
        delete this._map;
        return this;
    },

    getTarget:function() {
        return this._target;
    },

    /**
     * 显示infoWindow
     * @param {maptalks.Coordinate} 坐标
     * @expose
     */
    show: function(coordinate) {
        if (!this._target) {
            return this;
        }
        this.fire('showstart');
        this._prepareDOM();
        var dom = this._getDOM();
        if (!dom) {
            this.fire('showend');
            return this;
        }
        var anchor = this._getAnchor(coordinate);
        // Z.DomUtil.on(dom, 'mousedown mousemove click dblclick contextmenu', Z.DomUtil.stopPropagation);
        dom.style.position='absolute';
        dom.style.left = anchor.x+'px';
        dom.style.top = anchor.y+'px';
        dom.style.display='';

        //autoPan
        if (this.options['autoPan']) {
            var mapSize = this._map.getSize(),
                mapWidth = mapSize['width'],
                mapHeight = mapSize['height'];

            var containerPoint = this._map.viewPointToContainerPoint(anchor);
            var size = this.getSize(),
                clientWidth = dom.clientWidth,
                clientHeight = dom.clientHeight;
            var left=0,top=0;
            if ((containerPoint.x)<0) {
                left=-(containerPoint.x-parseInt(clientWidth)/2);
            } else if ((containerPoint.x+parseInt(clientWidth)-35)>mapWidth) {
                left=(mapWidth-(containerPoint.x+parseInt(clientWidth)*3/2));
            }
            if (containerPoint.y<0) {
                top=-containerPoint.y+50;
            } else if (containerPoint.y>mapHeight){
                top = (mapHeight-containerPoint.y-parseInt(clientHeight))-30;
            }
            if (top!==0 || left!==0) {
                this._map._panAnimation(new Z.Point(left,top),600);
            }
        }
        this.fire('showend');
        return this;
    },

    /**
     * 隐藏UI组件
     * @expose
     */
    hide:function() {
        if (!this._target || !this._getDOM()) {
            return this;
        }
        this._getDOM().style.display = 'none';
        this.fire('hide');
        return this;
    },

    /**
     * decide whether the component is open
     * @returns {Boolean} true|false
     * @expose
     */
    isOpen:function() {
        return this._getDOM() && this._getDOM().style.display !== 'none';
    }
});
