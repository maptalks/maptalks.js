/**
 * @classdesc
 * A control for map navigation.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Nav
 */
maptalks.control.Nav = maptalks.control.Control.extend(/** @lends maptalks.control.Nav.prototype */{
    /**
     * @property {Object} options - options
     * @property {Object} [options.position='top-left'}] - position of the control
     */
    options:{
        'position' : 'top-left'
    },

    buildOn: function () {
        return null;
    }

});

maptalks.Map.mergeOptions({

    'navControl' : false
});

maptalks.Map.addOnLoadHook(function () {
    if (this.options['navControl']) {
        this.navControl = new maptalks.control.Nav(this.options['navControl']);
        this.addControl(this.navControl);
    }
});
