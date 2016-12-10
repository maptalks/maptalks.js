/**
 * @namespace
 * @protected
 */
maptalks.renderer.map = {};

/**
 * @classdesc
 * Base class for all the map renderers.
 * @class
 * @abstract
 * @protected
 * @memberOf maptalks.renderer.map
 * @name Renderer
 * @extends {maptalks.Class}
 */
maptalks.renderer.map.Renderer = maptalks.Class.extend(/** @lends maptalks.renderer.map.Renderer.prototype */{

    panAnimation:function (distance, t, onFinish) {
        distance = new maptalks.Point(distance);
        var map = this.map;
        if (map.options['panAnimation']) {
            var duration;
            if (!t) {
                duration = map.options['panAnimationDuration'];
            } else {
                duration = t;
            }
            map._enablePanAnimation = true;
            map._panAnimating = true;
            var preDist = null;
            var player = maptalks.Animation.animate({
                'distance' : distance
            }, {
                'easing' : 'out',
                'speed' : duration
            }, function (frame) {
                if (!map._enablePanAnimation) {
                    player.finish();
                    map._panAnimating = false;
                    map.onMoveEnd();
                    return;
                }

                if (player.playState === 'running' && frame.styles['distance']) {
                    var dist = frame.styles['distance'];
                    if (!preDist) {
                        preDist = dist;
                    }
                    var offset = dist.substract(preDist);
                    map.offsetPlatform(offset);
                    map._offsetCenterByPixel(offset);
                    preDist = dist;
                    map.onMoving();
                } else if (player.playState === 'finished') {
                    map._panAnimating = false;
                    if (onFinish) {
                        onFinish();
                    }
                    map.onMoveEnd();
                }
            });
            player.play();
        } else {
            map.onMoveEnd();
        }
    },

    /**
     * 获取地图容器偏移量或更新地图容器偏移量
     * @param  {Point} offset 偏移量
     * @return {this | Point}
     */
    offsetPlatform:function (offset) {
        if (!this.map._panels.mapPlatform) {
            return this;
        }
        var pos = this.map.offsetPlatform().add(offset)._round();
        maptalks.DomUtil.offsetDom(this.map._panels.layer, pos);
        maptalks.DomUtil.offsetDom(this.map._panels.mapPlatform, pos);
        return this;
    },

    resetContainer:function () {
        this.map._resetMapViewPoint();
        if (this.map._panels.mapPlatform) {
            var pos = new maptalks.Point(0, 0);
            maptalks.DomUtil.offsetDom(this.map._panels.layer, pos);
            maptalks.DomUtil.offsetDom(this.map._panels.mapPlatform, pos);
        }
    },

    onZoomEnd:function () {
        this.resetContainer();
    },

    onLoad: function () {
        this.render();
    }
});
