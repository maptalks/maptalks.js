/**
 * @namespace
 */
Z.ui={};
/**
 * @classdesc
 * Base class for all the ui component classes.
 * @class
 * @category ui
 * @abstract
 * @mixes maptalks.Eventable
 * @memberOf maptalks.ui
 * @name UIComponent
 */
Z.ui.UIComponent = Z.Class.extend(/** @lends maptalks.ui.UIComponent.prototype */{
    includes: [Z.Eventable],

    options:{
        'eventsToStop' : 'mousedown dblclick',
        'dx'     : 0,
        'dy'     : 0,
        'autoPan' : false
    },

    /**
     * Show the UI Component, if it is a global single one, it will close previous one.
     * @param {maptalks.Coordinate} - coordinate to show
     * @return {maptalks.ui.UIComponent} this
     */
    show: function(coordinate) {
        if (!coordinate) {
            throw new Error('UI\'s show coordinate is invalid');
        }
        this.fire('showstart');
        if (!this._dom) {
            this._registerEvents && this._registerEvents();
        }
        this._coordinate = coordinate;
        var dom = this._dom = this._createDOM();
        if (!dom) {
            this.fire('showend');
            return this;
        }
        var map = this.getMap(),
            container = this._getUIContainer();
        this._measureSize(dom);

        if (this._singleton()) {
            this._removePrev();
            map[this._uiDomKey()] = dom;
        }

        var point = this._getPosition();

        dom.style.position = 'absolute';
        dom.style.left = point.x + 'px';
        dom.style.top  = point.y + 'px';
        dom.style.display = '';

        container.appendChild(dom);

        if (this.options['eventsToStop']) {
            Z.DomUtil.on(dom, this.options['eventsToStop'], Z.DomUtil.stopPropagation);
        }

        //autoPan
        if (this.options['autoPan']) {
            this._autoPan();
        }
        this.fire('showend');
        return this;
    },

    /**
     * Hide the UI Component.
     * @return {maptalks.ui.UIComponent} this
     */
    hide:function() {
        if (!this._getDOM()) {
            return this;
        }
        this._getDOM().style.display = 'none';
        this.fire('hide');
        return this;
    },

    /**
     * Decide whether the component is open
     * @returns {Boolean} true|false
     */
    isVisible:function() {
        return this._getDOM() && this._getDOM().style.display !== 'none';
    },

    /**
     * Remove the UI Component
     * @return {maptalks.ui.UIComponent} this
     */
    remove: function() {
        this.hide();
        this._removeEvents && this._removeEvents();
        delete this._target;
        delete this._map;
        this.fire('remove');
        return this;
    },

    /**
     * Get pixel size of the UI Component.
     * @return {maptalks.Size} size
     */
    getSize:function() {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    _getPosition : function() {
        var p = this.getMap().coordinateToViewPoint(this._coordinate)
                    ._add(this.options['dx'], this.options['dy']);
        if (this._getDomOffset) {
            var o = this._getDomOffset();
            o && p._add(o);
        }
        return p;
    },

    _getDOM : function() {
        return this._dom;
    },

    _autoPan : function() {
        var map = this.getMap(),
            dom = this._getDOM();
        var point = new Z.Point(parseInt(dom.style.left), parseInt(dom.style.top));
        var mapSize = map.getSize(),
            mapWidth = mapSize['width'],
            mapHeight = mapSize['height'];

        var containerPoint = map.viewPointToContainerPoint(point);
        var size = this.getSize(),
            clientWidth = parseInt(dom.clientWidth),
            clientHeight = parseInt(dom.clientHeight);
        var left = 0,top = 0;
        if ((containerPoint.x) < 0) {
            left = -(containerPoint.x - clientWidth/2);
        } else if ((containerPoint.x + clientWidth - 35) > mapWidth) {
            left = (mapWidth - (containerPoint.x + clientWidth * 3 / 2));
        }
        if (containerPoint.y < 0) {
            top = -containerPoint.y + 50;
        } else if (containerPoint.y > mapHeight){
            top = (mapHeight - containerPoint.y - clientHeight) - 30;
        }
        if (top !== 0 || left !== 0) {
            map._panAnimation(new Z.Point(left,top),600);
        }
    },

    /**
     * Measure dom's size
     * @param  {HTMLElement} dom - element to measure
     * @return {maptalks.Size} size
     * @private
     */
    _measureSize:function(dom) {
        var container = this._getUIContainer();
        dom.style.position = 'absolute';
        dom.style.left = -99999+'px';
        dom.style.top = -99999+'px';
        container.appendChild(dom);
        this._size = new Z.Size(dom.clientWidth, dom.clientHeight);
        dom.style.display = 'none';
        Z.DomUtil.removeDomNode(dom);
        return this._size;
    },

    /**
     * Remove previous UI DOM if it has.
     *
     * @private
     */
    _removePrev:function() {
        var map = this.getMap(),
            key = this._uiDomKey();
        if (map[key]) {
            Z.DomUtil.removeDomNode(map[key]);
            delete map[key];
        }
    },

    /**
     * generate the cache key to store the singletong UI DOM
     * @private
     * @return {String} cache key
     */
    _uiDomKey:function() {
        return '__ui_'+this._getClassName();
    },

    _singleton:function() {
        var clazzName = this._getClassName();
        if (Z.ui[clazzName] && !Z.ui[clazzName]['single']) {
            return false;
        }
        return true;
    },

    _getUIContainer : function() {
        return this.getMap()._panels.uiContainer;
    },

    _getClassName:function() {
        for (var p in Z.ui) {
            if (Z.ui.hasOwnProperty(p)) {
                if (p === 'UIComponent') {
                    continue;
                }
                if (this instanceof (Z.ui[p])) {
                    return p;
                }
            }
        }
        return null;
    }
});
