import MeshShader from './MeshShader';
import vert from './glsl/heatmap_display.vert';
import frag from './glsl/heatmap_display.frag';
import { mat4 } from 'gl-matrix';
import { extend } from '../common/Util';

export default class HeatmapDisplayShader extends MeshShader {
    constructor(viewport, config) {
        const extraCommandProps = {
            blend: {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            viewport
        };
        if (config && config.extraCommandProps) {
            extend(extraCommandProps, config.extraCommandProps);
        }
        const projViewModelMatrix = [];
        super({
            vert, frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps
        });
    }
}
