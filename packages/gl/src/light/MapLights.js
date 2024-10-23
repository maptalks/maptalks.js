import { Map } from 'maptalks';
import LightManager from './LightManager.js';


Map.include({
    setLights(config) {
        this.options['lights'] = config;
        this._initLightManager();
        return this;
    },

    getLights() {
        return this.options['lights'];
    },

    _initLightManager() {
        if (!this._lightManager) {
            this._lightManager = new LightManager(this);
        }
        this._lightManager.setConfig(this.getLights());
    },

    getLightManager() {
        if (!this._lightManager) {
            // if (typeof console && !this._warned) {
            //     this._warned = true;
            //     // console.warn('map\'s light config is not set, use map.setLights(config) to set lights.');
            // }
            return null;
        }
        return this._lightManager;
    }
});


Map.addOnLoadHook(function () {
    if (this.options['lights']) {
        this._initLightManager();
    }
});
