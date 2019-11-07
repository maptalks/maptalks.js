import skyboxData from './skybox.js';
import skyboxVS from './skybox.vert';
import skyboxFS from './skybox.frag';

let command, commandHDR;
let config;

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
export function drawSkybox(regl, cubeMap, viewMatrix, projMatrix, useHDR, frameBuffer, decRGBM) {
    let drawCommand;
    config = config || {
        vert : skyboxVS,
        attributes : {
            'aPosition' : skyboxData.vertices
        },
        uniforms : {
            'cubeMap' : regl.prop('cubeMap'),
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
    if (useHDR) {
        config['frag'] = '#define USE_HDR 1\n' + frag;
        drawCommand = commandHDR = commandHDR || regl(config);
    } else {
        config['frag'] = frag;
        drawCommand = command = command || regl(config);
    }


    drawCommand({
        cubeMap,
        viewMatrix,
        projMatrix,
        frameBuffer
    });
}
