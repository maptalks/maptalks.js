import * as maptalks from "maptalks";

import { LayerIdentifyOptionsType, OverlayLayerOptionsType } from "maptalks/dist/layer/OverlayLayer";
import { extend } from "../../common/Util";

const defaultOptions = {
  picking: true,
  pickingPoint: true,
  renderer: "gl",
  collision: false,
  collisionBufferSize: 0,
  textGamma: 1,
  geometryEvents: true,
  styleScale: 1,
  forceRenderOnZooming: true,
  forceRenderOnMoving: true,
  forceRenderOnRotating: true,
  meshRenderOrder: 0,
  enableBloom: false,
  enableAltitude: true,
  workarounds: {
    //#94, text rendering crashes on windows with intel gpu
    "win-intel-gpu-crash": true,
  },
};

const VECTOR_TILE_SIZE = new maptalks.Size(1, 1);

class Vector3DLayer extends maptalks.OverlayLayer {
  private _urlModifier: Function;
  private _polygonOffset: number;
  private _totalPolygonOffset: number;

  static registerPainter(name: string, clazz: unknown) {
    if (!(Vector3DLayer as any).painters) {
      (Vector3DLayer as any).painters = {};
    }
    (Vector3DLayer as any).painters[name] = clazz;
  }

  static get3DPainterClass(name: string) {
    return (Vector3DLayer as any).painters[name];
  }

  setURLModifier(modifier: Function) {
    this._urlModifier = modifier;
    return this;
  }

  getURLModifier() {
    return this._urlModifier;
  }

  getEvents() {
    let events;
    //@ts-expect-error
    if (super.getEvents) {
      //@ts-expect-error
      events = super.getEvents();
    } else {
      events = {};
    }
    events["spatialreferencechange"] = this._onSpatialReferenceChange;
    return events;
  }

  onConfig(conf: unknown) {
    super.onConfig(conf);
    if (conf["enableBloom"] !== undefined) {
      const renderer: Record<string, any> = this.getRenderer();
      if (renderer) {
        renderer.updateBloom(conf["enableBloom"]);
      }
    }
  }

  // constructor(...args) {
  //     super(...args);
  //     if (!this.options.sceneConfig) {
  //         this.options.sceneConfig = {};
  //     }
  //     if (isNil(this.options.sceneConfig.blendSrc)) {
  //         this.options.sceneConfig.blendSrc = 'one';
  //     }
  // }

  updateSymbol(idx: number, symbol: Record<string, any>) {
    if (!this.options.style) {
      throw new Error("can't call update symbol when style is not set");
    }
    const styles = Array.isArray(this.options.style)
      ? this.options.style
      : this.options.style.style;
    if (!styles[idx]) {
      throw new Error(`invalid style at ${idx}`);
    }
    extend(styles[idx].symbol, symbol);
    this.setStyle(this.options.style);
    return this;
  }

  /**
   * 获取图层的polygonOffsetCount
   * 用于GroupGLLayer全局管理polygonOffset
   */
  getPolygonOffsetCount() {
    return this.isEmpty() ? 0 : this.options["altitude"] ? 0 : 1;
  }

  /**
   * 获取图层的polygonOffset
   * 用于GroupGLLayer全局管理polygonOffset
   */
  getPolygonOffset() {
    return this.options["altitude"] ? 0 : this._polygonOffset || 0;
  }

  setPolygonOffset(offset: number, total: number) {
    this._polygonOffset = offset;
    this._totalPolygonOffset = total;
    return this;
  }

  getTotalPolygonOffset() {
    return this._totalPolygonOffset;
  }

  /**
   * Identify the geometries on the given coordinate
   * @param  {maptalks.Coordinate} coordinate   - coordinate to identify
   * @param  {Object} [options=null]  - options
   * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
   * @param  {Object} [options.count=null]  - result count
   * @return {Geometry[]} geometries identified
   */
  identify(
    coordinate: maptalks.Coordinate,
    options: LayerIdentifyOptionsType = {}
  ): maptalks.Geometry[] {
    const map = this.getMap();
    const renderer = this.getRenderer();
    if (!map || !renderer) {
      return [];
    }
    const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
    return this.identifyAtPoint(cp, options);
  }

  /**
   * Identify the geometries on the given container point
   * @param  point   - point to identify
   * @param  [options=null]  - options
   * @param  [options.tolerance=0] - identify tolerance in pixel
   * @param  [options.count=null]  - result count
   * @return geometries identified
   */
  identifyAtPoint(
    point: maptalks.Point,
    options: { tolerance?: number; count?: number, filter?: (picked: any) => boolean } = {}
  ): any[] {
    const map = this.getMap();
    const renderer: Record<string, any> = this.getRenderer();
    if (!map || !renderer) {
      return [];
    }
    const dpr = this.getMap().getDevicePixelRatio();
    const results = renderer.pick(point.x * dpr, point.y * dpr, options);
    if (options && options.filter) {
      return results.filter(g => options.filter(g));
    } else {
      return results;
    }
  }

  getComputedStyle() {
    return {
      style: this.getStyle() || [],
    };
  }

  outlineAll() {
    const renderer: Record<string, any> = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outlineAll();
    return this;
  }

  outline(geoIds: string[]) {
    if (!Array.isArray(geoIds) || !geoIds.length) {
      return this;
    }
    const renderer: Record<string, any> = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outline(geoIds);
    return this;
  }

  cancelOutline() {
    const renderer: Record<string, any> = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.cancelOutline();
    return this;
  }

  /**
   * Export the Layer's JSON. <br>
   * @return {Object} layer's JSON
   */
  toJSON(): any {
    const profile: any = {
      type: this.getJSONType(),
      id: this.getId(),
      options: this.config(),
    };
    profile.geometries = [];
    const geometries = this.getGeometries();
    for (let i = 0, len = geometries.length; i < len; i++) {
      const geo = geometries[i];
      const json = geo.toJSON();
      profile.geometries.push(json);
    }
    return profile;
  }

  getTileSize() {
    // default tile size for painters
    return VECTOR_TILE_SIZE;
  }

  _onSpatialReferenceChange() {
    const renderer: Record<string, any> = this.getRenderer();
    if (!renderer) {
      return;
    }
    renderer._onSpatialReferenceChange();
  }
}

Vector3DLayer.mergeOptions(defaultOptions);

export default Vector3DLayer;
