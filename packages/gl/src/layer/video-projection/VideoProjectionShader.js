import * as reshader from '../../reshader';
import { getWGSLSource } from '../../reshader/gpu/WGSLSources';
import vert from './shaders/video-projection.vert';
import frag from './shaders/video-projection.frag';

/**
 * 视频投影全屏合成着色器
 */
class VideoProjectionShader extends reshader.QuadShader {
    constructor(viewport) {
        super({
            name: 'video-projection',
            vert,
            frag,
            wgslFrag: getWGSLSource('gl_video_projection_frag'),
            extraCommandProps: {
                viewport
            }
        });
    }
}

export default VideoProjectionShader;
