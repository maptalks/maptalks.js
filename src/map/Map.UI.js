
import { isFunction } from '../core/util';
import UIMarker from '../ui/UIMarker';
import Map from './Map';

const uiMarkerFilter = (ui) => {
    return ui instanceof UIMarker;
};

Map.include(/** @lends Map.prototype */{
    /**
       * Get all UIs
       * @param {Function} [filter=undefined] - a filter function of ui, return false to exclude the given ui.
       * @returns {UIComponent[]}
       */
    getUIs(filter) {
        const filterEnable = isFunction(filter);
        return (this.uiList || []).filter(ui => {
            if (!filterEnable) {
                return true;
            }
            return filter(ui);
        });
    },
    /**
       * clear all UIMarkers
       * @returns {Map} this
       */
    clearUIMarkers() {
        const uiMarkers = this.getUIMarkers();
        uiMarkers.forEach(uiMarker => {
            uiMarker.remove();
        });
        return this;
    },
    /**
      * Get all UIMarkers
      * @returns {UIMarker[]}
      */
    getUIMarkers() {
        return this.getUIs(uiMarkerFilter);
    }
});
