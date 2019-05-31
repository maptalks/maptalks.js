import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend } from '../Util';

export default class BasicPainter extends Painter {
    createGeometry(glData) {
        if (!glData) {
            return null;
        }
        const regl = this.regl;
        let iconAtlas, glyphAtlas;
        if (glData.iconAtlas) {
            const repeatMode = (glData.type !== 'point') ? 'repeat' : 'clamp';
            const image = glData.iconAtlas.image;
            iconAtlas = regl.texture({
                width: image.width,
                height: image.height,
                data: image.data,
                format: image.format,
                wrapS: repeatMode,
                wrapT: repeatMode,
                mag: 'linear', //very important
                min: 'linear', //very important
                flipY: false,
            });
        }
        if (glData.glyphAtlas) {
            const sdf = glData.glyphAtlas.image;
            glyphAtlas = regl.texture({
                width: sdf.width,
                height: sdf.height,
                data: sdf.data,
                format: sdf.format,
                mag: 'linear', //very important
                min: 'linear', //very important
                flipY: false,
            });
        }

        const data = extend({}, glData.data);
        data.aPickingId = data.featureIndexes;
        delete data.featureIndexes;
        const geometry = new reshader.Geometry(data, glData.indices, 0, { positionSize: 3 });
        geometry.properties = {
            iconAtlas,
            glyphAtlas
        };

        return geometry;
    }
}
