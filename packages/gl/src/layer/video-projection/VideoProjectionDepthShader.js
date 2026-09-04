import * as reshader from '../../reshader';
import { getWGSLSource } from '../../reshader/gpu/WGSLSources';
import { mat4 } from 'gl-matrix';
import vert from './shaders/depth.vert';
import frag from './shaders/depth.frag';

const projViewModelMatrix = [];

/**
 * 深度渲染着色器：将场景网格以投影相机的 projView 矩阵渲染为深度贴图
 */
class VideoProjectionDepthShader extends reshader.MeshShader {
    constructor(viewport) {
        super({
            name: 'video-projection-depth',
            vert,
            frag,
            wgslVert: getWGSLSource('gl_video_projection_depth_vert'),
            wgslFrag: getWGSLSource('gl_video_projection_depth_frag'),
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport
            }
        });
        this.version = 300;
    }
}

export default VideoProjectionDepthShader;
