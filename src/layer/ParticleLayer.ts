import { now } from '../core/util';
import CanvasLayer, { CanvasLayerOptionsType } from './CanvasLayer';
import CanvasLayerRenderer from '../renderer/layer/canvaslayer/CanvasLayerRenderer';
import Point from '../geo/Point';

const TEMP_POINT = new Point(0, 0);
/**
 * @property {Object} options                  - configuration options
 * @property {Boolean} [options.animation=true]       - if the layer is an animated layer
 * @memberOf ParticleLayer
 * @instance
 */
const options: ParticleLayerOptionsType = {
    'animation': true
};

/**
 * 粒子图层
 * 提供了一些渲染粒子的接口方法。
 * 你可以直接使用它，但不能以这种方式用JSON序列化/反序列化一个 particelayer
 * 更建议使用子类来扩展它
 *
 * @english
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
    options: ParticleLayerOptionsType;

    /**
     * 获取t时刻的例子位置
     *
     * @english
     * Interface method to get particles's position at time t.
     * @param t - current time in milliseconds
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getParticles(t?: number) {
    }

    draw(context: CanvasRenderingContext2D, view: any) {
        const points: any = this.getParticles(now());
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 当前 map 接口中目前没有_pointToContainerPoint方法
        extent = extent.convertTo(c => map._pointToContainerPoint(c, undefined, 0, TEMP_POINT));
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

    _fillCanvas(context: CanvasRenderingContext2D) {
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
    _shouldClear: boolean;
    layer: ParticleLayer;

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

export type ParticleLayerOptionsType = CanvasLayerOptionsType & {
    animation?: boolean;
}
