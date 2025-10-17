import { Layer } from "maptalks";
import VideoLayerRenderer from "./VideoLayerRenderer";
import VideoSurface from "./VideoSurface";

export interface VideoLayerOptions {
  renderer?: "gl" | "canvas" | "dom";
  doubleBuffer?: boolean;
  glOptions?: unknown;
  markerEvents?: boolean;
  forceRenderOnZooming?: boolean;
  forceRenderOnMoving?: boolean;
  forceRenderOnRotating?: boolean;
  showTopAlways?: boolean;
  doubleSide?: boolean;
}

const options = {
  renderer: "gl",
  doubleBuffer: false,
  glOptions: null,
  markerEvents: true,
  forceRenderOnZooming: true,
  forceRenderOnMoving: true,
  forceRenderOnRotating: true,
  showTopAlways: true,
  doubleSide: true,
};

export type VideoLayerType = VideoLayer;

export default class VideoLayer extends Layer {
  _videoSurfaceMap = {};
  videoId = 0;
  options: VideoLayerOptions;

  constructor(
    id: string,
    videoSurfaces: VideoSurface | VideoSurface[],
    options: VideoLayerOptions
  ) {
    if (
      videoSurfaces &&
      !Array.isArray(videoSurfaces) &&
      !(videoSurfaces instanceof VideoSurface)
    ) {
      options = videoSurfaces;
      videoSurfaces = null;
    }
    super(id, options);
    this._videoSurfaceMap = {};
    this.videoId = 0;
    if (videoSurfaces) {
      this.addSurfaces(videoSurfaces);
    }
  }

  /**
   * 添加surfaces
   *
   * @english
   * Add video surfaces
   * @param videoSurfaces - one or more surfaces
   * @return void
   */
  addSurfaces(videoSurfaces: VideoSurface | VideoSurface[]) {
    if (!videoSurfaces) {
      return;
    }
    if (Array.isArray(videoSurfaces)) {
      videoSurfaces.forEach((videoSurface) => {
        (this as any).addMarker(videoSurface);
      });
    } else {
      videoSurfaces._layer = this;
      this._videoSurfaceMap[this.videoId] = videoSurfaces;
      videoSurfaces._setVideoId(this.videoId);
      const renderer = this.getRenderer();
      if (renderer) {
        if ((renderer as any)._getRegl()) {
          (renderer as any)._createScene(videoSurfaces);
        }
      } else {
        this.on("renderercreate", (e) => {
          if (e.renderer._getRegl()) {
            e.renderer._createScene(videoSurfaces);
          }
        });
      }
      this.videoId++;
    }
  }

  /**
   * 设置该图层是否显示在最上层
   *
   * @english
   * Set whether the layer is displayed on the top layer
   * @param always - always on the top
   * @return void
   */
  showTopAlways(always: boolean) {
    this.options.showTopAlways = always;
    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any)._updateShader();
    }
  }

  /**
   * 获取surfaces
   *
   * @english
   * Get video surfaces
   * @return surfaces
   */
  setDoubleSide(doubleSide: boolean) {
    this.options.doubleSide = doubleSide;
    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any)._updateShader();
    }
  }

  /**
   * 获取surfaces
   *
   * @english
   * Get video surfaces
   * @return surfaces
   */
  getVideoSurfaces() {
    const surfaceList = [];
    for (const s in this._videoSurfaceMap) {
      surfaceList.push(this._videoSurfaceMap[s]);
    }
    return surfaceList;
  }

  /**
   * 删除surfaces
   *
   * @english
   * Delete video surfaces
   * @param videoSurfaces - one or more surfaces
   * @return void
   */
  removeVideoSurfaces(videoSurfaces: VideoSurface | VideoSurface[]) {
    if (Array.isArray(videoSurfaces)) {
      videoSurfaces.forEach((videoSurface) => {
        this.removeVideoSurfaces(videoSurface);
      });
    } else {
      const videoId = videoSurfaces._getVideoId();
      const renderer = this.getRenderer();
      if (renderer) {
        (renderer as any)._deleteScene(videoId);
      }
      delete this._videoSurfaceMap[videoId];
    }
  }

  /**
   * 移除当前图层
   *
   * @english
   * Remove this layer
   * @return void
   */
  remove(): any {
    this.clear();
    super.remove();
  }

  /**
   * 清空已经添加的surfaces
   *
   * @english
   * Clear video surfaces
   * @return void
   */
  clear() {
    const surfaces = this.getVideoSurfaces();
    for (let i = 0; i < surfaces.length; i++) {
      surfaces[i].remove();
    }
  }
}

VideoLayer.mergeOptions(options);
VideoLayer.registerJSONType("VideoLayer");

VideoLayer.registerRenderer("gl", VideoLayerRenderer);
VideoLayer.registerRenderer("gpu", VideoLayerRenderer);
