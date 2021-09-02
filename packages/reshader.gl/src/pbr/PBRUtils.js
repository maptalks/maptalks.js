import { extend, isNumber } from '../common/Util.js';

export function getPBRUniforms(map, iblTexes, dfgLUT, context) {
    const viewMatrix = map.viewMatrix;
    const projMatrix = map.projMatrix;
    const cameraPosition = map.cameraPosition;
    const canvas = map.getRenderer().canvas;
    const lightUniforms = getLightUniforms(map, iblTexes);
    const uniforms = extend({
        viewMatrix,
        projMatrix,
        projViewMatrix: map.projViewMatrix,
        cameraPosition: cameraPosition,
        outSize: [canvas.width, canvas.height],
        cameraNearFar: [map.cameraNear, map.cameraFar]
    }, lightUniforms);
    uniforms['brdfLUT'] = dfgLUT;
    if (context && context.ssr && context.ssr.renderUniforms) {
        extend(uniforms, context.ssr.renderUniforms);
    }
    if (context && context.jitter) {
        uniforms['halton'] = context.jitter;
    } else {
        uniforms['halton'] = [0, 0];
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
            'prefilterMap': iblTexes.prefilterMap,
            'diffuseSPH': iblTexes.sh,
            'prefilterMiplevel': [mipLevel, mipLevel],
            'prefilterSize': [cubeSize, cubeSize],
            'hdrHSV': ambientLight.hsv || [0, 0, 0]
        };
    } else {
        uniforms = {
            'ambientColor': ambientLight.color || [0.2, 0.2, 0.2]
        };
    }
    uniforms['rgbmRange'] = iblMaps ? iblTexes.rgbmRange : 7;
    uniforms['environmentExposure'] = isNumber(ambientLight.exposure) ? ambientLight.exposure : 1; //2]
    uniforms['environmentOrientation'] = ambientLight.orientation || 0;

    if (directionalLight) {
        uniforms['light0_diffuse'] = [...(directionalLight.color || [1, 1, 1]), 1];
        uniforms['light0_viewDirection'] = directionalLight.direction || [1, 1, -1];
    }
    return uniforms;
}

export function createIBLTextures(regl, map) {
    const lightManager = map.getLightManager();
    const resource = lightManager.getAmbientResource();
    if (!resource) {
        return null;
    }
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


export function isSupported(regl) {
    return regl.hasExtension('EXT_shader_texture_lod');
}
