/**
 * @classdesc
 * A control for map navigation.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Nav
 */
Z.control.Nav = Z.control.Control.extend(/** @lends maptalks.control.Nav.prototype */{

    options:{
        'position' : 'top-left'
    },

    buildOn: function () {
        return null;
    }

});

Z.Map.mergeOptions({

    'navControl' : false
});

Z.Map.addOnLoadHook(function () {
    if (this.options['navControl']) {
        this.navControl = new Z.control.Nav(this.options['navControl']);
        this.addControl(this.navControl);
    }
});
