import { renderToCube } from '../common/RenderHelper.js';

import cubeData from './CubeData.js';

import cubemapVS from './glsl/helper/cubemap.vert';
import equirectangularMapFS from './glsl/helper/equirectangular_to_cubemap.frag';
import prefilterFS from './glsl/helper/prefilter.frag';
import dfgFS from './glsl/helper/dfg.frag';
import dfgVS from './glsl/helper/dfg.vert';
import coefficients from './SH.js';
import skyboxRawFrag from '../skybox/skybox.frag';
import ShaderLib from '../shaderlib/ShaderLib.js';


const skyboxFrag = ShaderLib.compile(skyboxRawFrag);
// import irradianceFS from './glsl/helper/irradiance_convolution.frag';
/**
 * {
 *  envTexture,
 *  envCubeSize,
 *  irradianceCubeSize,
 *  sampleSize,
 *  roughnessLevels,
 *  prefilterCubeSize,
 *  dfgSize
 * }
 * @param regl - regl
 * @param config - config
 */
export function createIBLMaps(regl, config = {}) {
    // config values

    const envTexture = config.envTexture;

    const envCubeSize = config.envCubeSize || 512;

    // const irradianceCubeSize = config.irradianceCubeSize || 32;

    const sampleSize = config.sampleSize || 1024;
    const roughnessLevels = config.roughnessLevels || 256;
    const prefilterCubeSize = config.prefilterCubeSize || 256;

    // const dfgSize = config.dfgSize || 256;

    //----------------------------------------------------
    // generate ibl maps
    let envMap;
    if (!Array.isArray(envTexture)) {
        envMap = createEquirectangularMapCube(regl, envTexture, envCubeSize, true);
    } else {
        const cube = regl.cube({
            flipY: true,
            faces: envTexture
        });
        // const cube = regl.cube(...envTexture);
        envMap = createSkybox(regl, cube, envCubeSize, true, config.rgbmRange);
        cube.destroy();
    }

    const { prefilterMap, prefilterMipmap } = createPrefilterCube(regl, envMap, config.rgbmRange, prefilterCubeSize, sampleSize, roughnessLevels);

    // const dfgLUT = generateDFGLUT(regl, dfgSize, sampleSize, roughnessLevels);

    let sh;
    if (!config.ignoreSH) {
        const size = prefilterCubeSize;
        // let cubeMap;
        // if (!Array.isArray(envTexture)) {
        //     cubeMap = createEquirectangularMapCube(regl, envTexture, size, false);
        // } else {
        // const cube = regl.cube(...envTexture);
        // cubeMap = createSkybox(regl, cube, size, false);
        // cube.destroy();
        // }
        // const lod = regl.hasExtension('EXT_shader_texture_lod') ? '1.0' : undefined;
        const faces = getEnvmapPixels(regl, prefilterMap, size);
        sh = coefficients(faces, size, size);
        const flatten = [];
        for (let i = 0; i < sh.length; i++) {
            flatten.push(...sh[i]);
        }
        sh = flatten;
        // cubeMap.destroy();
    }

    // const irradianceMap = createIrradianceCube(regl, envMap, irradianceCubeSize);

    const maps = {
        rgbmRange: config.rgbmRange,
        envMap,
        prefilterMap,
        // dfgLUT
    };

    if (sh) {
        maps['sh'] = sh;
    }

    if (config.format === 'array') {
        maps['envMap'] = {
            width: envMap.width,
            height: envMap.height,
            faces: getEnvmapPixels(regl, envMap, envCubeSize)
        };
        maps['prefilterMap'] = {
            width: prefilterMap.width,
            height: prefilterMap.height,
            faces: prefilterMipmap
        };
        envMap.destroy();
        prefilterMap.destroy();
    }

    return maps;
}

function createSkybox(regl, cubemap, size, encRgbm, rgbmRange) {
    const drawCube = regl({
        frag : encRgbm ? '#define ENC_RGBM 1\n' + skyboxFrag : skyboxFrag,
        vert : cubemapVS,
        attributes : {
            'aPosition' : cubeData.vertices
        },
        uniforms : {
            'hsv': [0, 0, 0],
            'projMatrix': regl.context('projMatrix'),
            'viewMatrix': regl.context('viewMatrix'),
            'cubeMap': cubemap,
            'bias': 0,
            'size': cubemap.width,
            'environmentExposure': 1,
            'rgbmRange': rgbmRange
        },
        elements : cubeData.indices
    });
    const color = regl.cube({
        width: size,
        height: size,
        min: 'linear',
        mag: 'linear',
        format: 'rgba',
    });
    const envMapFBO = regl.framebufferCube({
        radius: size,
        color
    });

    // Equirectangular cube 每个面的朝向与skybox不同，所以skybox里每个面的up direction需要重新定义
    renderToCube(regl, envMapFBO, drawCube, { size }, null, [
        [0, 0, -1],
        [0, 0, -1],
        [0, 0, 1],
        [0, 0, 1],
        [0, -1, 0],
        [0, -1, 0],
    ]);
    drawCube.destroy();
    return envMapFBO;
}

function getEnvmapPixels(regl, cubemap, envCubeSize) {
    const drawCube = regl({
        frag : skyboxFrag,
        vert : cubemapVS,
        attributes : {
            'aPosition' : cubeData.vertices
        },
        uniforms : {
            'projMatrix' : regl.context('projMatrix'),
            'viewMatrix' :  regl.context('viewMatrix'),
            'cubeMap' : cubemap,
            'environmentExposure': 1,
            'bias': 0,
            'size': envCubeSize,
            'hsv': [0, 0, 0]
        },
        elements : cubeData.indices
    });
    const faces = [];
    const tmpFBO = regl.framebuffer(envCubeSize);
    renderToCube(regl, tmpFBO, drawCube, {
        size : envCubeSize
    }, function (/* context, props, batchId */) {
        const pixels = regl.read();
        faces.push(new pixels.constructor(pixels));
    });
    drawCube.destroy();
    tmpFBO.destroy();
    return faces;
}

/**
 * Create a texture cube map from an equirectangular texture
 * @param {REGL} regl - regl reference
 * @param {REGLTexture} texture - a regl texture
 * @param {Number} [size=512] - size of the cubemap, 512 by default
 */
function createEquirectangularMapCube(regl, texture, size, rgbm) {
    size = size || 512;
    const drawCube = regl({
        frag : rgbm ? '#define INPUT_RGBM 1\n' + equirectangularMapFS : equirectangularMapFS,
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

    const color = regl.cube({
        width: size,
        height: size,
        min: 'linear',
        mag: 'linear',
        format: 'rgba',
    });
    const envMapFBO = regl.framebufferCube({
        radius: size,
        color
    });

    renderToCube(regl, envMapFBO, drawCube);
    drawCube.destroy();
    return envMapFBO;
}

function createPrefilterMipmap(regl, fromCubeMap, rgbmRange, SIZE, sampleSize, roughnessLevels) {
    //1. 生成NormalDistribution采样的LUT
    sampleSize = sampleSize || 1024;
    roughnessLevels = roughnessLevels || 256;

    const distro = generateNormalDistribution(sampleSize, roughnessLevels);

    const distributionMap = regl.texture({
        data: distro,
        width: roughnessLevels,
        height: sampleSize,
        min: 'nearest',
        mag: 'nearest'
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
            'roughness' : regl.prop('roughness'),
            'resolution': SIZE,
            'rgbmRange': rgbmRange || 7
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

    const color = regl.texture({
        radius : SIZE,
        min : 'linear',
        mag : 'linear',
    });
    const tmpFBO = regl.framebuffer({
        radius: SIZE,
        color
    });

    const maxLevels = Math.log(size) / Math.log(2);//log2(SIZE); //fix to 4

    //手动构造prefilterMap各mipmap level的数据
    const mipmap = [];
    for (let i = 0; i <= maxLevels; i++) {
        const roughness = i / (maxLevels - 1);
        let faceId = 0;
        //分别绘制六个方向，读取fbo的pixel，作为某个方向的mipmap级别数据
        renderToCube(regl, tmpFBO, drawCube, {
            roughness: roughness,
            size : size
        }, function (/* context, props, batchId */) {
            const pixels = regl.read({ framebuffer: tmpFBO });
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
        //下一个mipmap level
        size /= 2;
        tmpFBO.resize(size);
    }
    distributionMap.destroy();
    tmpFBO.destroy();
    drawCube.destroy();
    return mipmap;
}

//因webgl限制，framebufferTexImage2D无法指定mip level
//故改用以下步骤生成:
//参考代码：
//https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/6.pbr/2.2.2.ibl_specular_textured/ibl_specular_textured.cpp#L290
//https://github.com/vorg/pragmatic-pbr/blob/master/local_modules/prefilter-cubemap/index.js
function createPrefilterCube(regl, fromCubeMap, rgbmRange, SIZE, sampleSize, roughnessLevels) {
    //基于rgbm格式生成mipmap
    // const faces = getEnvmapPixels(regl, fromCubeMap, fromCubeMap.width);
    // const mipmapCube = regl.cube({
    //     faces,
    //     min : 'linear mipmap linear',
    //     mag : 'linear',
    //     width: fromCubeMap.width,
    //     height: fromCubeMap.height,
    //     mipmap: true
    // });

    const mipmap = createPrefilterMipmap(regl, fromCubeMap, rgbmRange, SIZE, sampleSize, roughnessLevels);
    // debugger
    const prefilterMap = regl.cube({
        radius : SIZE,
        min : 'linear mipmap linear',
        mag : 'linear',
        faces : mipmap
    });
    // mipmapCube.destroy();
    return { prefilterMap, prefilterMipmap: mipmap };
}

const quadVertices = new Int8Array([
    // positions     // texture Coords
    -1.0,  1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0,  1.0, 0.0,
    1.0, -1.0, 0.0,
]);
const quadTexcoords = new Int8Array([
    0.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0,
]);

export function generateDFGLUT(regl, size, sampleSize, roughnessLevels) {
    size = size || 256;
    sampleSize = sampleSize || 1024;
    roughnessLevels = roughnessLevels || 256;

    const distro = generateNormalDistribution(sampleSize, roughnessLevels);

    // const type = regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
    const distributionMap = regl.texture({
        data : distro,
        width : roughnessLevels,
        height : sampleSize,
        min : 'nearest',
        mag : 'nearest'
    });

    const quadBuf = regl.buffer(quadVertices);
    const quadTexBuf = regl.buffer(quadTexcoords);
    const fbo = regl.framebuffer({
        radius : size,
        colorType: 'uint8',
        colorFormat: 'rgba',
        min : 'linear',
        mag : 'linear'
    });
    // const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    const drawLUT = regl({
        frag : dfgFS,
        vert : dfgVS,
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

    drawLUT.destroy();
    quadBuf.destroy();
    quadTexBuf.destroy();
    distributionMap.destroy();

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

            const v0 = sinTheta * Math.cos(phi);
            const v1 = sinTheta * Math.sin(phi);
            pixels[offset] = Math.abs(v0 * 255);
            pixels[offset + 1] = Math.abs(v1 * 255);
            pixels[offset + 2] = cosTheta * 255;
            //在第四位中保留x和y的符号（z永远是正数），算法如下：
            //200 *（x > 0 ? 1 : 0) + 55 * (y > 0 ? 1 : 0)
            //所以片元着色器中 distro.w > 0.5时，x一定为正数
            // (distro.w - 200 / 255 * (x > 0 ? 1 : 0)) > 0.15 时，y一定为正数，55/255 = 0.21，取值0.15是为了避免误差
            pixels[offset + 3] = (v0 > 0 ? 200 : 0) + (v1 > 0 ? 55 : 0);
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
