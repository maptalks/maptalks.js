import { now } from '../core/util';
import CanvasLayer from './CanvasLayer';
import CanvasLayerRenderer from '../renderer/layer/canvaslayer/CanvasLayerRenderer';
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
 * You can use it directly, but can't serialize/deserialize a ParticleLayer with JSON in this way. <br>
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
        const points = this.getParticles(now());
        if (!points || points.length === 0) {
            const renderer = this._getRenderer();
            if (renderer) {
                this._getRenderer()._shouldClear = true;
            }
            return;
        }
        const map = this.getMap();
        let extent = view.extent;
        if (view.maskExtent) {
            extent = view.extent.intersection(view.maskExtent);
        }
        extent = extent.convertTo(c => map._pointToContainerPoint(c));
        const e = 2 * Math.PI;
        for (let i = 0, l = points.length; i < l; i++) {
            const pos = points[i].point;
            if (extent.contains(pos)) {
                const color = points[i].color || this.options['lineColor'] || '#fff',
                    r = points[i].r;
                if (context.fillStyle !== color) {
                    context.fillStyle = color;
                }
                if (r <= 2) {
                    context.fillRect(pos.x - r / 2, pos.y - r / 2, r, r);
                } else {
                    context.beginPath();
                    context.arc(pos.x, pos.y, r / 2, 0, e);
                    context.fill();
                }
            }
        }
        this._fillCanvas(context);
    }

    _fillCanvas(context) {
        const g = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';
        const trail = this.options['trail'] || 30;
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 / trail) + ')';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = g;
    }
}

ParticleLayer.mergeOptions(options);

ParticleLayer.registerRenderer('canvas', class extends CanvasLayerRenderer {
    draw() {
        if (!this.canvas || !this.layer.options['animation'] || this._shouldClear) {
            this.prepareCanvas();
            this._shouldClear = false;
        }
        this.prepareDrawContext();
        this._drawLayer();
    }

    drawOnInteracting() {
        this.draw();
        this._shouldClear = false;
    }

    onSkipDrawOnInteracting() {
        this._shouldClear = true;
    }
});

export default ParticleLayer;
