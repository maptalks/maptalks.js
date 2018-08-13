import { preventDefault, stopPropagation, getEventContainerPoint } from '../../core/util/dom';
import Geometry from '../Geometry';

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * The event handler for all the events.
     * @param  {Event} event - dom event
     * @private
     */
    _onEvent: function (event, type) {
        if (!this.getMap()) {
            return;
        }
        const eventType = type || this._getEventTypeToFire(event);
        if (eventType === 'contextmenu' && this.listens('contextmenu')) {
            stopPropagation(event);
            preventDefault(event);
        }
        const params = this._getEventParams(event);
        this._fireEvent(eventType, params);
    },

    _getEventTypeToFire: function (domEvent) {
        // let eventType = domEvent.type;
        // //change event type to contextmenu
        // if (eventType === 'click' || eventType === 'mousedown') {
        //     if (domEvent.button === 2) {
        //         eventType = 'contextmenu';
        //     }
        // }
        return domEvent.type;
    },

    /**
     * Generate event parameters
     * @param  {Event} event - dom event
     * @return {Object}
     * @private
     */
    _getEventParams: function (e) {
        const map = this.getMap();
        const eventParam = {
            'domEvent': e
        };
        const actual = e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches  && e.changedTouches.length > 0 ? e.changedTouches[0] : e;
        if (actual) {
            const containerPoint = getEventContainerPoint(actual, map._containerDOM);
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
            eventParam['pont2d'] = map._containerPointToPoint(containerPoint);
        }
        return eventParam;
    }
});
