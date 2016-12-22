import Map from 'map/Map';
import Control from './Control';

/**
 * @classdesc
 * A control for map navigation.
 * @class
 * @category control
 * @extends Control
 * @memberOf control
 * @name Nav
 */
export const Nav = Control.extend(/** @lends Nav.prototype */ {
    /**
     * @property {Object} options - options
     * @property {Object} [options.position='top-left'}] - position of the control
     */
    options: {
        'position': 'top-left'
    },

    buildOn: function () {
        return null;
    }

});

Map.mergeOptions({
    'navControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['navControl']) {
        this.navControl = new Nav(this.options['navControl']);
        this.addControl(this.navControl);
    }
});
