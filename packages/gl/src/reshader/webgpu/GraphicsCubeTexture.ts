import GraphicsTexture from "./GraphicsTexture";

export default class GraphicsCubeTexture extends GraphicsTexture {

    get arrayLayers() {
        return 6;
    }

    getMipLevelCount() {
        const data = this.config.faces && this.config.faces[0];
        if (data && data.mipmap) {
            return data.mipmap.length;
        }
        return 1;
    }

    fillData(texture, width, height) {
        const config = this.config;
        if (config.faces) {
            for (let i = 0; i < 6; i++) {
                const data = config.faces[i];
                const origin = [0, 0, i];
                if (this.isArrayData(data)) {
                    this.fillArrayData(texture, data, width, height, origin);
                } else {
                    this.fillImageData(texture, data, width, height, origin);
                }
            }

        }
    }
}
