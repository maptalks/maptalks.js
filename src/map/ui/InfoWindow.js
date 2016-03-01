/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @class
 * @extends maptalks.UIComponent
 * @param {Object} options - construct options
 */
Z.InfoWindow = Z.UIComponent.extend(/** @lends maptalks.InfoWindow.prototype */{

    /**
     * @cfg {Object} options 信息窗属性
     */
    options: {
        'autoPan'   : true,
        'width'     : 300,
        'minHeight' : 120,
        'custom'    : false,
        'title'     : null,
        'content'   : null,
        'offset'    : null
    },

    /**
     * 初始化信息窗口
     * @constructor
     * @param {Object} options
     * @return {maptalks.InfoWindow}
     */
    initialize:function(options) {
        Z.Util.setOptions(this,options);
    },

    setContent:function(content) {
        this.options['content'] = content;
        if (this.isOpen()) {
            delete this._dom;
            this.show(this._coordinate);
        } else if (this._isOnStage()) {
            delete this._dom;
        }
        return this;
    },

    getContent:function() {
        return this.options['content'];
    },

    setTitle:function(title) {
        this.options['title'] = title;
        if (this.isOpen()) {
            delete this._dom;
            this.show(this._coordinate);
        } else if (this._isOnStage()) {
            delete this._dom;
        }
        return this;
    },

    getTitle:function() {
        return this.options['title'];
    },

    /**
     * get pixel size of info window
     * @return {Size} size
     */
    getSize:function() {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    _prepareDOM:function() {
        this._dom = null;
        if (!this._map.options['enableInfoWindow']) {
            return;
        }
        var container = this._map._panels.tipContainer;
        container.innerHTML = '';
        var dom;
        if (this._isOnStage() && this._domHTML) {
            container.innerHTML = this._domHTML;
            this._dom = container.childNodes[0];
        } else {
            dom = this._dom = this._createDOM();
            Z.DomUtil.on(dom, 'mousedown dblclick', Z.DomUtil.stopPropagation);
            dom.style.position = 'absolute';
            dom.style.left = -99999+'px';
            dom.style.top = -99999+'px';
            container.appendChild(dom);
            this._domHTML = container.innerHTML;
            this._size = new Z.Size(dom.clientWidth+6, dom.clientHeight);
            var minHeight = this.options['minHeight'];
            if (minHeight>0 && this._size['height']<minHeight) {
                dom.style.height = minHeight+'px';
                this._size['height'] = minHeight;
            }
            dom.style.display = "none";
        }
        this._map._infoWindow =  {
            'target' : this
        };
    },

    _createDOM: function(){
        if (this.options['custom']) {
            if (Z.Util.isString(this.options['content'])) {
                var container = Z.DomUtil.createEl('div');
                container.innerHTML = this.options['content'];
                return container;
            } else {
                return this.options['content'];
            }
        } else {
            var dom = Z.DomUtil.createEl('div');
            dom.className = 'maptalks-msgBox';
            dom.style.width = this._getWidth()+'px';
            var content = '<em class="maptalks-ico"></em>';
            if (this.options['title']) {
                content += '<h2>'+this.options['title']+'</h2>';
            }
            content += '<a href="javascript:void(0);" onclick="this.parentNode.style.display=\'none\';return false;" '+
            ' class="maptalks-close"></a><div class="maptalks-msgContent">'+this.options['content']+'</div>';
            dom.innerHTML = content;
            return dom;
        };
    },

    //get anchor of infowindow to place
    _getAnchor: function(_coordinate) {
        var position;
        var coordinate = _coordinate;
        this._coordinate = _coordinate;
        if(!coordinate) {
            coordinate = this._target.getCenter();
        }
        var size = this.getSize();
        var anchor = this._map.coordinateToViewPoint(new Z.Coordinate(coordinate));
        anchor = anchor.add(new Z.Point(-size['width']/2, -size['height']));
        var offset = this.options['offset']?new Z.Point(this.options['offset']):null;
        if (offset) {
            anchor = anchor.add(offset);
        }
        if (!_coordinate && (this._target instanceof Z.Marker)) {
            var markerSize = this._target.getSize();
            anchor = anchor.add(new Z.Point(0, -markerSize['height']-20));
        }
        return anchor;
    },

    _isOnStage:function() {
        return (this._map._infoWindow && this._map._infoWindow['target'] == this);
    },

    _getDOM:function() {
        if (!this._isOnStage()) {
            return null;
        }
        return this._dom;
    },

    _getWidth:function() {
        var defaultWidth = 300;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    _registerEvents:function() {
        this._map.on('_zoomstart', this._onZoomStart, this);
        this._map.on('_zoomend', this._onZoomEnd, this);
    },

    _removeEvents:function() {
        this._map.off('_zoomstart', this._onZoomStart, this);
        this._map.off('_zoomend', this._onZoomEnd, this);
    },

    _onZoomStart:function() {
        if (this.isOpen()) {
            this._getDOM().style.left = -99999+'px';
            this._getDOM().style.top = -99999+'px';
        }
    },

    _onZoomEnd:function() {
        if (this.isOpen()) {
            var anchor = this._getAnchor(this._coordinate);
            this._getDOM().style.left = anchor.x+'px';
            this._getDOM().style.top = anchor.y+'px';
        }
    }
});
