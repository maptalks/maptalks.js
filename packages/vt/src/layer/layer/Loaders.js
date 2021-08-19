import { reshader } from '@maptalks/gl';
import Ajax from '../../worker/util/Ajax';

export function loadAmbientTexture(res, regl) {
    let promise;
    if (Array.isArray(res.url)) {
        promise = Promise.all(res.url.map(url => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                reject(img);
            };
            img.src = url;
        })));
    } else {
        promise = new Promise((resolve, reject) => {
            Ajax.getArrayBuffer(res.url, (err, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buffer);
                }
            });
        }).then(buffer => {
            const data = reshader.HDR.parseHDR(buffer.data);
            return regl.texture({
                data: data.pixels,
                width: data.width,
                height: data.height,
                arrayBuffer: true,
                hdr: true,
                type: 'float',
                format: 'rgba',
                flipY: true
            });
        });
    }

    return promise.then(images => {
        const maps = reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: images,
            ignoreSH: !!res['sh'],
            envCubeSize: 32,
            prefilterCubeSize: 32
        });
        const dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(regl);
        if (res['sh']) {
            maps['sh'] = res['sh'];
        }
        maps['dfgLUT'] = dfgLUT;
        if (images.destroy) {
            images.destroy();
        }
        return maps;
    });
}
