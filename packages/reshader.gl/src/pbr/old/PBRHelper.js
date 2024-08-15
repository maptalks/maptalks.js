import { renderToCube } from '../common/RenderHelper.js';

import cubeData from './CubeData.js';

import cubemapVS from './glsl/cubemap.vert';
import equirectangularMapFS from './glsl/equirectangular_to_cubemap.frag';
import prefilterFS from './glsl/prefilter.frag';
import brdfFS from './glsl/brdf.frag';
import brdfVS from './glsl/brdf.vert';
import irradianceFS from './glsl/irradiance_convolution.frag';

/**
 * {
 *  envTexture,
 *  envCubeSize,
 *  irradianceCubeSize,
 *  sampleSize,
 *  roughnessLevels,
 *  prefilterCubeSize,
 *  brdfSize
 * }
 * @param regl - regl
 * @param config - config
 */
export function createIBLMaps(regl, config = {}) {
    // config values

    const envTexture = config.envTexture;

    const envCubeSize = config.envCubeSize || 512;

    const irradianceCubeSize = config.irradianceCubeSize || 32;

    const sampleSize = config.sampleSize || 1024;
    const roughnessLevels = config.roughnessLevels || 256;
    const prefilterCubeSize = config.prefilterCubeSize || 256;

    const brdfSize = config.brdfSize || 512;

    //----------------------------------------------------
    // generate ibl maps

    const envMap = createEquirectangularMapCube(regl, envTexture, envCubeSize);

    const irradianceMap = createIrradianceCube(regl, envMap, irradianceCubeSize);

    const prefilterMap = createPrefilterCube(regl, envMap, prefilterCubeSize, sampleSize, roughnessLevels);

    const brdfLUT = generateBRDFLUT(regl, brdfSize, sampleSize, roughnessLevels);

    return {
        envMap,
        irradianceMap,
        prefilterMap,
        brdfLUT
    };
}

/**
 * Create a texture cube map from an equirectangular texture
 * @param {REGL} regl - regl reference
 * @param {REGLTexture} texture - a regl texture
 * @param {Number} [size=512] - size of the cubemap, 512 by default
 */
function createEquirectangularMapCube(regl, texture, size) {
    size = size || 512;
    const drawCube = regl({
        frag : equirectangularMapFS,
        vert : cubemapVS,
        attributes : {
            'aPosition' : cubeData.vertices
        },
        uniforms : {
            'projMatrix' : regl.context('projMatrix'),
            'viewMatrix' :  regl.context('viewMatrix'),
            'equirectangularMap' : texture
        },
        elements : cubeData.indices
    });

    const envMapFBO = regl.framebufferCube(size);

    renderToCube(regl, envMapFBO, drawCube);

    return envMapFBO;
}

//solve diffuse integral by convolution to create an irradiance (cube)map.
function createIrradianceCube(regl, envCube, SIZE) {
    SIZE = SIZE || 32;
    const irradianceCube = regl.framebufferCube({
        radius : SIZE,
        color : regl.cube({
            radius : SIZE,
            wrap : 'clamp', // shortcut for both wrapS and wrapT
            min : 'linear',
            mag : 'linear'
        })
    });

    const drawCube = regl({
        frag : irradianceFS,
        vert : cubemapVS,
        attributes : {
            'aPosition' : cubeData.vertices
        },
        uniforms : {
            'projMatrix' : regl.context('projMatrix'),
            'viewMatrix' :  regl.context('viewMatrix'),
            'environmentMap' : envCube
        },
        elements : cubeData.indices
    });

    renderToCube(regl, irradianceCube, drawCube);

    return irradianceCube;
}

//因webgl限制，framebufferTexImage2D无法指定mip level
//故改用以下步骤生成:
//参考代码：
//https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/6.pbr/2.2.2.ibl_specular_textured/ibl_specular_textured.cpp#L290
//https://github.com/vorg/pragmatic-pbr/blob/master/local_modules/prefilter-cubemap/index.js
function createPrefilterCube(regl, fromCubeMap, SIZE, sampleSize, roughnessLevels) {
    //1. 生成NormalDistribution采样的LUT
    sampleSize = sampleSize || 1024;
    roughnessLevels = roughnessLevels || 256;

    const distro = generateNormalDistribution(sampleSize, roughnessLevels);

    const distributionMap = regl.texture({
        data : distro,
        width : roughnessLevels,
        height : sampleSize,
        min : 'nearest',
        mag : 'nearest'
    });

    const drawCube = regl({
        frag : prefilterFS,
        vert : cubemapVS,
        attributes : {
            'aPosition' : cubeData.vertices
        },
        uniforms : {
            'projMatrix' : regl.context('projMatrix'),
            'viewMatrix' :  regl.context('viewMatrix'),
            'environmentMap' : fromCubeMap,
            'distributionMap' : distributionMap,
            'roughness' : regl.prop('roughness')
        },
        elements : cubeData.indices,
        viewport : {
            x: 0,
            y: 0,
            width: regl.prop('size'),
            height: regl.prop('size')
        }
    });
    let size = SIZE;

    const tmpFBO = regl.framebuffer(size);

    const maxLevels = Math.log(size) / Math.log(2) + 1;//log2(SIZE); //fix to 4

    //手动构造prefilterMap各mipmap level的数据
    const mipmap = [];
    for (let i = 0; i < maxLevels; i++) {
        const roughness = i / (maxLevels - 1);
        let faceId = 0;
        //分别绘制六个方向，读取fbo的pixel，作为某个方向的mipmap级别数据
        renderToCube(regl, tmpFBO, drawCube, {
            roughness : roughness,
            size : size
        }, function (/* context, props, batchId */) {
            const pixels = regl.read();
            if (!mipmap[faceId]) {
                //regl要求的cube face的mipmap数据格式
                mipmap[faceId] = {
                    mipmap : []
                };
            }
            mipmap[faceId].mipmap.push(pixels);
            //下一个面
            faceId++;
        });
        if (i < maxLevels - 1) {
            //下一个mipmap level
            size /= 2;
            tmpFBO.resize(size);
        }
    }

    const prefilterMapFBO = regl.cube({
        radius : SIZE,
        min : 'linear mipmap linear',
        mag : 'linear',
        // wrap : 'clamp',
        faces : mipmap
    });

    tmpFBO.destroy();

    return prefilterMapFBO;
}

const quadVertices = [
    // positions     // texture Coords
    -1.0,  1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0,  1.0, 0.0,
    1.0, -1.0, 0.0,
];
const quadTexcoords = [
    0.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0,
];

const BRDF_CACHE = {};

function generateBRDFLUT(regl, size, sampleSize, roughnessLevels) {
    sampleSize = sampleSize || 1024;
    roughnessLevels = roughnessLevels || 256;

    const key = size + '-' + sampleSize + '-' + roughnessLevels;

    let distro;
    if (BRDF_CACHE[key]) {
        distro = BRDF_CACHE[key];
    } else {
        distro = generateNormalDistribution(sampleSize, roughnessLevels);
        BRDF_CACHE[key] = distro;
    }

    const distributionMap = regl.texture({
        data : distro,
        width : roughnessLevels,
        height : sampleSize,
        type : 'float',
        min : 'nearest',
        mag : 'nearest'
    });

    const quadBuf = regl.buffer(quadVertices);
    const quadTexBuf = regl.buffer(quadTexcoords);
    const fbo = regl.framebuffer({
        radius : size,
        type : 'float',
        min : 'nearest',
        mag : 'nearest'
    });
    // const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    const drawLUT = regl({
        frag : brdfFS,
        vert : brdfVS,
        attributes : {
            'aPosition' : {
                buffer : quadBuf,
                // stride : 5 * FSIZE,
                // size : 3
            },
            'aTexCoord' : {
                buffer : quadTexBuf,
                // offset : 3 * FSIZE,
                // stride : 5 * FSIZE,
                // size : 2,
            }
        },
        uniforms : {
            'distributionMap' : distributionMap
        },
        framebuffer : fbo,
        viewport : {
            x : 0,
            y : 0,
            width : size,
            height : size
        },
        count : quadVertices.length / 3,
        primitive: 'triangle strip'
    });
    drawLUT();

    return fbo;

}

//因为glsl不支持位操作，所以预先生成采样LUT， 代替原代码中的采样逻辑
//https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/6.pbr/2.2.2.ibl_specular_textured/2.2.2.prefilter.fs
function generateNormalDistribution(sampleSize, roughnessLevels) {
    const pixels = new Array(sampleSize * roughnessLevels * 4);
    for (let i = 0; i < sampleSize; i++) {
        const { x, y } = hammersley(i, sampleSize);

        for (let j = 0; j < roughnessLevels; j++) {
            //原fs中的ImportanceSampleGGX前半部分
            const roughness = j / roughnessLevels;
            const a = roughness * roughness;
            const phi = 2.0 * Math.PI * x;
            const cosTheta = Math.sqrt((1 - y) / (1 + (a * a - 1.0) * y));
            const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
            const offset = (i * roughnessLevels + j) * 4;
            pixels[offset] = sinTheta * Math.cos(phi);
            pixels[offset + 1] = sinTheta * Math.sin(phi);
            pixels[offset + 2] = cosTheta;
            pixels[offset + 3] = 1.0;
        }
    }

    return pixels;
}

function hammersley(i, sampleSize) {
    const x = i / sampleSize;
    let y = (i << 16 | i >>> 16) >>> 0;
    y = ((y & 1431655765) << 1 | (y & 2863311530) >>> 1) >>> 0;
    y = ((y & 858993459) << 2 | (y & 3435973836) >>> 2) >>> 0;
    y = ((y & 252645135) << 4 | (y & 4042322160) >>> 4) >>> 0;
    y = (((y & 16711935) << 8 | (y & 4278255360) >>> 8) >>> 0) / 4294967296;

    return { x, y };
}

