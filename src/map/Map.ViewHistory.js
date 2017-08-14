import { equalMapView } from 'core/util';
import Map from './Map';

Map.include(/** @lends Map.prototype */ {
    _onViewChange(view) {
        if (!this._viewHistory) {
            this._viewHistory = [];
            this._viewHistoryPointer = 0;
        }

        for (let i = this._viewHistory.length - 1; i >= 0; i--) {
            if (equalMapView(view, this._viewHistory[i])) {
                this._viewHistoryPointer = i;
                return;
            }
        }

        if (this._viewHistoryPointer < this._viewHistory.length - 1) {
            // remove old 'next views'
            this._viewHistory.splice(this._viewHistoryPointer + 1);
        }
        this._viewHistory.push(view);
        const count = this.options['viewHistoryCount'];
        if (count > 0 && this._viewHistory.length > count) {
            // remove redundant view
            this._viewHistory.splice(0, this._viewHistory.length - count);
        }
        this._viewHistoryPointer = this._viewHistory.length - 1;
    },

    /**
     * Get previous map view in view history
     * @return {Object} map view
     */
    getPreviousView() {
        if (!this._viewHistory || this._viewHistoryPointer === 0) {
            return null;
        }
        return this._viewHistory[--this._viewHistoryPointer];
    },

    /**
     * Get next view in view history
     * @return {Object} map view
     */
    getNextView() {
        if (!this._viewHistory || this._viewHistoryPointer === this._viewHistory.length - 1) {
            return null;
        }
        return this._viewHistory[++this._viewHistoryPointer];
    },

    /**
     * Get map view history
     * @return {Object[]}
     */
    getViewHistory() {
        return this._viewHistory;
    },

    _getCurrentView() {
        if (!this._viewHistory) {
            return null;
        }
        return this._viewHistory[this._viewHistoryPointer];
    }
});

Map.mergeOptions({
    'viewHistory' : true,
    'viewHistoryCount' : 10
});
