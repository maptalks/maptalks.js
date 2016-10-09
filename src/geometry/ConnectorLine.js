/**
 * @classdesc
 * A connector line geometry can connect geometries or ui components with each other. <br>
 *
 * @class
 * @category geometry
 * @extends maptalks.CurveLine
 * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} src     - source to connect
 * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} target  - target to connect
 * @param {Object} [options=null]                   - construct options defined in [maptalks.ConnectorLine]{@link maptalks.ConnectorLine#options}
 * @example
 * var src = new maptalks.Marker([0,0]).addTo(layer),
 *     dst = new maptalks.Marker([1,0]).addTo(layer),
 *     line = new maptalks.ConnectorLine(src, dst, {
 *         curveType : 0, //0, 1, 2, 3
 *         arcDegree : 120,
 *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
 *         arrowStyle : 'classic',
 *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
 *         symbol: {
 *           lineColor: '#34495e',
 *           lineWidth: 2
 *        }
 *     }).addTo(layer);
 */
Z.ConnectorLine = Z.CurveLine.extend(/** @lends maptalks.ConnectorLine.prototype */{

    /**
     * @property {Object} options - ConnectorLine's options
     * @property {Number} [options.curveType=0] - curve type of the connector
     * @property {String} [options.showOn=always]          - when to show the connector line, possible values: 'moving', 'click', 'mouseover', 'always'
     */
    options: {
        curveType : 0,
        showOn : 'always'
    },

    initialize: function (src, target, options) {
        this._connSource = src;
        this._connTarget = target;
        this._registEvents();
        this._initOptions(options);
    },

    /**
     * Gets the source of the connector line.
     * @return {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent}
     */
    getConnectSource:function () {
        return this._connSource;
    },

    /**
     * Sets the source to the connector line.
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} src
     * @return {maptalks.ConnectorLine} this
     */
    setConnectSource:function (src) {
        this.onRemove();
        this._connSource = src;
        this._updateCoordinates();
        this._registEvents();
        return this;
    },

    /**
     * Gets the target of the connector line.
     * @return {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent}
     */
    getConnectTarget:function () {
        return this._connTarget;
    },

    /**
     * Sets the target to the connector line.
     * @param {maptalks.Geometry|maptalks.control.Control|maptalks.UIComponent} target
     * @return {maptalks.ConnectorLine} this
     */
    setConnectTarget:function (target) {
        this.onRemove();
        this._connTarget = target;
        this._updateCoordinates();
        this._registEvents();
        return this;
    },

    _updateCoordinates:function () {
        var map = this.getMap();
        if (!map) {
            map = this._connSource.getMap();
        }
        if (!map) {
            map = this._connTarget.getMap();
        }
        if (!map) {
            return;
        }
        var srcPoints = this._connSource._getConnectPoints();
        var targetPoints = this._connTarget._getConnectPoints();
        var minDist = 0;
        var oldCoordinates = this.getCoordinates();
        var c1, c2;
        for (var i = 0, len = srcPoints.length; i < len; i++) {
            var p1 = srcPoints[i];
            for (var j = 0, length = targetPoints.length; j < length; j++) {
                var p2 = targetPoints[j];
                var dist = map.computeLength(p1, p2);
                if (i === 0 && j === 0) {
                    c1 = p1;
                    c2 = p2;
                    minDist = dist;
                } else if (dist < minDist) {
                    c1 = p1;
                    c2 = p2;
                }
            }
        }
        if (!Z.Util.isArrayHasData(oldCoordinates) || (!oldCoordinates[0].equals(c1) || !oldCoordinates[1].equals(c2))) {
            this.setCoordinates([c1, c2]);
        }
    },

    onRemove: function () {
        Z.Util.removeFromArray(this, this._connSource.__connectors);
        Z.Util.removeFromArray(this, this._connTarget.__connectors);
        this._connSource.off('dragging positionchange', this._updateCoordinates, this)
                        .off('remove', this.onRemove, this);
        this._connTarget.off('dragging positionchange', this._updateCoordinates, this)
                        .off('remove', this.onRemove, this);
        this._connSource.off('dragstart mousedown mouseover', this._showConnect, this);
        this._connSource.off('dragend mouseup mouseout', this.hide, this);
        this._connSource.off('show', this._showConnect, this).off('hide', this.hide, this);
        this._connTarget.off('show', this._showConnect, this).off('hide', this.hide, this);
    },

    _showConnect:function () {
        if (!this._connSource || !this._connTarget) {
            return;
        }
        if ((this._connSource instanceof Z.control.Control || this._connSource.isVisible()) &&
            (this._connTarget instanceof Z.control.Control || this._connTarget.isVisible())) {
            this._updateCoordinates();
            this.show();
        }
    },

    _registEvents: function () {
        if (!this._connSource.__connectors) {
            this._connSource.__connectors = [];
        }
        if (!this._connTarget.__connectors) {
            this._connTarget.__connectors = [];
        }
        this._connSource.__connectors.push(this);
        this._connTarget.__connectors.push(this);
        this._connSource.on('dragging positionchange', this._updateCoordinates, this)
                        .on('remove', this.remove, this);
        this._connTarget.on('dragging positionchange', this._updateCoordinates, this)
                        .on('remove', this.remove, this);
        this._connSource.on('show', this._showConnect, this).on('hide', this.hide, this);
        this._connTarget.on('show', this._showConnect, this).on('hide', this.hide, this);
        var trigger = this.options['showOn'];
        this.hide();
        if (trigger === 'moving') {
            this._connSource.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
            this._connTarget.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
        } else if (trigger === 'click') {
            this._connSource.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
            this._connTarget.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
        } else if (trigger === 'mouseover') {
            this._connSource.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
            this._connTarget.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
        } else {
            this._showConnect();
        }
    }
});


Z.Util.extend(Z.ConnectorLine, {
    _hasConnectors:function (geometry) {
        return (!Z.Util.isNil(geometry.__connectors) && geometry.__connectors.length > 0);
    },

    _getConnectors:function (geometry) {
        return geometry.__connectors;
    }
});
