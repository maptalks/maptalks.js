import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend } from '../Util';

export default class BasicPainter extends Painter {
    createGeometry(glData, features) {
        const packs = glData.packs;
        if (!packs || !packs.length) {
            return [];
        }
        const regl = this.regl;
        let iconAtlas, glyphAtlas;
        if (glData.iconAtlas) {
            const image = glData.iconAtlas.image;
            iconAtlas = regl.texture({
                width : image.width,
                height : image.height,
                data : image.data,
                format : image.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }
        if (glData.glyphAtlas) {
            const sdf = glData.glyphAtlas.image;
            glyphAtlas = regl.texture({
                width : sdf.width,
                height : sdf.height,
                data : sdf.data,
                format : sdf.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }

        const geometries = [];
        for (let i = 0; i < packs.length; i++) {
            const data = extend({}, packs[i].data);
            data.aPickingId = data.featureIndexes;
            delete data.featureIndexes;
            const geometry = new reshader.Geometry(data, packs[i].indices, 0, { positionSize : 3 });
            geometry.properties = {
                features,
                iconAtlas,
                glyphAtlas
            };
            geometries.push(geometry);
        }
        return geometries;
    }
}
