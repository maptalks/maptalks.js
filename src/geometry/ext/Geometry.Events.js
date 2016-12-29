import { preventDefault, stopPropagation, getEventContainerPoint } from 'core/util/dom';
import { Geometry } from 'geometry/Geometry';

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * The event handler for all the events.
     * @param  {Event} event - dom event
     * @private
     */
    _onEvent: function (event) {
        if (!this.getMap()) {
            return;
        }
        var eventType = this._getEventTypeToFire(event);
        if (eventType === 'contextmenu' && this.listens('contextmenu')) {
            stopPropagation(event);
            preventDefault(event);
        }
        var params = this._getEventParams(event);
        this._fireEvent(eventType, params);
    },

    _getEventTypeToFire: function (originalEvent) {
        var eventType = originalEvent.type;
        //change event type to contextmenu
        if (eventType === 'click' || eventType === 'mousedown') {
            if (originalEvent.button === 2) {
                eventType = 'contextmenu';
            }
        }
        return eventType;
    },

    /**
     * Generate event parameters
     * @param  {Event} event - dom event
     * @return {Object}
     * @private
     */
    _getEventParams: function (e) {
        var map = this.getMap();
        var eventParam = {
            'domEvent': e
        };
        var actual = e.touches ? e.touches[0] : e;
        if (actual) {
            var containerPoint = getEventContainerPoint(actual, map._containerDOM);
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
            eventParam['pont2d'] = map._containerPointToPoint(containerPoint);
        }
        return eventParam;
    },

    /**
     * mouse over event handler
     * @param  {Event} event - mouseover dom event
     * @private
     */
    _onMouseOver: function (event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent);
        /**
         * mouseover event for geometry
         * @event Geometry#mouseover
         * @type {Object}
         * @property {String} type                    - mouseover
         * @property {Geometry} target       - the geometry fires mouseover
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mouseover', params);
    },

    /**
     * mouse out event handler
     * @param  {Event} event - mouseout dom event
     * @private
     */
    _onMouseOut: function (event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent);
        /**
         * mouseout event for geometry
         * @event Geometry#mouseout
         * @type {Object}
         * @property {String} type                    - mouseout
         * @property {Geometry} target       - the geometry fires mouseout
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('mouseout', params);
    }
});
