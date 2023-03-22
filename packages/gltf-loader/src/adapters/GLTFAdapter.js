import { isDataUri, dataUriToArrayBuffer } from '../common/Util.js';
import Ajax from '../core/Ajax';

export default class GLTFAdapter {
    constructor(requestImage, decoders, supportedFormats) {
        this._requestImage = requestImage;
        this.decoders = decoders;
        this._supportedFormats = supportedFormats;
        this.images = {};
        this._imgRequests = {};
    }

    // only for GLTF 2.0
    requestImageFromBufferURI(buffer, bufferView, source) {
        //如果请求过
        if (this.buffers[buffer.id]) {
            const bufferData = this.buffers[buffer.id];
            const dataview = this._createDataView(bufferView, bufferData);
            return this.getImageByBuffer(dataview, source);
        }
        if (this._imgRequests[buffer.id]) {
            return this._imgRequests[buffer.id].then(() => {
                const bufferData = this.buffers[buffer.id];
                const dataview = this._createDataView(bufferView, bufferData);
                return this.getImageByBuffer(dataview, source);
            });
        }
        if (isDataUri(buffer.uri)) {
            const bufferData = this.buffers[buffer.id] = dataUriToArrayBuffer(buffer.uri);
            const dataview = this._createDataView(bufferView, bufferData);
            return this.getImageByBuffer(dataview, source);
        }
        const promise = this._imgRequests[buffer.id] = Ajax.getArrayBuffer(buffer.uri, null).then(response => {
            const bufferData = this.buffers[buffer.id] = response.data;
            const dataview = this._createDataView(bufferView, bufferData);
            return this.getImageByBuffer(dataview, source);
        });
        return promise;
    }

    getImageByBuffer(dataview, source) {
        if (this.images[source.id]) {
            return Promise.resolve(this.images[source.id]);
        }
        //如果运行在webworker进程中，需要将dataview丢到主线程中去处理图像数据
        const decoders = this.decoders;
        if (decoders[source.mimeType]) {
            return decoders[source.mimeType](dataview, { supportedFormats: this._supportedFormats });
        } else if (source.mimeType === 'image/crn' || source.mimeType === 'image/ktx2' || source.mimeType === 'image/cttf') {
            console.warn('missing transcoder for ' + source.mimeType, ', visit https://maptalks.com/docs/transcoders for details');
            return Promise.resolve(null);
        } else {
            const blob = new Blob([dataview], { type: source.mimeType });
            const sourceURI = URL.createObjectURL(blob);
            return this._getImageInfo(source.id, sourceURI);
        }
    }

    requestExternalImage(source) {
        if (this.images[source.id]) {
            return Promise.resolve(this.images[source.id]);
        }
        // TODO: 不用xhr处理base64的image.uri
        const url = source.uri.indexOf('data:image/') === 0 ? source.uri : this.rootPath + '/' + source.uri;
        if (this._imgRequests[source.id]) {
            // a promise already created
            return this._imgRequests[source.id].then(() => {
                return this.images[source.id];
            });
        }
        const promise = this._imgRequests[source.id] = this._getImageInfo(source.id, url);
        return promise;
    }

    //获取图片的高、宽、数据等信息
    _getImageInfo(key, url) {
        return new Promise((resolve, reject) => {
            this._requestImage(url, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                URL.revokeObjectURL(url);
                this.images[key] = result;
                resolve(this.images[key]);
            });
        });
    }
}
