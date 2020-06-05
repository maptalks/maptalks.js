import { Map } from 'maptalks';
import LightManager from './LightManager.js';


Map.include({
    setLightConfig(config) {
        this.options['lights'] = config;
        this._initLightManager();
        return this;
    },

    getLightConfig() {
        return this.options['lights'];
    },

    _initLightManager() {
        if (!this._lightManager) {
            this._lightManager = new LightManager(this);
        }
        this._lightManager.setConfig(this.getLightConfig());
    },

    getLightManager() {
        if (!this._lightManager) {
            if (typeof console && !this._warned) {
                this._warned = true;
                console.warn('map\'s light config is not set, use map.setLightConfig(config) to set lights.');
            }
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
