/**
 * 操作类
 * @class maptalks.Handler
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.Handler = Z.Class.extend({
	includes: Z.Eventable,

    /**
     * @constructor
     * @param {maptalks.Map} map
     */
	initialize: function (map) {
        this.target = map;
    },

    enable: function () {
        if (this._enabled) { return; }

        this._enabled = true;
        this.addHooks();
    },

    disable: function () {
        if (!this._enabled) { return; }

        this._enabled = false;
        this.removeHooks();
    },

    enabled: function () {
        return !!this._enabled;
    }
});
