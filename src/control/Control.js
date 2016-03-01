/**
 * @namespace
 */
Z.control = {};

/**
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * @class
 * @abstract
 * @extends maptalks.Class
 *
 * @mixes maptalks.Eventable
 *
 * @example
 * ```javascript
 * control.addTo(map);
 * //or you can also
 * map.addControl(control);
 * ```
 */
Z.Control = Z.Class.extend(/** @lends maptalks.Control.prototype */{
    includes: [Z.Eventable],

    statics: /** @lends maptalks.Control */{
        /**
         * Predefined position constant: {'top': '20','left': '20'}
         * @constant
         * @type {Object}
         */
        'top_left' : {'top': '20','left': '20'},
        /**
         * Predefined position constant: {'top': '40','right': '60'}
         * @constant
         * @type {Object}
         */
        'top_right' : {'top': '40','right': '60'},
        /**
         * Predefined position constant: {'bottom': '20','left': '60'}
         * @constant
         * @type {Object}
         */
        'bottom_left' : {'bottom': '20','left': '60'},
        /**
         * Predefined position constant: {'bottom': '20','right': '60'}
         * @constant
         * @type {Object}
         */
        'bottom_right' : {'bottom': '20','right': '60'}
    },

    options:{

    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * Adds the control to a map.
     * @param {maptalks.Map} map
     * @returns {maptalks.Control} this
     * @fires maptalks.Control#add
     */
    addTo: function (map) {
        this.remove();
        this._map = map;
        var controlContainer = map._panels.controlWrapper;
        this._container = Z.DomUtil.createEl('div');
        Z.DomUtil.setStyle(this._container, 'position:absolute');
        Z.DomUtil.addStyle(this._container, 'z-index', controlContainer.style.zIndex);
        Z.DomUtil.on(this._container, 'mousedown mousemove click dblclick contextmenu', Z.DomUtil.stopPropagation)
        var controlDom = this.buildOn(map);
        if(controlDom) {
            this._updatePosition();
            this._container.appendChild(controlDom);
            controlContainer.appendChild(this._container);
        }
        /**
         * add event.
         *
         * @event maptalks.Control#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.Control} target - the control instance
         */
        this.fire('add');
        return this;
    },

    /**
     * Get the map that the control is added to.
     * @return {maptalks.Map}
     */
    getMap:function() {
        return this._map;
    },

    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition: function () {
        return Z.Util.extend({},this.options['position']);
    },

    /**
     * update the control's position
     * @param {Object} position - e.g.{'top': '40','left': '60'}
     * @return {maptalks.Control} this
     * @fires maptalks.Control#positionupdate
     */
    setPosition: function (position) {
        this.options['position'] = Z.Util.extend({},position);
        this._updatePosition();
        return this;
    },

    /**
     * Get container point of the control.
     * @return {maptalks.Point}
     */
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
     * Get the container HTML dom element of the control.
     * @return {HTMLElement}
     */
    getContainer: function () {
        return this._container;
    },

    /**
     * Show
     * @return {maptalks.Control} this
     */
    show: function() {
        this._container.style.display="";
        return this;
    },

    /**
     * Hide
     * @return {maptalks.Control} this
     */
    hide: function() {
        this._container.style.display="none";
        return this;
    },

    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible:function() {
        return (this._container && this._container.style.display==="");
    },

    /**
     * Remove itself from the map
     * @return {maptalks.Control} this
     * @fires maptalks.Control#remove
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
        /**
         * remove event.
         *
         * @event maptalks.Control#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.Control} target - the control instance
         */
        this.fire('remove');
        return this;
    },

    _updatePosition: function(){
        var position = this.options['position'];
        for (var p in position) {
            if (position.hasOwnProperty(p)) {
                position[p] = parseInt(position[p]);
                this._container.style[p] = position[p]+'px';
            }
        }
        /**
         * Control's position update event.
         *
         * @event maptalks.Control#positionupdate
         * @type {Object}
         * @property {String} type - positionupdate
         * @property {maptalks.Control} target - the control instance
         * @property {Object} position - Position of the control, eg:{"top" : 100, "left" : 50}
         */
        this.fire('positionupdate', {
            'position' : Z.Util.extend({},this.options['position'])
        });
    },

});


Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Add a control on the map.
     * @param {maptalks.Control} control - contorl to add
     * @return {maptalks.Map} this
     */
    addControl: function (control) {
        //map container is a canvas, can't add control on it.
        if (!!this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * Remove a control from the map.
     * @param {maptalks.Control} control - control to remove
     * @return {maptalks.Map} this
     */
    removeControl: function (control) {
        control.remove();
        return this;
    }

});
