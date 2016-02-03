/**
 * 连接线
 * @class maptalks.Linker
 * @extends maptalks.Class
 * @author Maptalks Team
 */
Z.ConnectorLine = Z.CurveLine.extend({

    options: {
        curveType : 0,
        showOn : 'always'
    },

    /**
     * @constructor
     * @returns {maptalks.Linker}
     */
    initialize: function (src, target, options) {
        this._connSource = src;
        this._connTarget = target;
        this._registEvents();
        this._initOptions(options);
    },

    getConnectSource:function() {
        return this._connSource;
    },

    setConnectSource:function(src) {
        this._onRemove();
        this._connSource = src;
        this._updateCoordinates();
        this._registEvents();
        return this;
    },

    getConnectTarget:function() {
        return this._connTarget;
    },

    setConnectTarget:function(target) {
        this._onRemove();
        this._connTarget = target;
        this._updateCoordinates();
        this._registEvents();
        return this;
    },

    _updateCoordinates:function() {
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
        var srcPoints = this._connSource.getConnectPoints();
        var targetPoints = this._connTarget.getConnectPoints();
        var minDist = 0;
        var oldCoordinates = this.getCoordinates();
        var c1,c2;
        for(var i=0,len=srcPoints.length;i<len;i++) {
            var p1 = srcPoints[i];
            for(var j=0,length=targetPoints.length;j<length;j++) {
                var p2 = targetPoints[j];
                var dist = map.computeDistance(p1, p2);
                if(i===0&&j===0) {
                    c1 = p1;
                    c2 = p2;
                    minDist = dist;
                } else {
                    if(dist < minDist) {
                        c1 = p1;
                        c2 = p2;
                    }
                }
            }
        }
        if (!Z.Util.isArrayHasData(oldCoordinates) || (!oldCoordinates[0].equals(c1) || !oldCoordinates[1].equals(c2))) {
            this.setCoordinates([c1, c2]);
        }
    },

    _onRemove: function () {
        Z.Util.removeFromArray(this, this._connSource.__connectors);
        Z.Util.removeFromArray(this, this._connTarget.__connectors);
        this._connSource.off('dragging positionchange', this._updateCoordinates, this)
                        .off('remove', this._onRemove, this);
        this._connTarget.off('dragging positionchange', this._updateCoordinates, this)
                        .off('remove', this._onRemove, this);
        this._connSource.off('dragstart mousedown mouseover', this._showConnect, this);
        this._connSource.off('dragend mouseup mouseout', this.hide, this);
        this._connSource.off('show', this._showConnect, this).off('hide', this.hide, this);
        this._connTarget.off('show', this._showConnect, this).off('hide', this.hide, this);
    },

    _showConnect:function() {
        if (!this._connSource || !this._connTarget) {
            return;
        }
        if ((this._connSource instanceof Z.Control || this._connSource.isVisible()) &&
            (this._connTarget instanceof Z.Control || this._connTarget.isVisible())) {
            this._updateCoordinates();
            this.show();
        }
    },

    _registEvents: function() {
        var me = this;
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
        if ('moving' === trigger) {
            this._connSource.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
            this._connTarget.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
        } else if ('click' === trigger) {
            this._connSource.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
            this._connTarget.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
        } else if ('hover' === trigger) {
            this._connSource.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
            this._connTarget.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
        } else {
            this._showConnect();
        }
    },
    _isEditingOrDragging:function() {
        return ((!(this._connSource instanceof Z.Control) && this._connSource._isEditingOrDragging())
            || (!(this._connTarget instanceof Z.Control) && this._connTarget._isEditingOrDragging()));
    },
    _isRenderImmediate:function() {
        return ((!(this._connSource instanceof Z.Control) && this._connSource._isRenderImmediate())
            || (!(this._connTarget instanceof Z.Control) && this._connTarget._isRenderImmediate()));
    }
});


Z.Util.extend(Z.ConnectorLine, {
    _hasConnectors:function(geometry) {
        return (geometry.__connectors != null && geometry.__connectors.length > 0);
    },

    _getConnectors:function(geometry) {
        return geometry.__connectors;
    }
});
