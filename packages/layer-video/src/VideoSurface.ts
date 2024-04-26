import { Class, Eventable, Handlerable, Polygon, VectorLayer } from 'maptalks';

const options = {
    opacity: 1.0,
    visible: true
};

export default class VideoSurface extends Eventable(Handlerable(Class)) {
    constructor(coordinates, options) {
        super(options);
        this.setCoordinates(coordinates);
        this._createVideo(this.options.url);
    }

    setCoordinates(coordinates) {
        this._coordinates = coordinates;
    }

    getCoordinates() {
        return this._coordinates;
    }

    setVideo(url) {
        this._videoState = 'stop';
        this.options.url = url;
        delete this.options.elementId;
        this._createVideo();
    }

    setElementId(elementId) {
        this._videoState = 'stop';
        this.options.elementId = elementId;
        delete this.options.url;
        this._createVideo();
    }

    _createVideo() {
        this._videoState = 'stop';
        const url = this.options.url;
        const id = this.options.elementId;
        let video = document.getElementById(id);
        if (url) { //有url,优先使用url
            video = document.createElement('video');
            video.src = url;
        }
        if (!video) {
            throw new Error('there is no element or url setting for video mask');
        }
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.play();
        video.addEventListener('playing', () => {
            this._videoState = 'playing';
            this.fire('playing', { state: this._videoState, url });
        });
        video.addEventListener('pause', () => {
            this._videoState = 'pause';
            this.fire('pause', { state: this._videoState, url });
        });
        video.addEventListener('error', () => {
            this._videoState = 'pause';
            this.fire('error', { state: this._videoState, url });
            throw new Error('video resource load error');
        });
        this.video = video;
    }

    getVideo() {
        return this.video;
    }

    _setVideoId(videoId) {
        this._videoId = videoId;
    }

    _getVideoId() {
        return this._videoId;
    }

    addTo(layer) {
        if (this._layer) {
            throw new Error('VideoSurface cannot be added to two or more layers at the same time.');
        }
        layer.addSurfaces(this);
        return this;
    }

    show() {
        this.options.visible = true;
        return this;
    }

    hide() {
        this.options.visible = false;
        return this;
    }

    isVisible() {
        return this.options.visible;
    }

    play() {
        if (this.video) {
            this.video.play();
        }
    }

    pause() {
        if (this.video) {
            this.video.pause();
        }
    }

    setAudio(audio) {
        this.video.muted = audio;
    }

    setOpacity(opacity) {
        this.options.opacity = opacity;
    }

    getOpacity() {
        return this.options.opacity;
    }

    remove() {
        delete this.video;
        const layer = this.getLayer();
        if (layer) {
            layer.removeVideoSurfaces(this);
        }
        this.endEdit();
    }

    getLayer() {
        return this._layer;
    }

    _canDrawing() {
        return this._videoState === 'playing';
    }

    startEdit() {
        const layer = this.getLayer();
        if (!layer) {
            console.warn('videosurface should be added to a map before edit');
            return;
        }
        const map = layer.getMap();
        if (!map) {
            console.warn('videosurface should be added to a map before edit');
            return;
        }
        this._clearEditHelper();
        if (!this._editHelpLayer) {
            const layerId = layer.getId();
            this._editHelpLayer = new VectorLayer(`internal_${layerId}_edit`, {
                enableAltitude: true
            }).addTo(map);
        }
        const coordinates = this.getCoordinates();
        this._editHelpPolygon = new Polygon(coordinates, {
            symbol: {
                'lineColor' : '#34495e',
                'lineWidth' : 2,
                'polygonFill' : 'rgb(135,196,240)',
                'polygonOpacity' : 0.1
            }
        }).addTo(this._editHelpLayer);
        this._editHelpPolygon.startEdit({
            newVertexHandleSymbol: {
                'polygonFill' : 'rgba(0, 0, 0, 0)',
                'polygonOpacity' : 0.0,
                'markerType': 'ellipse',
                'markerWidth': 1,
                'markerHeight': 1
            }
        });
        this._editHelpPolygon.on('shapechange', e => {
            const coordinates = e.target.getCoordinates()[0].slice(0, 4);
            const positions = coordinates.map(coord => {
                return [coord.x, coord.y, 0.0];
            });
            this.setCoordinates(positions);
            const renderer = layer.getRenderer();
            renderer._updateCoordinates(this);
        }, this);
    }

    endEdit() {
        if (this._editHelpLayer) {
            this._editHelpPolygon.endEdit();
            this._editHelpPolygon.remove();
            this._editHelpLayer.remove();
        }
        delete this._editHelpLayer;
        delete this._editHelpPolygon;
    }

    _clearEditHelper() {
        if (this._editHelpLayer) {
            this._editHelpLayer.clear();
        }
        delete this._editHelpPolygon;
    }
}

VideoSurface.mergeOptions(options);
