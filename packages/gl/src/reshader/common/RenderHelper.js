import { mat4 } from 'gl-matrix';

const renderToCube = function () {
    const cameraPos = [0, 0, 0];

    const fov = 90 * Math.PI / 180;
    const clearColor = [0, 0, 0, 0];
    const pmat = new Array(16);

    return function (regl, fbo, drawCommand, props, cb, up) {
        const captureViews = [
            mat4.lookAt([], cameraPos, [1, 0, 0], up && up[0] || [0, -1, 0]),
            mat4.lookAt([], cameraPos, [-1, 0, 0], up && up[1] || [0, -1, 0]),
            mat4.lookAt([], cameraPos, [0, 1, 0],  up && up[2] || [0, 0, 1]),
            mat4.lookAt([], cameraPos, [0, -1, 0], up && up[3] || [0, 0, -1]),
            mat4.lookAt([], cameraPos, [0, 0, 1],  up && up[4] || [0, -1, 0]),
            mat4.lookAt([], cameraPos, [0, 0, -1], up && up[5] || [0, -1, 0])
        ];
        const aspect = 1;
        const near = 0.5;
        const far = 1.1;
        const isWebGPU = !!regl.wgpu;
        let projMatrix;
        if (isWebGPU) {
            projMatrix = mat4.perspectiveZO(pmat, fov, aspect, near, far);
        } else {
            projMatrix = mat4.perspective(pmat, fov, aspect, near, far);
        }

        const config = {
            context : {
                //每次应用不同的 view matrix
                viewMatrix: function (context, props, batchId) {
                    return captureViews[batchId];
                },
                projMatrix
            }
        };
        if (fbo) {
            if (fbo.faces) {
                //a cube map
                config.framebuffer = function (context, props, batchId) {
                    return fbo.faces[batchId];
                };
            } else {
                config.framebuffer = fbo;
            }
        }

        const setupFace = regl(config);

        setupFace(6, (context, p, batchId) => {
            const cfg = {
                color: clearColor,
                depth: 1
            };
            if (fbo) {
                cfg.framebuffer = fbo.faces ? fbo.faces[batchId] : fbo;
            }
            regl.clear(cfg);
            drawCommand(props);
            if (cb) cb();
        });

        return fbo;
    };
}();

/**
 * Draw
 * @param {REGL} regl
 * @param {FrameBuffer} fbo
 * @param {REGLCommand} drawCommand
 * @param {Object} props
 */
export { renderToCube };
