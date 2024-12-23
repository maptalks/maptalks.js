import {
  Class,
  Coordinate,
  Eventable,
  Handlerable,
  Polygon,
  DrawToolLayer,
} from "@maptalks/map";

interface VideoSurfaceOptions {
  url?: string;
  opacity?: number;
  visible?: boolean;
  elementId?: string;
}

const options = {
  opacity: 1.0,
  visible: true,
};

export default class VideoSurface extends Eventable(Handlerable(Class)) {
  options: VideoSurfaceOptions;
  video: any;
  _coordinates: Coordinate[];
  _videoState: string;
  _layer: any;
  _editHelpLayer: any;
  _videoId: number;
  _editHelpPolygon: any;

  constructor(coordinates: Coordinate[], options: VideoSurfaceOptions) {
    super(options);
    this.setCoordinates(coordinates);
    this._createVideo();
  }

  /**
   * 设置 VideoSurface 坐标
   *
   * @english
   * Set coordinates of VideoSurface
   * @param coordinates - coordinates
   * @return void
   */
  setCoordinates(coordinates: Coordinate[]) {
    this._coordinates = coordinates;
  }

  /**
   * 获取 VideoSurface 坐标
   *
   * @english
   * Get coordinates of VideoSurface
   * @return coordinates
   */
  getCoordinates() {
    return this._coordinates;
  }

  /**
   * 设置视频地址
   *
   * @english
   * Set video url
   * @param url - url of video
   * @return void
   */
  setVideo(url: string) {
    this._videoState = "stop";
    this.options.url = url;
    delete this.options.elementId;
    this._createVideo();
  }

  /**
   * 设置HTML元素id
   *
   * @english
   * Set HTML element id
   * @param url - id of HTML element
   * @return void
   */
  setElementId(elementId: string) {
    this._videoState = "stop";
    this.options.elementId = elementId;
    delete this.options.url;
    this._createVideo();
  }

  _createVideo() {
    this._videoState = "stop";
    const url = this.options.url;
    const id = this.options.elementId;
    let video: any = document.getElementById(id);
    if (url) {
      //有url,优先使用url
      video = document.createElement("video");
      (video as any).src = url;
    }
    if (!video) {
      throw new Error("there is no element or url setting for video mask");
    }
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.play();
    video.addEventListener("playing", () => {
      this._videoState = "playing";
      this.fire("playing", { state: this._videoState, url });
    });
    video.addEventListener("pause", () => {
      this._videoState = "pause";
      this.fire("pause", { state: this._videoState, url });
    });
    video.addEventListener("error", () => {
      this._videoState = "pause";
      this.fire("error", { state: this._videoState, url });
      throw new Error("video resource load error");
    });
    this.video = video;
  }

  /**
   * 获取当前video
   *
   * @english
   * Get the video
   * @return video
   */
  getVideo() {
    return this.video;
  }

  _setVideoId(videoId: number) {
    this._videoId = videoId;
  }

  _getVideoId() {
    return this._videoId;
  }

  /**
   * 添加到图层
   *
   * @english
   * Add this surface to a video layer
   * @param layer - video layer
   * @return this
   */
  addTo(layer: any) {
    if (this._layer) {
      throw new Error(
        "VideoSurface cannot be added to two or more layers at the same time."
      );
    }
    layer.addSurfaces(this);
    return this;
  }

  /**
   * 显示视频
   *
   * @english
   * Show the video surface
   * @return this
   */
  show() {
    this.options.visible = true;
    return this;
  }

  /**
   * 隐藏视频
   *
   * @english
   * Add the video surface
   * @return this
   */
  hide() {
    this.options.visible = false;
    return this;
  }

  /**
   * 当前视频是否可见
   *
   * @english
   * Is the current video visible
   * @return visible
   */
  isVisible() {
    return this.options.visible;
  }

  /**
   * 播放视频
   *
   * @english
   * Play the video
   * @return void
   */
  play() {
    if (this.video) {
      this.video.play();
    }
  }

  /**
   * 暂停视频
   *
   * @english
   * Pause the video
   * @return void
   */
  pause() {
    if (this.video) {
      this.video.pause();
    }
  }

  setAudio(audio: any) {
    this.video.muted = audio;
  }

  /**
   * 设置视频透明度
   *
   * @english
   * Set the opacity of video
   * @return void
   */
  setOpacity(opacity: number) {
    this.options.opacity = opacity;
  }

  /**
   * 获取视频透明度
   *
   * @english
   * Get the opacity of video
   * @return opacity
   */
  getOpacity() {
    return this.options.opacity;
  }

  /**
   * 删除视频
   *
   * @english
   * Delete current video and end edit
   * @return void
   */
  remove() {
    delete this.video;
    const layer = this.getLayer();
    if (layer) {
      layer.removeVideoSurfaces(this);
    }
    this.endEdit();
  }

  /**
   * 获取所属图层
   *
   * @english
   * Get the layer of this surface
   * @return layer
   */
  getLayer() {
    return this._layer;
  }

  _canDrawing() {
    return this._videoState === "playing";
  }

  /**
   * 编辑视频
   *
   * @english
   * Edit the video
   * @return void
   */
  startEdit() {
    const layer = this.getLayer();
    if (!layer) {
      console.warn("videosurface should be added to a map before edit");
      return;
    }
    const map = layer.getMap();
    if (!map) {
      console.warn("videosurface should be added to a map before edit");
      return;
    }
    this._clearEditHelper();
    if (!this._editHelpLayer) {
      const layerId = layer.getId();
      this._editHelpLayer = new DrawToolLayer(`internal_${layerId}_edit`).addTo(map);
    }
    const coordinates = this.getCoordinates();
    this._editHelpPolygon = new Polygon(coordinates, {
      symbol: {
        lineColor: "#34495e",
        lineWidth: 2,
        polygonFill: "rgb(135,196,240)",
        polygonOpacity: 0.1,
      },
    }).addTo(this._editHelpLayer);
    this._editHelpPolygon.startEdit({
      newVertexHandleSymbol: {
        polygonFill: "rgba(0, 0, 0, 0)",
        polygonOpacity: 0.0,
        markerType: "ellipse",
        markerWidth: 1,
        markerHeight: 1,
      },
    });
    this._editHelpPolygon.on(
      "shapechange",
      (e) => {
        const coordinates = e.target.getCoordinates()[0].slice(0, 4);
        const positions = coordinates.map((coord) => {
          return [coord.x, coord.y, 0.0];
        });
        this.setCoordinates(positions);
        const renderer = layer.getRenderer();
        renderer._updateCoordinates(this);
      },
      this
    );
  }

  /**
   * 退出编辑
   *
   * @english
   * End edit
   * @return void
   */
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
