import MeshShader from './MeshShader';
import vert from './glsl/heatmap_display.vert';
import frag from './glsl/heatmap_display.frag';
import { mat4 } from 'gl-matrix';
import { extend } from '../common/Util';

export default class HeatmapDisplayShader extends MeshShader {
    constructor(config) {
        const extraCommandProps = {
            blend: {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            viewport: {
                x: 0,
                y: 0,
                width: (context, props) => props.inputTexture.width,
                height: (context, props) => props.inputTexture.height
            }
        };
        if (config && config.extraCommandProps) {
            extend(extraCommandProps, config.extraCommandProps);
        }
        super({
            vert, frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'textureOutputSize',
                    type: 'function',
                    fn: function (context) {
                        return [context.drawingBufferWidth, context.drawingBufferHeight];
                    }
                }
            ],
            extraCommandProps
        });
    }
}
