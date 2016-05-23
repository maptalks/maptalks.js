/**
 * @classdesc
 * The parent class for all the map tools
 * @class
 * @abstract
 * @category maptool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @param {options} [options=null] - construct options
 */
Z.MapTool = Z.Class.extend(/** @lends maptalks.MapTool.prototype */{
    includes: [Z.Eventable],

    /**
     * Adds the map tool to a map instance.
     * @param {maptalks.Map} map
     * @return {maptalks.MapTool} this
     */
    addTo: function(map) {
        if (!map) {
            return this;
        }
        this._map = map;
        var key = '_tool' + this.name;
        if (map[key]) {
            map[key].disable();
        }
        var me = this;
        this.enable();
        map[key] = this;
        if (this._onAdd) {
            this._onAdd();
        }
        this._fireEvent('add');
        return this;
    },

    getMap:function() {
        return this._map;
    },

    /**
     * Enable the map tool.
     * @return {maptalks.MapTool} this
     */
    enable:function() {
        var map = this._map;
        if (!map || this._enabled) {return this;}
        this._enabled = true;
        this._switchEvents('off');
        if (this._loadResources) {
            this._loadResources(this._registerEvents);
        } else {
            this._registerEvents();
        }

        if (this._onEnable) {
            this._onEnable();
        }
        this._fireEvent('enable');
        return this;
    },

    /**
     * Disable the map tool
     * @return {maptalks.MapTool} this
     */
    disable:function() {
        if (!this._enabled || !this._map) {
            return this;
        }
        this._enabled = false;
        if (!this._map) {return this;}
        this._switchEvents('off');
        if (this._onDisable) {
            this._onDisable();
        }
        this._fireEvent('disable');
        return this;
    },

    _registerEvents: function() {
        this._switchEvents('on');
    },

    _switchEvents: function(to) {
        var events = this._getEvents();
        if (events) {
            for (var p in events) {
                if (events.hasOwnProperty(p)) {
                    this._map[to](p, events[p], this);
                }
            }
        }
    }
});
