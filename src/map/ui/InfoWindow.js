/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - construct options
 * @memberOf maptalks.ui
 * @name InfoWindow
 */
Z.ui.InfoWindow = Z.ui.UIComponent.extend(/** @lends maptalks.ui.InfoWindow.prototype */{

    statics : {
        'single' : true
    },

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

    initialize:function(options) {
        Z.Util.setOptions(this,options);
    },

    addTo:function(target) {
        this._target = target;
    },

    getMap:function() {
        if (this._target instanceof Z.Map) {
            return this._target;
        }
        return this._target.getMap();
    },

    /**
     * [setContent description]
     * @param {[type]} content [description]
     */
    setContent:function(content) {
        this.options['content'] = content;
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    getContent:function() {
        return this.options['content'];
    },

    setTitle:function(title) {
        this.options['title'] = title;
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    getTitle:function() {
        return this.options['title'];
    },

    _createDOM: function(){
        if (this.options['custom']) {
            if (Z.Util.isString(this.options['content'])) {
                var dom = Z.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
                return dom;
            } else {
                return this.options['content'];
            }
        } else {
            var dom = Z.DomUtil.createEl('div');
            dom.className = 'maptalks-msgBox';
            dom.style.width = this._getWindowWidth()+'px';
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

    _getDomOffset:function() {
        var size = this.getSize();
        var o = new Z.Point(-size['width']/2, -size['height'])._add(-4, -12);
        if (this._target instanceof Z.Marker) {
            var markerSize = this._target.getSize();
            if (markerSize) {
                o._add(0,  -markerSize['height']);
            }
        }
        return o;
    },

    _getWindowWidth:function() {
        var defaultWidth = 300;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    _registerEvents:function() {
        this.getMap().on('_zoomstart', this._onZoomStart, this)
            .on('_zoomend', this._onZoomEnd, this);
    },

    _removeEvents:function() {
        this.getMap().off('_zoomstart', this._onZoomStart, this)
                     .off('_zoomend', this._onZoomEnd, this);
    },

    _onZoomStart:function() {
        if (this.isVisible()) {
            this._getDOM().style.left = -999999+'px';
            this._getDOM().style.top = -999999+'px';
        }
    },

    _onZoomEnd:function() {
        if (this.isVisible()) {
            var point = this._getPosition();
            this._getDOM().style.left = point.x+'px';
            this._getDOM().style.top = point.y+'px';
        }
    }
});
