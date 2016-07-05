/**
 * @classdesc
 * A control for map navigation.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Nav
 */
Z.control.Nav = Z.Control.extend(/** @lends maptalks.control.Nav.prototype */{

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
