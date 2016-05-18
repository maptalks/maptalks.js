/**
 * @namespace
 */
Z.ui={};
/**
 * @classdesc
 * Base class for all the ui component classes.
 *
 * Some instance methods subclasses needs to implement:
 *
 * 1. Optional, UI Dom's pixel offset from UI's coordinate
 * function _getDomOffset : maptalks.Point
 *
 * 2. Method to create UI's Dom element
 * function _createDOM : HTMLElement
 *
 * 3 Optional, To register any event listener, when the UI Component is created and displayed for the first time.
 * function _registerEvents : void
 *
 * 4. Optional, To remove any event listener registered by _regsiterEvents
 * function _removeEvents : void
 *
 * @class
 * @category ui
 * @abstract
 * @mixes maptalks.Eventable
 * @memberOf maptalks.ui
 * @name UIComponent
 */
Z.ui.UIComponent = Z.Class.extend(/** @lends maptalks.ui.UIComponent.prototype */{
    includes: [Z.Eventable],

    /**
     * @property {Object} options
     * @property {Boolean} [options.eventsToStop='mousedown dblclick']  - events to stop propagation from UI's Dom.
     * @property {Number}  [options.dx=0]     - pixel offset on x axis
     * @property {Number}  [options.dy=0]     - pixel offset on y axis
     * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened UI.
     */
    options:{
        'eventsToStop' : 'mousedown dblclick',
        'dx'     : 0,
        'dy'     : 0,
        'autoPan' : false
    },

    /**
     * Adds the UI Component to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} owner - geometry or map to addto.
     * @returns {maptalks.ui.UIComponent} this
     */
    addTo:function(owner) {
        this._owner = owner;
    },

    /**
     * Get the map instance it displayed
     * @return {maptalks.Map} map instance
     * @override
     */
    getMap:function() {
        if (this._owner instanceof Z.Map) {
            return this._owner;
        }
        return this._owner.getMap();
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
        if (!this.__uiDOM) {
            this._registerEvents && this._registerEvents();
        }
        this._coordinate = coordinate;
        if (this._singleton()) {
            this._removePrev();
        }
        var dom = this.__uiDOM = this._createDOM();
        if (!dom) {
            this.fire('showend');
            return this;
        }
        var map = this.getMap(),
            container = this._getUIContainer();
        this._measureSize(dom);

        if (this._singleton()) {
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

    getOwner: function() {
        return this._owner;
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
        return this.__uiDOM;
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
        return this.getMap()._panels['ui'];
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
