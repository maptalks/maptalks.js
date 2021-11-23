import { extend, isNumber } from '../common/Util.js';
import { generateDFGLUT } from './PBRHelper.js';

export function loginIBLResOnCanvas(canvas, regl, map) {
    if (!canvas.dfgLUT) {
        canvas.dfgLUT = generateDFGLUT(regl);
        canvas.dfgLUT.mtkRefCount = 0;
        const listener = onUpdatelights.bind(this, canvas, regl);
        map.on('updatelights', listener);
        canvas._iblResListener = listener;
    }
    canvas.dfgLUT.mtkRefCount++;
    const lightManager = map.getLightManager();
    const resource = lightManager && lightManager.getAmbientResource();
    if (!resource) {
        return {
            dfgLUT: canvas.dfgLUT,
            iblTexes: null
        };
    }
    if (!canvas.iblTexes) {
        canvas.iblTexes = createIBLTextures(regl, map);
    }

    return {
        dfgLUT: canvas.dfgLUT,
        iblTexes: canvas.iblTexes
    };
}

export function getIBLResOnCanvas(canvas) {
    const { dfgLUT, iblTexes } = canvas;
    return {
        dfgLUT,
        iblTexes
    };
}

export function logoutIBLResOnCanvas(canvas, map) {
    let del = false;
    if (canvas.dfgLUT) {
        canvas.dfgLUT.mtkRefCount--;
        if (canvas.dfgLUT.mtkRefCount <= 0) {
            del = true;
            const listener = canvas._iblResListener;
            map.off('updatelights', listener);
            canvas.dfgLUT.destroy();
            delete canvas.dfgLUT;
        }
    }
    if (canvas.iblTexes && del) {
        disposeIBLTextures(canvas.iblTexes);
        delete canvas.iblTexes;
    }
}

function onUpdatelights(canvas, regl, e) {
    if (e.ambientUpdate) {
        const { iblTexes } = canvas;
        if (iblTexes) {
            const map = e.target;
            disposeIBLTextures(iblTexes);
            canvas.iblTexes = createIBLTextures(regl, map);
        } else {
            const map = e.target;
            canvas.iblTexes = createIBLTextures(regl, map);
        }
    }

}

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
    const iblMaps = lightManager && lightManager.getAmbientResource();
    const ambientLight = lightManager && lightManager.getAmbientLight() || {};
    const directionalLight = lightManager && lightManager.getDirectionalLight() || {};
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

    uniforms['light0_diffuse'] = [...(directionalLight.color || [1, 1, 1]), 1];
    uniforms['light0_viewDirection'] = directionalLight.direction || [1, 1, -1];
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
