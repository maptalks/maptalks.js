import { now } from 'core/util';
import CanvasLayer from './CanvasLayer';

/**
 * @property {Object} options                  - configuration options
 * @property {Boolean} [options.animation=true]       - if the layer is an animated layer
 * @memberOf ParticleLayer
 * @instance
 */
const options = {
    'animation': true
};

/**
 * @classdesc
 * A layer to draw particles. <br>
 * ParticleLayer provides some interface methods to render particles. <br>
 * You can use it directly, but can't serialize/dserialize a ParticleLayer with JSON in this way. <br>
 * It is more recommended to extend it with a subclass.
 * @example
 * import { ParticleLayer } from 'maptalks';
 * var layer = new ParticleLayer('particle');
 *
 * layer.getParticles = function (t) {
 *     return particles[t];
 * };
 * layer.addTo(map);
 * @category layer
 * @extends CanvasLayer
 * @param {String} id - layer's id
 * @param {Object} [options=null] - options defined in [options]{@link ParticleLayer#options}
 */
class ParticleLayer extends CanvasLayer {

    /**
     * Interface method to get particles's position at time t.
     * @param  {Number} t - current time in milliseconds
     */
    getParticles() {
    }

    draw(context, view) {
        var points = this.getParticles(now());
        if (!points) {
            return;
        }
        var map = this.getMap(),
            extent = view.extent;
        if (view.maskExtent) {
            extent = view.extent.intersection(view.maskExtent);
        }
        extent = extent.converTo(c => map._pointToContainerPoint(c));
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
    }

    _fillCanvas(context) {
        var g = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';
        var trail = this.options['trail'] || 30;
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 / trail) + ')';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = g;
    }
}

ParticleLayer.mergeOptions(options);

export default ParticleLayer;
