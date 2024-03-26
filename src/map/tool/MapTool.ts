import Class from '../../core/Class';
import Eventable from '../../core/Eventable';

import type Map from '../Map';

const key = '_map_tool';

/**
 * @classdesc
 * <pre>
 * The parent class for all the map tools.
 * It is abstract and not intended to be instantiated.
 * Some interface methods to implement:
 * 1. onAdd: optional, a callback method to do some prepares before enabled when the map tool is added to a map
 * 2. onEnable: optional, called when the map tool is enabled, used to setup the context such as adding more event listeners other than the map, disabling map's default handlers (draggable, scrollWheelZoom, etc) and creating temporary layers.
 * 3. getEvents: required, provide an event map to register event listeners on the map.
 * 4. onDisable: optional, called when the map tool is disabled, used to cleanup such as unregistering event listeners, enable map's original handlers and remove temporary layers.
 * </pre>
 * @abstract
 * @category maptool
 * @extends Class
 * @mixes Eventable
 */
class MapTool extends Eventable(Class) {
    _map: Map;
    _enabled?: boolean;
    onEnable?(): void;
    getEvents?(): void;
    onDisable?(): void;
    onAdd?(): void;

    /**
     * Adds the map tool to a map.
     * @param {Map} map
     * @return {MapTool} this
     * @fires MapTool#add
     */
    addTo(map:Map) {
        if (!map) {
            return this;
        }
        this._map = map;
        // map tool is unique on one map
        if (map[key]) {
            map[key].disable();
        }
        if (this.onAdd) {
            this.onAdd();
        }
        this.enable();
        map[key] = this;

        /**
         * add event.
         *
         * @event MapTool#add
         * @type {Object}
         * @property {String} type - add
         * @property {MapTool} target - map tool
         */
        this._fireEvent('add');
        return this;
    }

    /**
     * Gets the map it added to.
     * @return {Map} map
     */
    getMap() {
        return this._map;
    }

    /**
     * Enable the map tool.
     * @return {MapTool} this
     * @fires MapTool#enable
     */
    enable() {
        const map = this._map;
        if (!map || this._enabled) {
            return this;
        }
        this._enabled = true;
        this._switchEvents('off');

        this._registerEvents();
        if (this.onEnable) {
            this.onEnable();
        }
        /**
         * enable event.
         *
         * @event MapTool#enable
         * @type {Object}
         * @property {String} type - enable
         * @property {MapTool} target - map tool
         */
        this._fireEvent('enable');
        return this;
    }

    /**
     * Disable the map tool
     * @return {MapTool} this
     * @fires MapTool#disable
     */
    disable() {
        if (!this._enabled || !this._map) {
            return this;
        }
        this._enabled = false;
        this._switchEvents('off');
        if (this.onDisable) {
            this.onDisable();
        }
        /**
         * disable event.
         *
         * @event MapTool#disable
         * @type {Object}
         * @property {String} type - disable
         * @property {MapTool} target - map tool
         */
        this._fireEvent('disable');
        return this;
    }

    /**
     * Returns whether the tool is enabled
     * @return {Boolean} true | false
     */
    isEnabled() {
        if (!this._enabled) {
            return false;
        }
        return true;
    }

    remove() {
        if (!this._map) {
            return this;
        }
        this.disable();
        if (this._map) {
            delete this._map[key];
            delete this._map;
        }
        /**
         * remove event.
         *
         * @event MapTool#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {MapTool} target - map tool
         */
        this._fireEvent('remove');
        return this;
    }

    _registerEvents() {
        this._switchEvents('on');
    }

    _switchEvents(to: any) {
        const events:any = this.getEvents();
        if (events) {
            this._map[to](events, this);
        }
    }

    _fireEvent(eventName:string, param?: any) {
        if (!param) {
            param = {};
        }
        this.fire(eventName, param);
    }
}

export default MapTool;
