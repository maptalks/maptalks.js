import CanvasLayer from './CanvasLayer';
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
declare class ParticleLayer extends CanvasLayer {
    /**
     * Interface method to get particles's position at time t.
     * @param  {Number} t - current time in milliseconds
     */
    getParticles(): void;
    // @ts-expect-error
    draw(context: any, view: any): void;
    _fillCanvas(context: any): void;
}
export default ParticleLayer;
