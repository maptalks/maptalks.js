import * as reshader from '@maptalks/reshader.gl';
import Mask from './Mask';

export default class VideoMask extends Mask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'texture';
    }

    play() {
        if (this._video) {
            this._video.play();
        }
    }

    pause() {
        if (this._video) {
            this._video.pause();
        }
    }

    setAudio(audio) {
        if (this._video) {
            this.video.muted = audio;
        }
    }

    setUrl(url) {
        this.options.url = url;
        this._createVideo(url);
    }

    getState() {
        return this._videoState;
    }

    _createMesh(regl) {
        const { geometry, copyGeometry } = this._createGeometry(regl);
        const mesh = new reshader.Mesh(geometry);
        const videoTexture = this._createVideoTexture(regl);
        mesh.material = new reshader.Material({ maskTexture: videoTexture });
        this._setDefines(mesh);
        this._setLocalTransform(mesh);
        this._copyMesh = new reshader.Mesh(copyGeometry);
        this._setLocalTransform(this._copyMesh);
        return mesh;
    }

    _updateUniforms(mesh) {
        const maskMode = this._getMaskMode();
        mesh.setUniform('maskMode', maskMode);
        if (this._positions && this._positions.length) {
            for (let i = 0; i < 4; i++) {
                mesh.setUniform('mask_position' + i, this._positions.slice(i * 3, i * 3 + 3));
            }
        }
        const color = this._getMaskColor();
        mesh.setUniform('maskColor', color);
    }

    _setDefines(mesh) {
        const defines = mesh.getDefines();
        defines['HAS_TEXTURE'] = 1;
        mesh.setDefines(defines);
    }

    _createVideoTexture(regl) {
        this._createVideo();
        const videoTexture = regl.texture();
        return videoTexture;
    }


    _createVideo() {
        this._videoState = 'stop';
        const url = this.options.url;
        const id = this.options.elementId;
        let video = document.getElementById(id);
        if (url) {
            video = document.createElement('video');
            video.src = url;
        }
        if (!video) {
            throw new Error('there is no element or url setting for video mask');
        }
        video.autoplay = this.options.autoplay || true;
        video.loop = this.options.loop || true;
        video.muted = this.options.muted || true;
        video.play();
        video.addEventListener('playing', () => {
            this._videoState = 'playing';
        });
        video.addEventListener('pause', () => {
            this._videoState = 'pause';
        });
        this._video = video;
    }

    _update() {
        const mesh = this._mesh;
        if (!mesh) {
            return;
        }
        if (mesh.material) {
            const videoTexture = mesh.material.get('maskTexture');
            if (videoTexture && this._video && this._needUpdate()) {
                videoTexture(this._video);
            }
        }
    }

    _needUpdate() {
        return this._videoState === 'playing';
    }
}
