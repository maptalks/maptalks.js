import { getWGSLSource } from '@maptalks/gl';
//DEPRECATED
import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/copy_depth.frag';
class CopyDepthShader extends QuadShader {
    constructor() {
        const size = [];
        super({
            name: 'copy-depth',
            vert, frag,
            wgslVert: getWGSLSource('gl_quad_vert'), wgslFrag: getWGSLSource('gl_copy_depth_frag'),
            uniforms: [
                {
                    name: 'textureSize',
                    type: 'function',
                    fn: (context, props) => {
                        size[0] = props['TextureDepth'].width;
                        size[1] = props['TextureDepth'].height;
                        return size;
                    }
                }
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width : (context, props) => {
                        return props['TextureDepth'].width;
                    },
                    height : (context, props) => {
                        return props['TextureDepth'].height;
                    }
                }
            }
        });
        this.version = 300;
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['copy_depth']) {
            this.commands['copy_depth'] = this.createMeshCommand(regl, mesh);
        }
        return this.commands['copy_depth'];
    }
}

export default CopyDepthShader;
