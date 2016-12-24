import { extend, isNil, isString, setOptions } from 'core/util';
import { createEl, addStyle, setStyle, removeDomNode } from 'core/util/dom';
import Eventable from 'core/Event';
import Class from 'core/class/index';
import Point from 'geo/Point';
import Map from 'map';

/**
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * It is abstract and not intended to be instantiated.
 * @class
 * @category control
 * @abstract
 * @extends Class
 * @memberOf control
 * @name  Control
 *
 * @mixes Eventable
 */
export const Control = Class.extend(/** @lends control.Control.prototype */ {
    includes: [Eventable],

    statics: {
        'positions': {
            'top-left': {
                'top': '20',
                'left': '20'
            },
            'top-right': {
                'top': '40',
                'right': '60'
            },
            'bottom-left': {
                'bottom': '20',
                'left': '60'
            },
            'bottom-right': {
                'bottom': '20',
                'right': '60'
            }
        }
    },

    initialize: function (options) {
        if (options && options['position'] && !isString(options['position'])) {
            options['position'] = extend({}, options['position']);
        }
        setOptions(this, options);
    },

    /**
     * Adds the control to a map.
     * @param {Map} map
     * @returns {control.Control} this
     * @fires control.Control#add
     */
    addTo: function (map) {
        this.remove();
        this._map = map;
        var controlContainer = map._panels.control;
        this.__ctrlContainer = createEl('div');
        setStyle(this.__ctrlContainer, 'position:absolute');
        addStyle(this.__ctrlContainer, 'z-index', controlContainer.style.zIndex);
        // on(this.__ctrlContainer, 'mousedown mousemove click dblclick contextmenu', stopPropagation)
        this.update();
        controlContainer.appendChild(this.__ctrlContainer);
        /**
         * add event.
         *
         * @event control.Control#add
         * @type {Object}
         * @property {String} type - add
         * @property {control.Control} target - the control instance
         */
        this.fire('add', {
            'dom': controlContainer
        });
        return this;
    },

    /**
     * update control container
     * @return {control.Control} this
     */
    update: function () {
        this.__ctrlContainer.innerHTML = '';
        this._controlDom = this.buildOn(this.getMap());
        if (this._controlDom) {
            this._updatePosition();
            this.__ctrlContainer.appendChild(this._controlDom);
        }
        return this;
    },

    /**
     * Get the map that the control is added to.
     * @return {Map}
     */
    getMap: function () {
        return this._map;
    },

    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition: function () {
        return extend({}, this._parse(this.options['position']));
    },

    /**
     * update the control's position
     * @param {String|Object} position - can be one of 'top-left', 'top-right', 'bottom-left', 'bottom-right' or a position object like {'top': 40,'left': 60}
     * @return {control.Control} this
     * @fires control.Control#positionchange
     */
    setPosition: function (position) {
        if (isString(position)) {
            this.options['position'] = position;
        } else {
            this.options['position'] = extend({}, position);
        }
        this._updatePosition();
        return this;
    },

    /**
     * Get the container point of the control.
     * @return {Point}
     */
    getContainerPoint: function () {
        var position = this.getPosition();

        var size = this.getMap().getSize();
        var x, y;
        if (!isNil(position['top'])) {
            x = position['top'];
        } else if (!isNil(position['bottom'])) {
            x = size['height'] - position['bottom'];
        }
        if (!isNil(position['left'])) {
            y = position['left'];
        } else if (!isNil(position['right'])) {
            y = size['width'] - position['right'];
        }
        return new Point(x, y);
    },

    /**
     * Get the control's container.
     * Container is a div element wrapping the control's dom and decides the control's position and display.
     * @return {HTMLElement}
     */
    getContainer: function () {
        return this.__ctrlContainer;
    },

    /**
     * Get html dom element of the control
     * @return {HTMLElement}
     */
    getDOM: function () {
        return this._controlDom;
    },

    /**
     * Show
     * @return {control.Control} this
     */
    show: function () {
        this.__ctrlContainer.style.display = '';
        return this;
    },

    /**
     * Hide
     * @return {control.Control} this
     */
    hide: function () {
        this.__ctrlContainer.style.display = 'none';
        return this;
    },

    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible: function () {
        return (this.__ctrlContainer && this.__ctrlContainer.style.display === '');
    },

    /**
     * Remove itself from the map
     * @return {control.Control} this
     * @fires control.Control#remove
     */
    remove: function () {
        if (!this._map) {
            return this;
        }
        removeDomNode(this.__ctrlContainer);
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._map;
        delete this.__ctrlContainer;
        delete this._controlDom;
        /**
         * remove event.
         *
         * @event control.Control#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {control.Control} target - the control instance
         */
        this.fire('remove');
        return this;
    },

    _parse: function (position) {
        var p = position;
        if (isString(position)) {
            p = Control['positions'][p];
        }
        return p;
    },

    _updatePosition: function () {
        var position = this.getPosition();
        if (!position) {
            //default one
            position = {
                'top': 20,
                'left': 20
            };
        }
        for (var p in position) {
            if (position.hasOwnProperty(p)) {
                position[p] = parseInt(position[p]);
                this.__ctrlContainer.style[p] = position[p] + 'px';
            }
        }
        /**
         * Control's position update event.
         *
         * @event control.Control#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {control.Control} target - the control instance
         * @property {Object} position - Position of the control, eg:{"top" : 100, "left" : 50}
         */
        this.fire('positionchange', {
            'position': extend({}, position)
        });
    }

});

Map.mergeOptions({
    'control': true
});

Map.include(/** @lends Map.prototype */ {
    /**
     * Add a control on the map.
     * @param {control.Control} control - contorl to add
     * @return {Map} this
     */
    addControl: function (control) {
        //map container is a canvas, can't add control on it.
        if (!this.options['control'] || this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * Remove a control from the map.
     * @param {control.Control} control - control to remove
     * @return {Map} this
     */
    removeControl: function (control) {
        if (!control || control.getMap() !== this) {
            return this;
        }
        control.remove();
        return this;
    }

});
