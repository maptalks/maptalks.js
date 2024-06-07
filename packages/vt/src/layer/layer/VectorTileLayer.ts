import * as maptalks from "maptalks";

import type {
  BackgroundConfig,
  BackgroundStyle,
  VtBaseStyle,
  VtComposeStyle,
  VtDataConfig,
  VtSceneConfig,
  VtStyle,
  VtSymbol,
} from "../../types";
import { Color, PackUtil } from "@maptalks/vector-packer";
import { compress, uncompress } from "./Compress";
import { extend, hasOwn, isNil, isObject, isString } from "../../common/Util";

import Ajax from "../../worker/util/Ajax";
import type { PositionArray, TileLayerOptionsType } from "maptalks";
import VectorTileLayerRenderer from "../renderer/VectorTileLayerRenderer";
import { isFunctionDefinition } from "@maptalks/function-type";

const TMP_POINT = new maptalks.Point(0, 0);
const TMP_COORD = new maptalks.Coordinate(0, 0);
const EMPTY_ALTITUDE = [null, 0];
const ALTITUDE = [];


const defaultOptions: VectorTileLayerOptionsType = {
  urlTemplate: null,
  renderer: "gl",
  altitudeProperty: "altitude",
  forceRenderOnZooming: true,
  forceRenderOnMoving: true,
  forceRenderOnRotating: true,
  tileSize: [512, 512],
  features: false,
  schema: false,
  cascadeTiles: true,
  collision: true,
  collisionBuffserSize: 0,
  picking: true,
  pickingPoint: true,
  pickingGeometry: false,
  //每帧每个瓦片最多能绘制的sdf数量
  glyphSdfLimitPerFrame: 15,
  //zooming或zoom fading时，每个瓦片最多能绘制的box(icon或text)数量
  // boxLimitOnZoomout: 7,
  tileLimitPerFrame: 1,
  loadingLimitOnInteracting: 5,
  loadingLimit: 0,
  antialias: false,
  iconErrorUrl: null,
  collisionFrameLimit: 1.5,
  //是否开启无style时的默认绘制功能
  defaultRendering: true,
  //允许用户调整文字的gamma清晰度
  textGamma: 1,
  // altas中会在四周留一个像素的空隙，所以设为254，最大尺寸的icon也刚好存入256高宽的图片中
  maxIconSize: 254,
  workarounds: {
    //#94, text rendering crashes on windows with intel gpu
    // 2022-12-06, 用当前版本测试crash.html，已经不再崩溃，关闭该workaround, http://localhost/bugs/issue-175/webgl_crash/crash2.html
    "win-intel-gpu-crash": false,
  },
  pyramidMode: 1,
  styleScale: 1,
  enableAltitude: true,
  fadeAnimation: false,

  debugTileData: false,
  fetchOptions: null,
  awareOfTerrain: true,

  altitudeQueryTimeLimitPerFrame: 3,
  workerGlyph: true,

  // A property to use as a feature id (for feature state)
  // https://docs.mapbox.com/style-spec/reference/sources/#vector-promoteId
  featureIdProperty: null,
  currentTilesFirst: true,
};

/**
 * Style:
 * [
 *  {
 *     renderPlugin : { ... },
 *     filter : [],
 *     symbol : { ... }
 *  }
 * ]
 */
class VectorTileLayer extends maptalks.TileLayer {
  VERSION: string;
  ready: boolean;

  _polygonOffset: number;
  _pathRoot?: string;

  _featureStates: Record<string, Map<unknown, unknown>>;
  _featureStamp?: any;
  _schema: Record<number, object> = {};
  _originFeatureStyle?: VtComposeStyle;
  _featureStyle?: VtStyle[];
  _vtStyle?: VtBaseStyle[];
  _background?: BackgroundStyle;
  _backgroundConfig?: BackgroundConfig;
  _totalPolygonOffset?: number;
  _isDefaultRender?: boolean;
  _highlighted: any[];
  _replacer?: Function;
  _urlModifier?: Function;
  options: VectorTileLayerOptionsType;

  // create a layer instance from given json
  static loadFrom(url: string, fetchOptions: any) {
    return fetch(url, fetchOptions || {})
      .then((data) => {
        return data.json();
      })
      .then((json) => {
        return VectorTileLayer.fromJSON(json);
      });
  }

  constructor(id: string, options: VectorTileLayerOptionsType) {
    super(id, options);
    // if (options.spatialReference === undefined) {
    //     throw new Error(`options.spatialReference must be set for VectorTileLayer(${id}), possible values: null(using map's), preset-vt-3857, or a customized one.`);
    // }
    this.VERSION = (VectorTileLayer as any).VERSION;
    const style = options && options.style;
    this.setStyle(style);
  }

  /**
   * 设置url处理函数。
   *
   * @english
   * Set URL processing function.
   * @param modifier - URL processing function
   * @return this
   */
  setURLModifier(modifier: Function) {
    this._urlModifier = modifier;
    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any).updateOptions();
    }
    return this;
  }

  /**
   * 获取url处理函数。
   *
   * @english
   * Get URL processing function.
   * @return url modifier
   */
  getURLModifier() {
    return this._urlModifier;
  }

  onAdd() {
    const map = this.getMap();
    this._prepareOptions();
    const sr = this.getSpatialReference();
    const code = sr.toJSON().projection as string;
    const mapCode = map.getSpatialReference().toJSON().projection as string;
    if ((code && code.toLowerCase()) !== (mapCode && mapCode.toLowerCase())) {
      throw new Error(
        `VectorTileLayer's projection(${code}) must be the same with map(${mapCode}).`
      );
    }
  }

  /**
   * 设置数据状态。
   *
   * @english
   * Set state of feature.
   * @param source - layer source
   * @param state - feature state
   * @return this
   */
  setFeatureState(source: { id: string; layer: string }, state: unknown) {
    if (isNil(source.id)) {
      throw new Error("missing id in first parameter of setFeatureState.");
    }
    if (!this._featureStates) {
      this._featureStates = {};
    }
    const layer = source.layer || "0";
    let stateMap = this._featureStates[layer];
    if (!this._featureStates[layer]) {
      stateMap = this._featureStates[layer] = new Map();
    }
    stateMap.set(source.id, state);
    this._markFeatureState();
    return this;
  }

  /**
   * 删除数据状态。
   *
   * @english
   * Remove state of feature.
   * @param source - layer source
   * @param key - object key
   * @return this
   */
  removeFeatureState(
    source: { id: string; layer: string },
    key: string | number | object
  ) {
    if (isNil(source.id)) {
      throw new Error("missing id in first parameter of removeFeatureState.");
    }
    if (!this._featureStates) {
      return this;
    }
    const layer = source.layer || "0";
    const stateMap = this._featureStates[layer];
    if (!stateMap) {
      return this;
    }

    if (!key) {
      stateMap.delete(source.id);
    } else {
      const state = stateMap.get(source.id);
      if (isObject(key)) {
        for (const p in key as object) {
          delete state[p];
        }
      } else {
        delete state[key as string];
      }
      stateMap.set(source.id, state);
    }
    this._markFeatureState();
    return this;
  }

  /**
   * 获取数据状态。
   *
   * @english
   * Get state of feature.
   * @param source - layer source
   * @return feature state
   */
  getFeatureState(source: any) {
    if (isNil(source.id)) {
      throw new Error("missing id in first parameter of getFeatureState.");
    }
    if (!this._featureStates) {
      return null;
    }
    const layer = source.layer || "0";
    const stateMap = this._featureStates[layer];
    return stateMap.get(source.id);
  }

  _markFeatureState() {
    const renderer = this.getRenderer();
    if (!renderer) {
      return;
    }
    const timestamp = renderer.getFrameTimestamp();
    this._featureStamp = timestamp;
  }

  _getFeatureStateStamp() {
    return this._featureStamp;
  }

  _isFeatureStateDirty(timestamp: number) {
    return this._featureStamp && this._featureStamp !== timestamp;
  }

  _prepareOptions() {
    const options = this.options as any;
    const map = this.getMap();
    const projection = map.getProjection();
    const is4326 =
      projection.code === "EPSG:4326" || projection.code === "EPSG:4490";
    const is3857 = projection.code === "EPSG:3857";
    if (!options.spatialReference) {
      const tileSize = this.getTileSize().width;
      if (tileSize === 512) {
        if (is3857) {
          options.spatialReference = "preset-vt-3857";
        } else if (is4326) {
          options.spatialReference = "preset-vt-4326";
        }
      }
    }
    if (!options.tileSystem) {
      if (options.tms) {
        if (is3857) {
          options.tileSystem = [
            1,
            1,
            -6378137 * Math.PI,
            -6378137 * Math.PI,
          ];
        } else if (is4326) {
          options.tileSystem = [1, 1, -180, -90];
        }
      } else {
        if (is4326) {
          options.tileSystem = [1, -1, -180, 90];
        }
      }
    }
  }

  onWorkerReady() { }

  /**
   * 更新图层配置。
   *
   * @english
   * Update layer config.
   * @param conf - layer config
   * @return void
   */
  onConfig(conf: object) {
    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any).updateOptions(conf);
    }
  }

  /**
   * 获取worker参数。
   *
   * @english
   * Get worker options.
   * @return worker options
   */
  getWorkerOptions(): Record<string, any> {
    return {
      debug: (this.options as any)["debug"],
      debugTile: (this.options as any)["debugTile"],
      altitudeProperty: (this.options as any)["altitudeProperty"],
      tileSize: this.getTileSize().width,
      //default render时，this._vtStyle有可能被default render设值
      style: this.isDefaultRender()
        ? { style: [], featureStyle: [] }
        : this._getComputedStyle(),
      features:
        (this.options as any).debugTileData || (this.options as any).features,
      schema: (this.options as any).schema,
      pickingGeometry: (this.options as any)["pickingGeometry"],
      projectionCode: this.getSpatialReference().getProjection().code,
      workerGlyph:
        (this.options as any)["workerGlyph"] && !this.getURLModifier(),
      featureIdProperty: (this.options as any)["featureIdProperty"],
    };
  }

  /**
   * 设置图层样式。
   *
   * @english
   * Set the style of layer.
   * @param style - vt style object
   * @return this
   */
  setStyle(style: any) {
    if (style && (isString(style) || style.url)) {
      const url = style;
      const endIndex = url.lastIndexOf("/");
      const prefix = endIndex < 0 ? "." : url.substring(0, endIndex);
      const root = prefix;
      this.ready = false;
      Ajax.getJSON(
        style.url ? style.url : style,
        style.url ? style : {},
        (err, json) => {
          if (err) {
            this.setStyle([]);
            throw err;
          }
          let styleJSON;
          if (json.style) {
            styleJSON = json;
            if (!styleJSON["$root"]) {
              styleJSON["$root"] = root;
            }
          } else {
            styleJSON = {
              $root: root,
              style: json,
            };
          }
          (this.options as any)["style"] = url;
          this._setStyle(styleJSON);
        }
      );
      return this;
    }
    (this.options as any)["style"] = style;
    this._setStyle(style);
    return this;
  }

  _tilePointToPoint(out: any, point: any, tilePoint: any, extent: any) {
    const tileSize = this.getTileSize().width;
    const tileScale = extent / tileSize;
    const srcPoint = out.set(
      tilePoint.x + point.x / tileScale,
      tilePoint.y - point.y / tileScale
    );
    return srcPoint;
  }

  queryTilePointTerrain(
    point: any,
    terrainTileInfo: any,
    tilePoint: any,
    extent: any,
    res: any
  ) {
    const renderer = this.getRenderer();
    const terrainHelper = renderer && (renderer as any).getTerrainHelper();
    if (!renderer || !terrainHelper) {
      EMPTY_ALTITUDE[0] = null;
      EMPTY_ALTITUDE[1] = 0;
      return EMPTY_ALTITUDE;
    }
    const pointAtRes = this._tilePointToPoint(
      TMP_POINT,
      point,
      tilePoint,
      extent
    );
    if (terrainTileInfo && terrainHelper.queryTileTerrainByPointAtRes) {
      // faster
      return terrainHelper.queryTileTerrainByPointAtRes(
        pointAtRes,
        res,
        terrainTileInfo.id,
        terrainTileInfo,
        ALTITUDE
      );
    } else {
      EMPTY_ALTITUDE[0] = null;
      EMPTY_ALTITUDE[1] = 0;
      return EMPTY_ALTITUDE;
    }
  }

  queryTerrainTiles(tileInfo: object) {
    const renderer = this.getRenderer();
    const terrainHelper = renderer && (renderer as any).getTerrainHelper();
    if (!renderer || !terrainHelper) {
      return null;
    }
    return terrainHelper.getTerrainTiles(tileInfo);
  }

  _setStyle(style: any) {
    this._pathRoot = null;
    if (style && style["$root"]) {
      let root = style["$root"];
      if (root && root[root.length - 1] === "/") {
        root = root.substring(0, root.length - 1);
      }
      this._pathRoot = root;
      this._replacer = function replacer(match) {
        if (match === "{$root}") {
          return root;
        } /* else if (match === '{$iconset}') {
                    return iconset;
                }*/
        return null;
      };
    }
    this.ready = true;
    style = style || [];
    if (Array.isArray(style)) {
      style = { style };
    } else if (style.renderPlugin) {
      style = { style: [style] };
    }
    style = JSON.parse(JSON.stringify(style));
    style = uncompress(style);
    this._originFeatureStyle = style["featureStyle"] || [];
    this._featureStyle = parseFeatureStyle(style["featureStyle"]);
    this._vtStyle = style["style"] || [];
    const background = style.background || {};
    this._background = {
      enable: background.enable || false,
      color: unitColor(background.color) || [0, 0, 0, 0],
      opacity: getOrDefault(background.opacity, 1),
      patternFile: background.patternFile,
      depthRange: background.depthRange,
    };

    this.validateStyle();
    if (this._replacer) {
      this._parseStylePath();
    }
    this._compileStyle();
    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any).setStyle();
    }
    /**
     * setstyle event.
     *
     * @event VectorTileLayer#setstyle
     * @type {Object}
     * @property {String} type - setstyle
     * @property {VectorTileLayer} target - layer
     * @property {Object|Object[]} style - style to set
     */
    this.fire("setstyle", {
      style: this.getStyle(),
      computedStyle: this.getComputedStyle(),
    });
  }

  /**
   * 获取图层的polygonOffsetCount，用于GroupGLLayer全局管理polygonOffset。
   *
   * @english
   * Get the polygonOffsetCount of layer,used for GroupGLLayer global management of polygonOffset.
   * @return polygonOffsetCount
   */
  getPolygonOffsetCount() {
    const renderer = this.getRenderer();
    if (!renderer) {
      return 0;
    }
    return (renderer as any).getPolygonOffsetCount();
  }

  /**
   * 获取图层的polygonOffset，用于GroupGLLayer全局管理polygonOffset
   *
   * @english
   * Get the polygonOffset of layer,used for GroupGLLayer global management of polygonOffset
   * @return polygonOffset
   */
  getPolygonOffset() {
    return this._polygonOffset || 0;
  }

  /**
   * 设置图层的polygonOffset
   *
   * @english
   * Set the polygonOffset of layer
   * @return this
   */
  setPolygonOffset(offset: number, total?: number) {
    this._polygonOffset = offset;
    this._totalPolygonOffset = total;
    return this;
  }

  /**
   * 获取图层的polygonOffset总数。
   *
   * @english
   * Get the total polygonOffset of layer
   * @return total polygonOffset
   */
  getTotalPolygonOffset() {
    return this._totalPolygonOffset;
  }

  /**
   * 获取已经渲染的features。
   *
   * @english
   * Get rendered features of layer
   * @return rendered features
   */
  getRenderedFeatures() {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return [];
    }
    return renderer.getRenderedFeatures();
  }

  /**
   * 高亮整个图层
   *
   * @english
   * Outline the layer
   * @return this
   */
  outlineAll() {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outlineAll();
    return this;
  }

  /**
   * 高亮数据
   *
   * @english
   * Outline features
   * @param idx            - style index
   * @param featureIds     - feature ids
   * @return this
   */
  outline(idx: number, featureIds: number[]) {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outline(idx, featureIds);
    return this;
  }

  /**
   * 高亮数据
   *
   * @english
   * Outline features
   * @param idx  - style index
   * @return this
   */
  outlineBatch(idx: number) {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outlineBatch(idx);
    return this;
  }

  /**
   * 高亮数据
   *
   * @english
   * Outline features
   * @param featureIds     - feature ids
   * @return this
   */
  outlineFeatures(featureIds: number[]) {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.outlineFeatures(featureIds);
    return this;
  }

  /**
   * 取消高亮
   *
   * @english
   * Cancel outline
   * @return this
   */

  cancelOutline() {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.cancelOutline();
    return this;
  }

  highlight(highlights: any) {
    this._validateHighlight(highlights);
    const renderer = this.getRenderer();
    if (!renderer) {
      if (!this._highlighted) {
        this._highlighted = [];
      }
      this._highlighted.push(highlights);
      return this;
    }
    (renderer as any).highlight(highlights);
    return this;
  }

  _validateHighlight(highlights: any) {
    if (Array.isArray(highlights)) {
      for (let i = 0; i < highlights.length; i++) {
        this._validateHighlight(highlights[i]);
      }
      return;
    }
    if (highlights.filter) {
      if (!(this.options as any)["features"]) {
        throw new Error(
          "options.features must be turned on to support filter in highlight"
        );
      }
      if (!highlights.name) {
        throw new Error("A name is required for highlight with filter");
      }
    }
    if (isNil(highlights.filter) && isNil(highlights.id)) {
      throw new Error("id or filter must be provided for highlight");
    }
  }

  _resumeHighlights() {
    if (this._highlighted) {
      for (let i = 0; i < this._highlighted.length; i++) {
        this.highlight(this._highlighted[i]);
      }
      delete this._highlighted;
    }
  }

  cancelHighlight(ids: number) {
    const renderer: any = this.getRenderer();
    if (!renderer) {
      return this;
    }
    renderer.cancelHighlight(ids);
    return this;
  }

  cancelAllHighlight() {
    const renderer = this.getRenderer();
    if (!renderer) {
      return this;
    }
    (renderer as any).cancelAllHighlight();
    return this;
  }

  _parseStylePath() {
    maptalks.Util.convertStylePath(this._vtStyle, this._replacer);
    maptalks.Util.convertStylePath(this._featureStyle, this._replacer);
  }

  /**
   * 更新 SceneConfig
   *
   * @english
   * Update sceneConfig
   * @param idx - style name or index
   * @param sceneConfig   - properties of sceneConfig
   * @return this
   */
  updateSceneConfig(idx: string | number, sceneConfig: VtSceneConfig) {
    if (isString(idx)) {
      idx = this._getStyleIndex(idx as string);
    }
    return this._updateSceneConfig(0, idx as number, sceneConfig);
  }

  /**
   * 更新 feature 的 SceneConfig
   *
   * @english
   * Update feature sceneConfig
   * @param idx - feature index
   * @param styleIdx - style index
   * @param sceneConfig   - properties of sceneConfig
   * @return this
   */
  updateFeatureSceneConfig(
    idx: number,
    styleIdx: number,
    sceneConfig: VtSceneConfig
  ) {
    return this._updateSceneConfig(1, idx, sceneConfig, styleIdx);
  }

  _updateSceneConfig(
    type: number,
    idx: number,
    sceneConfig: VtSceneConfig,
    styleIdx?: number
  ) {
    const styles = this._getTargetStyle(type);
    if (!styles) {
      return this;
    }
    let renderIdx = idx;
    if (!styles[idx].renderPlugin.sceneConfig) {
      styles[idx].renderPlugin.sceneConfig = {};
    }
    extend(styles[idx].renderPlugin.sceneConfig, sceneConfig);
    let computedSceneConfig;
    if (styleIdx !== undefined) {
      checkFeaStyleExist(this._originFeatureStyle, idx, styleIdx);
      renderIdx = (this._originFeatureStyle[idx] as VtComposeStyle).style[
        styleIdx
      ]._renderIdx;
      const renderPlugin = styles[renderIdx].renderPlugin;
      if (!renderPlugin.sceneConfig) {
        renderPlugin.sceneConfig = {};
      }
      computedSceneConfig = renderPlugin.sceneConfig;
    } else {
      checkStyleExist(styles, idx);
      computedSceneConfig = styles[idx].renderPlugin.sceneConfig;
    }
    extend(computedSceneConfig, sceneConfig);

    if (Array.isArray((this.options as any).style)) {
      const renderPlugin = (this.options as any).style[idx].renderPlugin;
      if (!renderPlugin.sceneConfig) {
        renderPlugin.sceneConfig = {};
      }
      extend(renderPlugin.sceneConfig, sceneConfig);
    } else {
      const styles = this._getTargetStyle(type, (this.options as any).style);
      let renderPlugin;
      if (styleIdx !== undefined) {
        checkFeaStyleExist(styles, idx, styleIdx);
        renderPlugin = styles[idx].style[styleIdx].renderPlugin;
      } else {
        checkStyleExist(styles, idx);
        renderPlugin = styles[idx].renderPlugin;
      }
      if (!renderPlugin.sceneConfig) {
        renderPlugin.sceneConfig = {};
      }
      extend(renderPlugin.sceneConfig, sceneConfig);
    }

    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any).updateSceneConfig(type, renderIdx, sceneConfig);
    }
    if (type === 0) {
      this.fire("updatesceneconfig", { index: idx, sceneConfig });
    } else if (type === 1) {
      this.fire("updatefeaturesceneconfig", {
        index: idx,
        styleIdx,
        sceneConfig,
      });
    }
    return this;
  }

  /**
   * 更新 dataConfig
   *
   * @english
   * Update dataConfig
   * @param idx - style name or index
   * @param dataConfig   - properties of dataConfig
   * @return this
   */
  updateDataConfig(idx: number | string, dataConfig: VtDataConfig) {
    if (isString(idx)) {
      idx = this._getStyleIndex(idx as string);
    }
    return this._updateDataConfig(0, idx as number, dataConfig);
  }

  /**
   * 更新 feature 的 dataConfig
   *
   * @english
   * Update feature dataConfig
   * @param idx - feature index
   * @param styleIdx - style index
   * @param dataConfig   - properties of dataConfig
   * @return this
   */
  updateFeatureDataConfig(
    idx: number,
    styleIdx: number,
    dataConfig: VtDataConfig
  ) {
    return this._updateDataConfig(1, idx, dataConfig, styleIdx);
  }

  _updateDataConfig(
    type: number,
    idx: number,
    dataConfig: VtDataConfig,
    styleIdx?: number
  ) {
    const styles = this._getTargetStyle(type);
    if (!styles) {
      return this;
    }
    let rendererIdx = idx;
    let computedDataConfig;
    if (styleIdx !== undefined) {
      checkFeaStyleExist(this._originFeatureStyle, idx, styleIdx);
      rendererIdx = this._originFeatureStyle[idx].style[styleIdx]._renderIdx;
      computedDataConfig = styles[rendererIdx].renderPlugin.dataConfig;
    } else {
      checkStyleExist(styles, idx);
      computedDataConfig = styles[idx].renderPlugin.dataConfig;
    }
    const old = extend({}, computedDataConfig);
    extend(computedDataConfig, dataConfig);
    if (Array.isArray((this.options as any).style)) {
      extend(
        (this.options as any).style[idx].renderPlugin.dataConfig,
        dataConfig
      );
    } else {
      const styles = this._getTargetStyle(type, (this.options as any).style);
      let renderPlugin;
      if (styleIdx !== undefined) {
        checkFeaStyleExist(styles, idx, styleIdx);
        renderPlugin = styles[idx].style[styleIdx].renderPlugin;
      } else {
        checkStyleExist(styles, idx);
        renderPlugin = styles[idx].renderPlugin;
      }
      if (!renderPlugin.dataConfig) {
        renderPlugin.dataConfig = {};
      }
      extend(renderPlugin.dataConfig, dataConfig);
    }

    const renderer = this.getRenderer();
    if (renderer) {
      (renderer as any).updateDataConfig(type, rendererIdx, dataConfig, old);
    }
    if (type === 0) {
      this.fire("updatedataconfig", { index: idx, dataConfig });
    } else if (type === 1) {
      this.fire("updatefeaturedataconfig", {
        index: idx,
        styleIdx,
        dataConfig,
      });
    }
    return this;
  }

  /**
   * 更新 symbol
   *
   * @english
   * Update symbol
   * @param idx - style name or index
   * @param symbol   - properties of symbol
   * @return this
   */
  updateSymbol(idx: number | string, symbol: VtSymbol) {
    if (isString(idx)) {
      idx = this._getStyleIndex(idx as string);
    }
    return this._updateSymbol(0, idx as number, symbol);
  }

  /**
   * 更新 feature symbol
   *
   * @english
   * Update symbol
   * @param idx - style name or index
   * @param symbol   - properties of symbol
   * @return this
   */
  updateFeatureSymbol(idx: number, feaStyleIdx: number, symbol: VtSymbol) {
    return this._updateSymbol(1, idx, symbol, feaStyleIdx);
  }

  _updateSymbol(
    type: number,
    idx: number,
    symbol: VtSymbol,
    feaStyleIdx?: number
  ) {
    const styles = this._getTargetStyle(type);
    if (!styles) {
      return this;
    }
    let rendererIdx = idx;
    if (feaStyleIdx !== undefined) {
      checkFeaStyleExist(this._originFeatureStyle, idx, feaStyleIdx);
      rendererIdx = this._originFeatureStyle[idx].style[feaStyleIdx]._renderIdx;
    }
    const style = styles[rendererIdx];
    if (!style) {
      throw new Error(`No style defined at ${idx}`);
    }

    const self = this;
    const replacer = this._replacer;
    function update(
      symbol?: Record<string, any>,
      target?: Record<string, any>,
      index?: number
    ) {
      if (!symbol) {
        return false;
      }
      if (replacer) {
        symbol = JSON.parse(JSON.stringify(symbol));
        maptalks.Util.parseSymbolPath(symbol, replacer as any);
      }
      const props = Object.keys(symbol);
      let needRefresh = false;
      for (let i = 0; i < props.length; i++) {
        const key = props[i];
        if (isPropFunction(target[key]) || isPropFunction(symbol[key])) {
          needRefresh = true;
          break;
        }
      }
      for (const p in symbol) {
        if (hasOwn(symbol, p)) {
          if (
            maptalks.Util.isObject(symbol[p]) &&
            !Array.isArray(symbol[p]) &&
            !isFunctionDefinition(symbol[p])
          ) {
            //对象类型的属性则extend
            if (!target[p]) {
              target[p] = {};
            }
            extend(target[p], symbol[p]);
          } else {
            target[p] = symbol[p];
          }
        }
      }
      let styles = (self.options as any).style;
      if (isString(styles)) {
        // style是个url，不用更新
        return needRefresh;
      }
      // 更新options.style里的symbol
      if (!Array.isArray(styles)) {
        styles = self._getTargetStyle(type, (self.options as any).style);
      }
      const copy = JSON.parse(JSON.stringify(target));
      if (feaStyleIdx !== undefined) {
        checkFeaStyleExist(styles, idx, feaStyleIdx);
        if (index === undefined) {
          styles[idx].style[feaStyleIdx].symbol = copy;
        } else {
          styles[idx].style[feaStyleIdx].symbol[index] = copy;
        }
      } else {
        checkStyleExist(styles, idx);
        if (index === undefined) {
          styles[idx].symbol = copy;
        } else {
          styles[idx].symbol[index] = copy;
        }
      }

      return needRefresh;
    }

    const renderer = this.getRenderer();
    if (!renderer) {
      //layer还没有渲染，直接更新style并返回
      update();
      this._compileStyle();
      return this;
    }

    let needRefresh = false;
    const target = style.symbol;
    if (Array.isArray(symbol)) {
      for (let i = 0; i < symbol.length; i++) {
        const refresh = update(symbol[i], target[i], i);
        if (refresh) {
          needRefresh = refresh;
        }
      }
    } else {
      update(symbol, target);
    }

    this._compileStyle();
    if (needRefresh) {
      (renderer as any).setStyle();
    } else {
      needRefresh = (renderer as any).updateSymbol(type, rendererIdx, symbol);
      if (needRefresh) {
        (renderer as any).setStyle();
      }
    }
    if (type === 0) {
      this.fire("updatesymbol", { index: idx, symbol });
    } else if (type === 1) {
      this.fire("updatefeaturesymbol", {
        index: idx,
        featureStyleIndex: feaStyleIdx,
        symbol,
      });
    }
    return this;
  }

  _getTargetStyle(type: number, allStyles?: any) {
    if (allStyles) {
      const styles = type === 0 ? allStyles.style : allStyles.featureStyle;
      return styles;
    } else {
      return type === 0 ? this._vtStyle : this._featureStyle;
    }
  }

  isDefaultRender() {
    return !!this._isDefaultRender && (this.options as any)["defaultRendering"];
  }

  /**
   * 校验style是否合法
   *
   * @english
   * Validate style
   * @return void
   */
  validateStyle() {
    this._isDefaultRender = false;
    let styles = this._vtStyle;
    if (!(this.options as any)["style"]) {
      this._isDefaultRender = true;
      styles = this._vtStyle = [];
    }
    if (!Array.isArray(styles)) {
      styles = this._vtStyle = [styles];
    }
    for (let i = 0; i < styles.length; i++) {
      let filter = styles[i].filter;
      if (filter && filter.value) {
        filter = filter.value;
      }
      if (!filter) {
        console.warn(
          `render plugin at ${i} doesn't define filter, its filter will be set to 'default' by default.`
        );
      }
      if (
        filter !== undefined &&
        filter !== "default" &&
        filter !== true &&
        !Array.isArray(filter) &&
        filter.condition === undefined
      ) {
        throw new Error(`Invalid filter at ${i} : ${JSON.stringify(filter)}`);
      }
      //TODO 如果定义了renderPlugin就必须定义symbol
    }
  }

  /**
   * 获取当前 style
   *
   * @english
   * Get style
   * @return style
   */
  getStyle() {
    if (!(this.options as any).style) {
      return null;
    }
    return JSON.parse(JSON.stringify((this.options as any).style));
  }

  // /**
  //  * 获取style定义
  //  *
  //  * @param {Number|String} index/name - 序号或者style的name
  //  * @returns Object
  //  **/
  // getRenderStyle(index) {
  //     if (isString(index)) {
  //         // by name
  //         index = this._getStyleIndex(index);
  //     }
  //     let styles = this._vtStyle;
  //     return styles && styles[index];
  // }

  // /**
  //  * 在指定位置添加一个新的style，例如：
  //  *
  //  * layer.addStyle(0, {
  //  *   filter: true,
  //  *   renderPlugin,
  //  *   symbol
  //  * });
  //  * @param {Number} index - 序号，值-1时添加到最后
  //  * @param {Object} style - style定义
  //  * @returns this
  //  */
  // addRenderStyle(index, style) {
  //     let styles = this._vtStyle;
  //     if (!styles) {
  //         styles = [style];
  //     } else {
  //         if (index < 0 || index >= styles.length) {
  //             styles.push(style);
  //         } else {
  //             styles.splice(index, 0, style);
  //         }
  //     }
  //     this._setStyle({
  //         $root: this._pathRoot,
  //         style: styles,
  //         featureStyle: this._originFeatureStyle
  //     });
  //     return this;
  // }

  // /**
  //  * 更新指定位置的style，例如：
  //  *
  //  * layer.updateStyle(1, {
  //  *   filter: true,
  //  *   renderPlugin,
  //  *   symbol
  //  * });
  //  * @param {Number|String} index/name - 序号或者style的name
  //  * @param {Object} style - style定义
  //  * @returns this
  //  */
  // updateRenderStyle(index, style) {
  //     if (isString(index)) {
  //         // by name
  //         index = this._getStyleIndex(index);
  //     }
  //     let styles = this._vtStyle;
  //     if (!styles || index < 0 || index >= styles.length) {
  //         return this;
  //     }
  //     styles.splice(index, 1, style);
  //     this._setStyle({
  //         $root: this._pathRoot,
  //         style: styles,
  //         featureStyle: this._originFeatureStyle
  //     });
  //     return this;
  // }

  // /**
  //  * 删除指定位置的style
  //  * @param {Number|String} index/name - 序号或者style的name
  //  * @returns this
  //  */
  // removeRenderStyle(index) {
  //     if (isString(index)) {
  //         // by name
  //         index = this._getStyleIndex(index);
  //     }
  //     let styles = this._vtStyle;
  //     if (!styles || index < 0 || index >= styles.length) {
  //         return this;
  //     }
  //     styles.splice(index, 1);
  //     this._setStyle({
  //         $root: this._pathRoot,
  //         style: styles,
  //         featureStyle: this._originFeatureStyle
  //     });
  //     return this;
  // }

  // /**
  //  * 根据feature id或者FeatureStyle定义
  //  * @param {String|Number|String[]|Number[]} id - feature id 或者 一组feature id
  //  * @returns Object
  //  **/
  // getFeatureStyle(id) {
  //     const idx = this.getFeatureStyleIndex(id);
  //     if (idx < 0) {
  //         return null;
  //     }
  //     return this._originFeatureStyle[idx];
  // }

  // /**
  //  * 更新指定feature id的Feature Style，如果该id的feature style不存在，则添加一个，例如：
  //  *
  //  * layer.updateFeatureStyle({
  //  *     id: 10
  //  *     style: [
  //  *       {
  //  *         filter: true,
  //  *         renderPlugin,
  //  *         symbol
  //  *       }
  //  *     ]);
  //  * @param {String|Number} id - feature id
  //  * @param {Object} feature style - feature style定义
  //  * @returns this
  //  */
  // updateFeatureStyle(featureStyle) {
  //     if (!featureStyle) {
  //         return this;
  //     }
  //     const id = featureStyle.id;
  //     if (isNil(id)) {
  //         return this;
  //     }
  //     const index = this.getFeatureStyleIndex(id);
  //     const featureStyles = this._originFeatureStyle || [];
  //     if (index < 0) {
  //         featureStyles.push(featureStyle);
  //     } else {
  //         featureStyles[index] = featureStyle;
  //     }
  //     this._setStyle({
  //         $root: this._pathRoot,
  //         style: this._vtStyle,
  //         featureStyle: featureStyles
  //     });
  //     return this;
  // }

  // /**
  //  * 删除指定feature id的feature style
  //  * @param id - feature id
  //  * @returns this
  //  */
  // removeFeatureStyle(id) {
  //     const index = this.getFeatureStyleIndex(id);
  //     if (index < 0) {
  //         return this;
  //     }
  //     const featureStyles = this._originFeatureStyle.splice(index, 1);
  //     this._setStyle({
  //         $root: this._pathRoot,
  //         style: this._vtStyle,
  //         featureStyle: featureStyles
  //     });
  //     return this;
  // }

  // getFeatureStyleIndex(id) {
  //     if (isNil(id)) {
  //         return -1;
  //     }
  //     const featureStyles = this._originFeatureStyle;
  //     if (!featureStyles) {
  //         return -1;
  //     }
  //     const isArr = Array.isArray(id);
  //     for (let i = 0; i < featureStyles.length; i++) {
  //         if (isArr) {
  //             return Array.isArray(featureStyles[i].id) && equalsArray(id, featureStyles[i].id);
  //         } else if (featureStyles[i].id === id) {
  //             return i;
  //         }
  //     }
  //     return -1;
  // }

  _getStyleIndex(name: string) {
    const styles = this._vtStyle;
    if (!styles) {
      return -1;
    }
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].name === name) {
        return i;
      }
    }
    const error = `No style defined with name: ${name}`;
    throw new Error(error);
  }

  /**
   * 获取图层的背景设置
   *
   * @english
   * Get Background config of the layer
   * @return backgroundConfig
   */
  getGroundConfig() {
    if (!this._backgroundConfig) {
      this._backgroundConfig = {
        enable: true,
        renderPlugin: {
          type: "fill",
          sceneConfig: {},
        },
        symbol: {
          polygonFill: [0, 0, 0, 0],
          polygonOpacity: 1,
        },
      };
    }
    const background = this._getComputedStyle().background || {};
    this._backgroundConfig.enable = background.enable;
    this._backgroundConfig.symbol.polygonFill = background.color;
    this._backgroundConfig.symbol.polygonOpacity = background.opacity;
    this._backgroundConfig.symbol.polygonPatternFile = background.patternFile;
    this._backgroundConfig.renderPlugin.sceneConfig.depthRange =
      background.depthRange;
    return this._backgroundConfig;
  }

  getComputedStyle() {
    return JSON.parse(JSON.stringify(this._getComputedStyle()));
  }

  _getComputedStyle() {
    return {
      background: this._background,
      style: this._vtStyle || [],
      featureStyle: this._featureStyle || [],
    };
  }

  // getCompiledStyle() {
  //     return {
  //         style: this._compiledStyles || [],
  //         featureStyle: this._compiledFeatureStyles || []
  //     };
  // }

  /**
   * 识别给定坐标的数据
   *
   * @english
   * Identify the data on the given container point
   * @param coordinate - coordinate to identify
   * @param options=null - options
   * @param options.tolerance=0 - identify tolerance in pixel
   * @param options.count=null - result count
   * @return data identified
   */
  identify(
    coordinate: maptalks.Coordinate,
    options: { tolerance?: object; count?: object } = {}
  ): object[] {
    const map = this.getMap();
    const renderer = this.getRenderer();
    if (!map || !renderer) {
      return [];
    }
    const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
    return this.identifyAtPoint(cp, options);
  }

  /**
   * 识别给定点的数据
   *
   * @english
   * Identify the data on the given container point
   * @param point - point to identify
   * @param options=null - options
   * @param options.tolerance=0 - identify tolerance in pixel
   * @param options.count=null - result count
   * @return data identified
   */
  identifyAtPoint(
    point: maptalks.Point,
    options: { tolerance?: object; count?: object } = {}
  ): object[] {
    const map = this.getMap();
    const renderer = this.getRenderer();
    if (!map || !renderer) {
      return [];
    }
    const dpr = map.getDevicePixelRatio();
    const results = (renderer as any).pick(
      point.x * dpr,
      point.y * dpr,
      options
    );
    if (
      (this.options as any)["features"] &&
      (this.options as any)["features"] !== "id"
    ) {
      // 将瓦片坐标转成经纬度坐标
      return this._convertPickedFeature(results);
    } else {
      return results;
    }
  }

  _convertPickedFeature(picks: any[]) {
    const renderer = this.getRenderer();
    if (!renderer) {
      return picks;
    }
    const tileConfig = this["_getTileConfig"]();
    const sr = this.getSpatialReference();
    for (let i = 0; i < picks.length; i++) {
      let pick = picks[i];
      if (!pick || !pick.data) {
        continue;
      }
      const { tile } = pick.data;
      const { x, y, z, extent } = tile;
      const res = sr.getResolution(z);
      const nw = tileConfig.getTilePointNW(x, y, res);
      const geometry = pick.data.feature && pick.data.feature.geometry;
      if (geometry) {
        pick.data = extend({}, pick.data);
        pick.data.feature = extend({}, pick.data.feature);
        const type = pick.data.feature.type;
        pick.data.feature.type = "Feature";
        // pick.data.feature.type = getFeatureType(pick.data.feature);
        pick.data.feature.geometry = this._convertGeoemtry(
          type,
          geometry,
          nw,
          extent,
          res
        );
        // pick.data.feature.geometry = this._convertGeometryCoords(geometry, nw, extent, res);
      }
    }
    return picks;
  }

  _convertGeoemtry(
    type: number,
    geometry: maptalks.Geometry[],
    nw: maptalks.Point,
    extent: number,
    res: number
  ) {
    let geoType: string, coordinates: any;
    if (type === 1) {
      if (geometry.length <= 1) {
        geoType = "Point";
        coordinates =
          this._convertGeometryCoords(geometry, nw, extent, res) || [];
      } else {
        geoType = "MultiPoint";
        coordinates = this._convertGeometryCoords(geometry, nw, extent, res);
      }
    } else if (type === 2) {
      if (geometry.length <= 1) {
        geoType = "LineString";
        coordinates =
          this._convertGeometryCoords(geometry, nw, extent, res) || [];
      } else {
        geoType = "MultiLineString";
        coordinates = this._convertGeometryCoords(geometry, nw, extent, res);
      }
    } else if (type === 3) {
      coordinates = [];
      let polygon;
      let count = 0;
      for (let i = 0; i < geometry.length; i++) {
        const area = PackUtil.calculateSignedArea(geometry[i]);
        if (area > 0) {
          count++;
          if (polygon && polygon.length) {
            coordinates.push(polygon);
          }
          polygon = [];
        }
        polygon.push(this._convertGeometryCoords(geometry[i], nw, extent, res));
      }
      if (polygon.length) {
        coordinates.push(polygon);
      }
      if (count <= 1) {
        geoType = "Polygon";
        coordinates = coordinates[0];
      } else {
        geoType = "MultiPolygon";
      }
    }
    return {
      type: geoType,
      coordinates,
    };
  }

  _convertGeometryCoords(
    geometry: maptalks.Geometry | maptalks.Geometry[],
    nw: maptalks.Point,
    extent: number,
    res: number
  ): any {
    const tileSize = this.getTileSize().width;
    const tileScale = extent / tileSize;
    const map = this.getMap();

    const singleCoordinate = (coordinates) => {
      const coords: PositionArray<number>[] = [];
      if (isObject(coordinates)) {
        coordinates = [coordinates];
      }
      for (let i = 0, len = coordinates.length; i < len; i++) {
        const c = coordinates[i];
        TMP_POINT.x = nw.x + c.x / tileScale;
        TMP_POINT.y = nw.y - c.y / tileScale;
        map.pointAtResToCoord(TMP_POINT, res, TMP_COORD);
        coords.push(TMP_COORD.toArray());
      }
      if (coordinates.length === 1) {
        return coords[0];
      }
      return coords;
    }

    if (isObject(geometry)) {
      return singleCoordinate(geometry);
    }

    const len = geometry.length;
    if (len === 1) {
      const coordinates = singleCoordinate(geometry[0]);
      return coordinates;
    } else {
      let coords: PositionArray<number>[] = [];
      for (let i = 0; i < len; i++) {
        coords.push(singleCoordinate(geometry[i]));
      }
      return coords;
    }
  }

  /**
   * A separate collision index for background tiles
   * To avoid conflict with current zoom's tiles
   * @returns {CollisionIndex}
   */
  // getBackgroundCollisionIndex() {
  //     if (!this._bgCollisionIndex) {
  //         this._bgCollisionIndex = new maptalks.CollisionIndex();
  //     }
  //     return this._bgCollisionIndex;
  // }

  /**
   * Clear layer's background tiles collision index.
   */
  // clearBackgroundCollisionIndex() {
  //     if (this._bgCollisionIndex) {
  //         this._bgCollisionIndex.clear();
  //     }
  //     return this;
  // }

  /**
   * Return vector tile data's schema, including layers, properties, data types
   * Will return all zoom's schema if z is undefined
   * @param {Number} [z=undefined] - tile's zoom, optional
   * @returns {Object} data schema
   */
  /**
   * 返回矢量瓦片数据的重要信息，包括图层、属性和数据类型
   *
   * @english
   * Return vector tile data's schema, including layers, properties, data types
   * @param z=undefined - tile's zoom, optional
   * @return data schema
   */
  getDataSchema(z: number): object {
    if (!this._schema) {
      this._schema = {};
    }
    if (!isNil(z) && !this._schema[z]) {
      this._schema[z] = {};
    }
    if (isNil(z)) {
      return this._schema;
    }
    return this._schema[z];
  }

  onRemove() {
    super.onRemove();
  }

  static fromJSON(layerJSON: object) {
    if (!layerJSON || layerJSON["type"] !== "VectorTileLayer") {
      return null;
    }

    return new VectorTileLayer(layerJSON["id"], layerJSON["options"]);
  }

  _compileStyle() {
    // if (this._vtStyle) {
    //     this._compiledStyles = compileStyle(this._vtStyle);
    // }
    // if (this._featureStyle) {
    //     this._compiledFeatureStyles = compileStyle(this._featureStyle);
    // }
  }

  static registerPlugin(Plugin: { type: string;[key: string]: unknown }) {
    if (!(VectorTileLayer as any).plugins) {
      (VectorTileLayer as any).plugins = {};
    }
    (VectorTileLayer as any).plugins[Plugin.type] = Plugin;
  }

  static getPlugins() {
    return (VectorTileLayer as any).plugins || {};
  }

  static compressStyleJSON(json: object | object[]) {
    if (!Array.isArray(json) || !json.length) {
      return json;
    }

    return compress(json);
  }
}

VectorTileLayer.prototype["_getTileZoom"] = function (zoom) {
  zoom = Math.floor(zoom);
  return maptalks.TileLayer.prototype["_getTileZoom"].call(this, zoom);
};

VectorTileLayer.registerJSONType("VectorTileLayer");

VectorTileLayer.mergeOptions(defaultOptions);

VectorTileLayer.registerRenderer("gl", VectorTileLayerRenderer);
VectorTileLayer.registerRenderer("canvas", null);

export default VectorTileLayer;

function isPropFunction(v) {
  return !!(v && v.properties);
}

function unitColor(color) {
  if (!color) {
    return null;
  }
  if (!Array.isArray(color)) {
    color = Color(color).unitArray();
  }
  if (color.length === 3) {
    color.push(1);
  }
  return color;
}

function getOrDefault(v, defaultValue) {
  if (v === undefined || v === null) {
    return defaultValue;
  }
  return v;
}

function parseFeatureStyle(featureStyle) {
  if (!featureStyle || !Array.isArray(featureStyle)) {
    return [];
  }
  const parsed = [];
  for (let i = 0; i < featureStyle.length; i++) {
    const style = featureStyle[i].style;
    if (style && Array.isArray(style) && style.length) {
      for (let ii = 0; ii < style.length; ii++) {
        const unitStyle = extend({}, featureStyle[i], style[ii]);
        style[ii]._renderIdx = parsed.length;
        delete unitStyle.style;
        parsed.push(unitStyle);
      }
    } else {
      parsed.push(extend({}, featureStyle[i]));
    }
  }
  return parsed;
}

function checkFeaStyleExist(styles, idx, styleIdx) {
  if (!styles[idx] || !styles[idx].style || !styles[idx].style[styleIdx]) {
    throw new Error(
      `No plugin defined at feature style of ${idx} - ${styleIdx}`
    );
  }
}

function checkStyleExist(styles, idx) {
  if (!styles[idx]) {
    throw new Error(`No plugin defined at style of ${idx}`);
  }
}

const MAX_ZOOM = 22;
const preset4326 = {
  projection: "EPSG:4326",
  fullExtent: {
    top: 90,
    left: -180,
    bottom: -90,
    right: 180,
  },
  resolutions: (function () {
    const resolutions = [];
    for (let i = 0; i < MAX_ZOOM; i++) {
      resolutions[i] = 180 / 4 / (Math.pow(2, i) * 128);
    }
    return resolutions;
  })(),
};

maptalks.SpatialReference.registerPreset("preset-vt-4326", preset4326);
maptalks.SpatialReference.registerPreset("preset-4326-512", preset4326);

// const preset3857 = {
//     'projection': 'EPSG:3857',
//     'resolutions': (function () {
//         const resolutions = [];
//         const d = 6378137 * Math.PI;
//         for (let i = 0; i < MAX_ZOOM; i++) {
//             resolutions[i] = d / (256 * Math.pow(2, i));
//         }
//         return resolutions;
//     })(),
//     'fullExtent': {
//         'top': 6378137 * Math.PI,
//         'left': -6378137 * Math.PI,
//         'bottom': -6378137 * Math.PI,
//         'right': 6378137 * Math.PI
//     }
// };
// maptalks.SpatialReference.registerPreset('preset-vt-3857', preset3857);

export type VectorTileLayerOptionsType = {
  renderer?: "gl",
  altitudeProperty?: string,
  features?: boolean,
  schema?: boolean,
  collision?: boolean,
  collisionBuffserSize?: number,
  picking?: boolean,
  pickingPoint?: boolean,
  pickingGeometry?: boolean,
  //每帧每个瓦片最多能绘制的sdf数量
  glyphSdfLimitPerFrame?: number,
  //zooming或zoom fading时，每个瓦片最多能绘制的box(icon或text)数量
  // boxLimitOnZoomout: 7,
  antialias?: boolean,
  iconErrorUrl?: string,
  collisionFrameLimit?: number,
  //是否开启无style时的默认绘制功能
  defaultRendering?: boolean,
  //允许用户调整文字的gamma清晰度
  textGamma?: number,
  // altas中会在四周留一个像素的空隙，所以设为254，最大尺寸的icon也刚好存入256高宽的图片中
  maxIconSize?: number,
  workarounds?: {
    //#94, text rendering crashes on windows with intel gpu
    // 2022-12-06, 用当前版本测试crash.html，已经不再崩溃，关闭该workaround, http://localhost/bugs/issue-175/webgl_crash/crash2.html
    "win-intel-gpu-crash"?: boolean,
  },
  styleScale?: number,
  enableAltitude?: true,

  debugTileData?: boolean,

  altitudeQueryTimeLimitPerFrame?: number,
  workerGlyph?: boolean,

  // A property to use as a feature id (for feature state)
  // https://docs.mapbox.com/style-spec/reference/sources/#vector-promoteId
  featureIdProperty?: string,
  currentTilesFirst?: true,

  style?: any
} & TileLayerOptionsType;
