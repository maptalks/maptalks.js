import { isNil } from '../common/Util';
import { mat4, vec4, vec3 } from 'gl-matrix';
import ShadowMapShader from './ShadowMapShader';
import BoxShadowBlurShader from '../shader/BoxShadowBlurShader';

let getFrustumWorldSpace = null, getDirLightCameraProjView = null;

class ShadowPass {
    constructor(renderer, { width, height, blurOffset, defines }) {
        this.renderer = renderer;
        this.width = width || 512;
        this.height = height || 512;
        this.blurOffset = isNil(blurOffset) ? 2 : blurOffset;
        this._init(defines);
    }

    render(scene, { cameraProjViewMatrix, lightDir, farPlane, cameraLookAt }) {
        const lightProjViewMatrix = this._renderShadow(scene, cameraProjViewMatrix, lightDir, farPlane, cameraLookAt);
        return {
            lightProjViewMatrix,
            shadowMap : this.blurTex || this.depthTex,
            depthFBO : this.depthFBO,
            blurFBO : this.blurFBO
        };
    }

    resize(width, height) {
        if (this.depthTex) {
            this.depthTex.resize(width, height);
            this.depthFBO.resize(width, height);
        }
        this.width = width;
        if (this.blurFBO) {
            this.blurTex.resize(width, height);
            this.blurFBO.resize(width, height);
        }
        this.height = height;
        return this;
    }

    _renderShadow(scene, cameraProjViewMatrix, lightDir, farPlane, cameraLookAt) {
        const renderer = this.renderer;
        const frustum = getFrustumWorldSpace(cameraProjViewMatrix);
        if (farPlane) {
            for (let i = 4; i < 8; i++) {
                frustum[i] = farPlane[i - 4];
            }
        }
        //TODO 计算Frustum和scene的相交部分，作为光源的frustum
        //TODO 遍历scene中的图形，如果aabb不和frustum相交，就不绘制
        const lightProjViewMatrix = getDirLightCameraProjView(cameraLookAt, frustum, lightDir);
        renderer.clear({
            color : [1, 0, 0, 1],
            depth : 1,
            framebuffer : this.depthFBO
        });
        renderer.render(this.shadowMapShader, { lightProjViewMatrix }, scene, this.depthFBO);
        if (this.blurFBO) {
            if (!this.boxBlurShader) {
                this.boxBlurShader = new BoxShadowBlurShader({
                    blurOffset : this.blurOffset
                });
            }
            renderer.clear({
                color : [1, 0, 0, 1],
                depth : 1,
                framebuffer : this.blurFBO
            });
            renderer.render(
                this.boxBlurShader,
                {
                    resolution : [this.depthTex.width, this.depthTex.height],
                    textureSource : this.depthTex
                },
                null,
                this.blurFBO
            );
        }
        return lightProjViewMatrix;
    }

    _init(defines) {
        const regl = this.renderer.regl;
        const type = 'uint8';
        const width = this.width,
            height = this.height;
        this.depthTex = regl.texture({
            width, height,
            format: 'rgb',
            type,
            min: 'nearest',
            mag: 'nearest',
        });

        this.shadowMapShader = new ShadowMapShader(defines);
        this.shadowMapShader.filter = m => m.castShadow;

        this.depthFBO = regl.framebuffer({
            color : this.depthTex
        });

        if (this.blurOffset <= 0) {
            return;
        }

        this.blurTex = regl.texture({
            width, height,
            format : 'rgb',
            type,
            min : 'linear',
            mag : 'linear'
        });

        this.blurFBO = regl.framebuffer({
            color : this.blurTex
        });
    }


    dispose() {
        if (this.depthTex) {
            this.depthTex.destroy();
            this.depthFBO.destroy();
            delete this.depthTex;
            delete this.depthFBO;
        }
        if (this.blurTex) {
            this.blurTex.destroy();
            this.blurFBO.destroy();
            delete this.blurTex;
            delete this.blurFBO;
        }
        if (this.shadowMapShader) {
            this.shadowMapShader.dispose();
            delete this.shadowMapShader;
        }
        if (this.boxBlurShader) {
            this.boxBlurShader.dispose();
            delete this.boxBlurShader;
        }
    }

}


/**
 * Get camera's frustum's coordinates in world space with given projection view matrix
 * @param {Number[]} cameraProjView camera's projection * view matrix
 */
getFrustumWorldSpace = function () {
    const clipPlanes = [
        // near
        [-1, -1, -1, 1], [1, -1, -1, 1], [1,  1, -1, 1],  [-1,  1, -1, 1],
        // far
        [-1, -1, 1, 1],	[1, -1, 1, 1],	[1,  1, 1, 1],  [-1,  1, 1, 1]
    ];
    const inverseProjectionMatrix = new Array(16);
    return function (cameraProjView) {
        mat4.invert(inverseProjectionMatrix, cameraProjView);
        const frustum = [];

        for (let i = 0; i < clipPlanes.length; i++) {
            const projWorldSpacePosition = vec4.transformMat4([], clipPlanes[i], inverseProjectionMatrix);
            vec4.scale(projWorldSpacePosition,  projWorldSpacePosition, 1 / projWorldSpacePosition[3]);
            frustum.push(projWorldSpacePosition);
        }
        // const cameraPos = vec4.transformMat4([], [0, 0, -1, 1], inverseProjectionMatrix);
        // vec4.scale(cameraPos, cameraPos, 1 / cameraPos[3]);
        return frustum;
    };
}();


//https://www.gamedev.net/forums/topic/672664-fitting-directional-light-in-view-frustum/?page=2
/**
 * Get directional light's camera projection * view matrix in shadow mapping
 * @param {Number[][]} frustum frustum
 * @param {Number[]} lightDir  light direction
 */
getDirLightCameraProjView = function () {
    let transf = new Array(4);
    const lightDirection = new Array(3);
    const frustumCenter = [0, 0, 0, 0];
    const cameraUp = [0, 1, 0];
    const v3 = new Array(3);
    let lvMatrix = new Array(16);
    let lpMatrix = new Array(16);
    const cropMatrix = new Array(16);
    const scaleV = [1, 1, 1];
    const offsetV = [0, 0, 0];
    return function (cameraLookAt, frustum, lightDir) {

        // vec4.scale(frustumCenter, frustumCenter, 0);
        // for (let i = 4; i < frustum.length; i++) {
        //     vec4.add(frustumCenter, frustumCenter, frustum[i]);
        // }
        // vec4.scale(frustumCenter, frustumCenter, 1 / 4);
        vec4.set(frustumCenter, ...cameraLookAt, 1);
        vec3.scale(lightDirection, lightDir, -1);
        lvMatrix = mat4.lookAt(lvMatrix, vec3.add(v3, frustumCenter, vec3.normalize(v3, lightDirection)), frustumCenter, cameraUp);
        vec4.transformMat4(transf, frustum[0], lvMatrix);
        let minZ = transf[2], maxZ = transf[2],
            minX = transf[0], maxX = transf[0],
            minY = transf[1], maxY = transf[1];
        for (let i = 1; i < 8; i++) {
            transf = vec4.transformMat4(transf, frustum[i], lvMatrix);

            if (transf[2] > maxZ) maxZ = transf[2];
            if (transf[2] < minZ) minZ = transf[2];
            if (transf[0] > maxX) maxX = transf[0];
            if (transf[0] < minX) minX = transf[0];
            if (transf[1] > maxY) maxY = transf[1];
            if (transf[1] < minY) minY = transf[1];
        }

        // 可能因为地图空间中y轴是反向的，所以与原贴不同，需要交换minZ和maxZ，即以-maxZ作为近裁面，-minZ作为远裁面
        lpMatrix = mat4.ortho(lpMatrix, -1, 1, -1, 1, -maxZ, -minZ);

        const scaleX = scaleV[0] = 2 / (maxX - minX);
        const scaleY = scaleV[1] = -2 / (maxY - minY);
        offsetV[0] = -0.5 * (minX + maxX) * scaleX;
        offsetV[1] = -0.5 * (minY + maxY) * scaleY;
        // scaleV[0] *= 1 / 4;
        // scaleV[1] *= 1 / 4;

        mat4.identity(cropMatrix);
        mat4.translate(cropMatrix, cropMatrix, offsetV);
        mat4.scale(cropMatrix, cropMatrix, scaleV);

        const projMatrix = mat4.multiply(lpMatrix, cropMatrix, lpMatrix);
        return mat4.multiply(new Array(16), projMatrix, lvMatrix);
    };
}();

export default ShadowPass;

