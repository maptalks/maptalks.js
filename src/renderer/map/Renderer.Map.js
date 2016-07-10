/**
 * @namespace
 */
Z.renderer.map = {};

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
Z.renderer.map.Renderer = Z.Class.extend(/** @lends Z.renderer.map.Renderer.prototype */{

    /**
     * get Transform Matrix for zooming
     * @param  {Number} scale  scale
     * @param  {Point} origin Transform Origin
     */
    getZoomMatrix:function (scale, origin, retina) {
        //matrix for layers to transform
        var view = this.map.containerPointToViewPoint(origin);
        var matrices  = {
            'container' : new Z.Matrix().translate(origin.x, origin.y)
                        .scaleU(scale).translate(-origin.x, -origin.y),
            'view'      : new Z.Matrix().translate(view.x, view.y)
                        .scaleU(scale).translate(-view.x, -view.y)
        };

        if (retina) {
            origin = origin.multi(2);
            matrices['retina'] = new Z.Matrix().translate(origin.x, origin.y)
                        .scaleU(scale).translate(-origin.x, -origin.y);
        }
        // var scale = matrices['container'].decompose()['scale'];
        matrices['scale'] = {x:scale, y:scale};
        return matrices;
    },

    panAnimation:function (distance, t, onFinish) {
        distance = new Z.Point(distance);
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
            var player = Z.Animation.animate({
                'distance' : distance
            }, {
                'easing' : 'out',
                'speed' : duration
            }, function (frame) {
                if (!map._enablePanAnimation) {
                    player.finish();
                    map._panAnimating = false;
                    map._onMoveEnd();
                    return;
                }

                if (player.playState === 'running' && frame.styles['distance']) {
                    var dist = frame.styles['distance']._round();
                    if (!preDist) {
                        preDist = dist;
                    }
                    var offset = dist.substract(preDist);
                    map.offsetPlatform(offset);
                    map._offsetCenterByPixel(offset);
                    preDist = dist;
                    map._onMoving();
                } else if (player.playState === 'finished') {
                    map._panAnimating = false;
                    if (onFinish) {
                        onFinish();
                    }
                    map._onMoveEnd();
                }
            });
            player.play();
        } else {
            map._onMoveEnd();
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
        var mapPlatform = this.map._panels.mapPlatform,
            layer = this.map._panels.layer,
            pos = this.map.offsetPlatform().add(offset)._round();
        Z.DomUtil.offsetDom(mapPlatform, pos);
        Z.DomUtil.offsetDom(layer, pos);
        return this;
    },

    resetContainer:function () {
        this.map._resetMapViewPoint();
        if (this.map._panels.mapPlatform) {
            var pos = new Z.Point(0, 0);
            Z.DomUtil.offsetDom(this.map._panels.mapPlatform, pos);
            Z.DomUtil.offsetDom(this.map._panels.layer, pos);
        }
    },

    onZoomEnd:function () {
        this.resetContainer();
    },

    onLoad: function () {
        this.render();
    }
});
