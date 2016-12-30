import Map from 'map';
import Control from './Control';


/**
 * @property {Object} options - options
 * @property {Object} [options.position='top-left'}] - position of the control
 */
const options = {
    'position': 'top-left'
};

/**
 * @classdesc
 * A control for map navigation.
 * @class
 * @category control
 * @extends Control
 * @memberOf control
 * @name Nav
 */
export default class Nav extends Control {

    buildOn() {
        return null;
    }

}

Nav.mergeOptions(options);

Map.mergeOptions({
    'navControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['navControl']) {
        this.navControl = new Nav(this.options['navControl']);
        this.addControl(this.navControl);
    }
});
