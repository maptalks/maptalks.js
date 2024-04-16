import { isNumber } from '../../core/util';
import { preventDefault, stopPropagation } from '../../core/util/dom';
import Geometry from '../Geometry';


declare module "../Geometry" {

    interface Geometry {
        _onEvent(event: MouseEvent | TouchEvent, type?: string): void;
    }
}


Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * 所有事件的事件处理程序
     * @english
     * The event handler for all the events.
     * @param  {Event} event - dom event
     * @private
     */
    _onEvent(event: MouseEvent | TouchEvent, type: string): void {
        const map = this.getMap();
        if (!map) {
            return;
        }
        const eventType = type || this._getEventTypeToFire(event);
        if (eventType === 'contextmenu' && this.listens('contextmenu')) {
            stopPropagation(event);
            preventDefault(event);
        }
        const params = map._getEventParams(event);
        if (isNumber(this._pickGeometryIndex)) {
            params.pickGeometryIndex = this._pickGeometryIndex;
            // delete this._pickGeometryIndex;
        }
        this._fireEvent(eventType, params);
    },

    /**
     * 获取事件类型
     * @english
     * Get the eventType of domEvent
     * @param {any} domEvent
     * @returns
     */
    _getEventTypeToFire(domEvent: any): string {
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
     * 生成事件参数
     * @english
     * Generate event parameters
     * @param  {Event} event - dom event
     * @return {Object}
     * @private
     */
    // _getEventParams(e: any): Object {
    //     const map = this.getMap();
    //     const eventParam = {
    //         'domEvent': e
    //     };
    //     const actual = e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e;
    //     if (actual) {
    //         const containerPoint = getEventContainerPoint(actual, map.getContainer());
    //         eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
    //         eventParam['containerPoint'] = containerPoint;
    //         eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
    //         eventParam['pont2d'] = map._containerPointToPoint(containerPoint);
    //     }
    //     return eventParam;
    // }
});
