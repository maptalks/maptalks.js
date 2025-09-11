import skyboxData from './skybox.js';
import skyboxVS from './skybox.vert';
import skyboxFS from './skybox.frag';

let command, commandHDR;
let config;
//sketchfab Spherical harmonics
const diffuseSPH = [[0.1341, 0.1298, 0.1150], [0.0306, 0.0478, 0.0725], [-0.0145, -0.0110, -0.0054], [0.0437, 0.0570, 0.0679], [0.0492, 0.0562, 0.0677], [-0.0051, -0.0043, -0.0057], [-0.0160, -0.0171, -0.0167], [0.0305, 0.0283, 0.0209], [-0.0075, -0.0102, -0.0157]];
/**
 * Draw skybox with given cubemap and camera position
 *
 * @param {REGL} regl - regl instance
 * @param {REGLCubeMap} cubeMap - a regl cubemap
 * @param {Number[]} viewMatrix - camera view matrix, a column-major float array of 4x4 matrix
 * @param {Number[]} projMatrix  - camera projection matrix, column-major float array of 4x4 matrix
 * @param {Boolean} [useHDR=false] - whether export color using HDR
 * @param {REGLFramebuffer} [frameBuffer=false] - the framebuffer to render to
 */
export function drawSkybox(regl, cubeMap, viewMatrix, projMatrix, useHDR, frameBuffer, decRGBM, useMipmap, blur, uSize, uBackgroundExposure, environmentExposure, useAmbient, backgroundIntensity = 1) {
    let drawCommand;
    config = config || {
        vert : skyboxVS,
        attributes : {
            'aPosition' : skyboxData.vertices
        },
        uniforms : {
            'cubeMap' : regl.prop('cubeMap'),
            'bias' : regl.prop('bias'),
            'uSize': regl.prop('uSize'),
            'uBackgroundExposure': regl.prop('uBackgroundExposure'),
            'environmentExposure' : regl.prop('environmentExposure'),
            'diffuseSPH[0]': regl.prop('diffuseSPH[0]'),
            'diffuseSPH[1]': regl.prop('diffuseSPH[1]'),
            'diffuseSPH[2]': regl.prop('diffuseSPH[2]'),
            'diffuseSPH[3]': regl.prop('diffuseSPH[3]'),
            'diffuseSPH[4]': regl.prop('diffuseSPH[4]'),
            'diffuseSPH[5]': regl.prop('diffuseSPH[5]'),
            'diffuseSPH[6]': regl.prop('diffuseSPH[6]'),
            'diffuseSPH[7]': regl.prop('diffuseSPH[7]'),
            'diffuseSPH[8]': regl.prop('diffuseSPH[8]'),
            'viewMatrix' : regl.prop('viewMatrix'),
            'projMatrix' : regl.prop('projMatrix')
        },
        count : skyboxData.vertices.length / 3,
        framebuffer : regl.prop('frameBuffer'),
        depth : {
            enable : true,
            func : 'lequal'
        }
    };
    let frag = skyboxFS;
    if (decRGBM) {
        frag = '#define DEC_RGBM 1 \n' + frag;
    }
    if (useMipmap) {
        frag = '#define USE_MIPMAP 1 \n' + frag;
    } else if (useAmbient) {
        frag = '#define USE_AMBIENT 1 \n' + frag;
    }
    if (useHDR) {
        config['frag'] = '#define USE_HDR 1\n' + frag;
        drawCommand = commandHDR = commandHDR || regl(config);
    } else {
        config['frag'] = frag;
        drawCommand = command = command || regl(config);
    }

    drawCommand({
        cubeMap,
        uBackgroundExposure,
        environmentExposure,
        backgroundIntensity,
        bias: blur,
        uSize,
        diffuseSPH,
        viewMatrix,
        projMatrix,
        frameBuffer
    });
}
