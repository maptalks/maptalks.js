/**
 * ParticleLayer provides some interface methods to render particles. <br>
 * You can use it directly, but can't ser/dser a ParticleLayer with json in this way. <br>
 * It is more recommended to extend it with a subclass.
 * @classdesc
 * A layer to draw particles.
 * @example
 *  var layer = new maptalks.ParticleLayer('particle');
 *
 *  layer.getParticles = function (t) {
 *      return particles[t];
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.CanvasLayer#options}
 */
maptalks.ParticleLayer = maptalks.CanvasLayer.extend({
    options : {
        'animation' : true,
        'fps' : 70
    },

    /**
     * Interface method to get particles's position at time t.
     * @param  {Number} t - current time in milliseconds
     */
    getParticles: function () {

    },

    draw: function (context) {
        var map = this.getMap(),
            extent = map.getContainerExtent();
        var points = this.getParticles(maptalks.Util.now());
        if (!points) {
            return;
        }
        var pos;
        for (var i = 0, l = points.length; i < l; i++) {
            pos = points[i].point;
            if (extent.contains(pos)) {
                if (context.fillStyle !== points[i].color) {
                    context.fillStyle = points[i].color || this.options['lineColor'] || '#fff';
                }
                context.fillRect(pos.x - points[i].r / 2, pos.y - points[i].r / 2, points[i].r, points[i].r);
            }
        }
        this._fillCanvas(context);
    },

    _fillCanvas: function (context) {
        var g = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';
        var trail = this.options['trail'] || 30;
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 / trail) + ')';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = g;
    }
});
