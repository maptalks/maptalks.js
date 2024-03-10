type Constructor = new (...args: any[]) => {};
export default function GeometryEvent<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        /** @lends Geometry.prototype */
        /**
         * The event handler for all the events.
         * @param  {Event} event - dom event
         * @private
         */
        _onEvent(event: any, type: any): void;
        _getEventTypeToFire(domEvent: any): any;
    };
} & TBase;
export {};
