import { extend, isNumber, isNil } from '../common/Util.js';

export function getPBRUniforms(map, iblTexes, dfgLUT, context) {
    const viewMatrix = map.viewMatrix;
    const projMatrix = map.projMatrix;
    const cameraPosition = map.cameraPosition;
    const canvas = map.getRenderer().canvas;
    const lightUniforms = getLightUniforms(map, iblTexes);
    const uniforms = extend({
        viewMatrix,
        projMatrix,
        projectionMatrix: projMatrix,
        projViewMatrix: map.projViewMatrix,
        uCameraPosition: cameraPosition,
        uGlobalTexSize: [canvas.width, canvas.height],
        uNearFar: [map.cameraNear, map.cameraFar]
    }, lightUniforms);
    uniforms['sIntegrateBRDF'] = dfgLUT;
    if (context && context.ssr && context.ssr.renderUniforms) {
        extend(uniforms, context.ssr.renderUniforms);
    }
    if (context && context.jitter) {
        uniforms['uHalton'] = context.jitter;
    } else {
        uniforms['uHalton'] = [0, 0];
    }
    return uniforms;
}

function getLightUniforms(map, iblTexes) {
    const lightManager = map.getLightManager();
    const iblMaps = lightManager.getAmbientResource();
    const ambientLight = lightManager.getAmbientLight();
    const directionalLight = lightManager.getDirectionalLight();
    let uniforms;
    if (iblMaps) {
        const cubeSize = iblTexes.prefilterMap.width;
        const mipLevel = Math.log(cubeSize) / Math.log(2);
        uniforms = {
            'sSpecularPBR': iblTexes.prefilterMap,
            'uDiffuseSPH': iblTexes.sh,
            'uTextureEnvironmentSpecularPBRLodRange': [mipLevel, mipLevel],
            'uTextureEnvironmentSpecularPBRTextureSize': [cubeSize, cubeSize],
        };
    } else {
        uniforms = {
            'uAmbientColor': ambientLight.color || [0.2, 0.2, 0.2]
        };
    }
    uniforms['uRGBMRange'] = iblMaps ? iblTexes.rgbmRange : 7;
    uniforms['uEnvironmentExposure'] = isNumber(ambientLight.exposure) ? ambientLight.exposure : 1; //2]

    if (directionalLight) {
        uniforms['uSketchfabLight0_diffuse'] = [...(directionalLight.color || [1, 1, 1]), 1];
        uniforms['uSketchfabLight0_viewDirection'] = directionalLight.direction || [1, 1, -1];
    }
    return uniforms;
}

export function createIBLTextures(regl, map) {
    const lightManager = map.getLightManager();
    const resource = lightManager.getAmbientResource();
    if (!resource) {
        return null;
    }
    const exposure = lightManager.getAmbientLight().exposure;
    return {
        'prefilterMap': regl.cube({
            width: resource.prefilterMap.width,
            height: resource.prefilterMap.height,
            faces: resource.prefilterMap.faces,
            min : 'linear mipmap linear',
            mag : 'linear',
            format: 'rgba',
            // mipmap: true
        }),
        'exposure': isNumber(exposure) ? exposure : 1,
        'sh': resource.sh,
        'rgbmRange': resource.rgbmRange
    };
}

export function disposeIBLTextures(iblTexes) {
    for (const p in iblTexes) {
        if (iblTexes[p].destroy) {
            iblTexes[p].destroy();
        }
        delete iblTexes[p];
    }
}
