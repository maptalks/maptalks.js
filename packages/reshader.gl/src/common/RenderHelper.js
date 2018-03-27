import { mat4 } from '@mapbox/gl-matrix';

const renderToCube = function () {
    const cameraPos = [0, 0, 0];
    const captureViews = [
        mat4.lookAt([], cameraPos, [1, 0, 0],  [0, -1, 0]),
        mat4.lookAt([], cameraPos, [-1, 0, 0], [0, -1, 0]),
        mat4.lookAt([], cameraPos, [0, 1, 0],  [0, 0, 1]),
        mat4.lookAt([], cameraPos, [0, -1, 0], [0, 0, -1]),
        mat4.lookAt([], cameraPos, [0, 0, 1],  [0, -1, 0]),
        mat4.lookAt([], cameraPos, [0, 0, -1], [0, -1, 0])
    ];
    const fov = 90 * Math.PI / 180;
    const clearColor = [0, 0, 0, 0];
    const pmat = new Array(16);

    return function (regl, fbo, drawCommand, props, cb) {
        const aspect = 1;
        const near = 0.5;
        const far = 1.1;
        const projection = mat4.perspective(pmat, fov, aspect, near, far);

        const config = {
            context : {
                //每次应用不同的 view matrix
                view: function (context, props, batchId) {
                    return captureViews[batchId];
                },
                projection : projection
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

        setupFace(6, () => {
            regl.clear({
                color: clearColor,
                depth: 1
            });
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
