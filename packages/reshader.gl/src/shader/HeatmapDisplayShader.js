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
            }
        };
        if (config && config.extraCommandProps) {
            extend(extraCommandProps, config.extraCommandProps);
        }
        const projViewModelMatrix = [];
        const textureOutputSize = [];
        super({
            vert, frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'textureOutputSize',
                    type: 'function',
                    fn: function (context) {
                        textureOutputSize[0] = context.drawingBufferWidth;
                        textureOutputSize[1] = context.drawingBufferHeight;
                        return textureOutputSize;
                    }
                }
            ],
            extraCommandProps
        });
    }
}
