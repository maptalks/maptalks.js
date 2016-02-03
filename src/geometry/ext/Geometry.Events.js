Z.Geometry.include({
    /**
     * 生成事件参数
     * @param  {Event} event 事件对象
     */
    _onEvent: function(event) {
        //还没加载到地图上时, 不处理事件
        if (!this.getMap()) {
            return;
        }
        var eventType = this._getEventTypeToFire(event);
        if ('contextmenu' === eventType && this.hasListeners('contextmenu')) {
            Z.DomUtil.stopPropagation(event);
            Z.DomUtil.preventDefault(event);
        }
        var params = this._getEventParams(event, eventType);
        this._fireEvent(eventType, params);
    },

    _getEventTypeToFire:function(originalEvent) {
        var eventType = originalEvent.type;
        //事件改名
        if ('click' === eventType || 'mousedown' === eventType) {
            var button = originalEvent.button;
            if (button === 2) {
                eventType = 'contextmenu';
            }
        }
        return eventType;
    },

    /**
     * 生成事件参数
     * @param  {Event} event 事件对象
     * @return {Object} 事件返回参数
     */
    _getEventParams: function(e,type) {
        var map = this.getMap();
        var eventParam = {
            'domEvent':e
        };
        var actual = e.touches ? e.touches[0] : e;
        if (actual) {
            var containerPoint = Z.DomUtil.getEventContainerPoint(actual, map._containerDOM);
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
        }

        //统一的参数, target是geometry引用, pixel是事件的屏幕坐标, coordinate是事件的经纬度坐标
        return eventParam;
    },

    _onMouseOver: function(event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent,event.type);
        /**
         * 触发geometry的mouseover事件
         * @member maptalks.Geometry
         * @event mouseover
         * @return {Object} params: {'target':this, 'pixel':pixel, 'coordinate':coordinate}
         */
        this._fireEvent(event.type, params);
    },

    _onMouseOut: function(event) {
        if (!this.getMap()) {
            return;
        }
        var originalEvent = event;
        var params = this._getEventParams(originalEvent,event.type);
        /**
         * 触发geometry的mouseout事件
         * @member maptalks.Geometry
         * @event mouseout
         * @return {Object} params: {'target':this, 'pixel':pixel, 'coordinate':coordinate}
         */
        this._fireEvent(event.type, params);
    }
});
