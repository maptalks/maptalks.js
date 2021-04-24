import MeshShader from './MeshShader';
import vert from './glsl/heatmap.vert';
import frag from './glsl/heatmap.frag';
import { mat4 } from 'gl-matrix';
import { extend } from '../common/Util';

class HeatmapShader extends MeshShader {
    constructor(config) {
        const extraCommandProps = config ? config.extraCommandProps || {} : {};
        const projViewModelMatrix = [];
        super({
            vert, frag,
            uniforms: [
                {
                    name: 'extrudeScale',
                    type: 'function',
                    fn: function (context, props) {
                        return  props['resolution'] / props['dataResolution'] * props['tileRatio'];
                    }
                },
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: extend({}, extraCommandProps, {
                blend: {
                    enable: true,
                    func: {
                        src: 'one',
                        dst: 'one'
                    },
                    equation: 'add'
                }
            })
        });
    }
}

export default HeatmapShader;
