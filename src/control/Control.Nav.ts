import Map from '../map/Map';
import Control, { ControlOptionsType, DomPositionType } from './Control';

const options: NavOptionsType = {
    'position': 'top-left'
};

export default class Nav extends Control<NavOptionsTypeSpec> {
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

export type NavOptionsTypeSpec = {
    position: string | DomPositionType;
};

export type NavOptionsType = NavOptionsTypeSpec & ControlOptionsType;
