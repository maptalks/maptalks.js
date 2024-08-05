import * as maptalks from "maptalks";

import type { LitDataConfig, LitMaterial } from "../../types";
import { extend, isNil } from "../../common/Util";

import { DEFAULT_TEX_WIDTH } from "@maptalks/vector-packer";
import { ID_PROP } from "./util/convert_to_feature";
import type { OverlayLayerOptionsType } from "maptalks/dist/layer/OverlayLayer";
import { PROP_OMBB } from "../../common/Constant";
import { PolygonLayerRenderer } from "./PolygonLayer";
import Vector3DLayer from "./Vector3DLayer";
import { build3DExtrusion } from "../../worker/builder/";
import computeOMBB from "../../worker/builder/ombb.js";
import { fromJSON } from "./util/from_json";
import { meterToPoint } from "../plugins/Util";

interface ExtrudePolygonLayerOptions extends OverlayLayerOptionsType {
  dataConfig: LitDataConfig;
  material: LitMaterial;
  sideMaterial: LitMaterial;
}

const options = {
  cullFace: false,
  castShadow: true,
};

class ExtrudePolygonLayer extends Vector3DLayer {
  options: ExtrudePolygonLayerOptions;

  /**
   * Reproduce a PolygonLayer from layer's JSON.
   * @param  {Object} layerJSON - layer's JSON
   * @return {PolygonLayer}
   * @static
   * @private
   * @function
   */
  static fromJSON(json: object): ExtrudePolygonLayer {
    return fromJSON(json, "ExtrudePolygonLayer", ExtrudePolygonLayer);
  }

  getPolygonOffsetCount(): 0 | 1 {
    return 0;
  }

  getPolygonOffset() {
    return 0;
  }

  onConfig(conf: Record<string, any>) {
    const renderer = this.getRenderer();
    if (renderer) {
      renderer.onConfig(conf);
    }
    return super.onConfig(conf);
  }

  updateMaterial(matInfo: LitMaterial) {
    if (!this.options.material) {
      this.options.material = {};
    }
    if (matInfo) {
      extend(this.options.material, matInfo);
    } else {
      this.options.material = null;
    }
    const renderer: Record<string, any> = this.getRenderer();
    if (renderer) {
      renderer.updateMaterial(matInfo);
    }
    return this;
  }

  updateSideMaterial(matInfo: LitMaterial) {
    let isNew = false;
    if (!this.options.sideMaterial) {
      this.options.sideMaterial = {};
      isNew = true;
    }
    if (matInfo) {
      extend(this.options.sideMaterial, matInfo);
    } else {
      this.options.sideMaterial = null;
    }
    const renderer: Record<string, any> = this.getRenderer();
    if (renderer) {
      if (isNew) {
        renderer._deleteSideMaterial();
      }
      renderer.updateSideMaterial(matInfo);
    }
    return this;
  }

  updateDataConfig(dataConfig: LitDataConfig) {
    if (!dataConfig) {
      return this;
    }
    if (!this.options.dataConfig) {
      this.options.dataConfig = {};
    }
    const old = JSON.parse(JSON.stringify(this.options.dataConfig));
    extend(this.options.dataConfig, dataConfig);
    const renderer: Record<string, any> = this.getRenderer();
    if (renderer) {
      renderer.updateDataConfig(dataConfig, old);
    }
    return this;
  }
}

ExtrudePolygonLayer.registerJSONType("ExtrudePolygonLayer");
ExtrudePolygonLayer.mergeOptions(options);

const SYMBOL = {
  polygonFill: {
    type: "identity",
    default: [1, 1, 1, 1],
    property: "_symbol_polygonFill",
  },
  polygonOpacity: {
    type: "identity",
    default: 1,
    property: "_symbol_polygonOpacity",
  },
  topPolygonFill: {
    type: "identity",
    default: [1, 1, 1, 1],
    property: "_symbol_topPolygonFill",
  },
  bottomPolygonFill: {
    type: "identity",
    default: [1, 1, 1, 1],
    property: "_symbol_bottomPolygonFill",
  },
};

const DEFAULT_DATACONFIG = {
  defaultAltitude: 20,
};

const topFilter = (mesh) => {
  return mesh.properties.top === 1;
};

const sideFilter = (mesh) => {
  return mesh.properties.side === 1;
};

class ExtrudePolygonLayerRenderer extends PolygonLayerRenderer {
  GeometryTypes = [maptalks.Polygon, maptalks.MultiPolygon];
  private sidePainter: Record<string, any>;
  private sidePainterSymbol: Record<string, any>;

  _extrudeCenter: number[];

  constructor(...args: any) {
    super(...args);
  }

  _groupPolygonFeatures(features) {
    return [features];
  }

  onConfig(conf) {
    if (!this.painter) {
      return;
    }
    if (!isNil(conf.cullFace)) {
      this.painter.updateSceneConfig({
        cullFace: conf.cullFace,
      });
    }
  }

  updateMaterial(matInfo: LitMaterial) {
    if (!this.painter) {
      return;
    }
    this.painter._updateMaterial(matInfo);
    if (!this.layer.options.sideMaterial) {
      this.sidePainter._updateMaterial(matInfo);
    }
    this.setToRedraw();
  }

  _deleteSideMaterial() {
    if (!this.sidePainter) {
      return;
    }
    this.sidePainter.deleteMaterial();
  }

  updateSideMaterial(matInfo: LitMaterial) {
    if (!this.sidePainter) {
      return;
    }
    if (matInfo) {
      this.sidePainter._updateMaterial(matInfo);
    } else {
      this.sidePainter.deleteMaterial();
      this.sidePainter._updateMaterial(this.layer.options.material);
    }

    this.setToRedraw();
  }

  updateDataConfig(dataConfig: LitDataConfig, old: LitDataConfig) {
    if (!this.painter) {
      return;
    }
    this.painter.updateDataConfig(dataConfig, old);
    this._markRebuild();
  }

  updateBloom(enableBloom: boolean) {
    super.updateBloom(enableBloom);
    if (this.sidePainter) {
      this._updatePainterBloom(
        this.sidePainter,
        this.sidePainterSymbol,
        enableBloom
      );
    }
  }

  needCheckPointLineSymbols() {
    return false;
  }

  draw(timestamp, parentContext) {
    return super.draw(timestamp, parentContext);
  }

  createPainter() {
    const StandardPainter = Vector3DLayer.get3DPainterClass("lit");
    this.painterSymbol = extend({}, SYMBOL);
    this.sidePainterSymbol = extend({}, SYMBOL);
    this._defineSymbolBloom(
      this.painterSymbol,
      StandardPainter.getBloomSymbol()
    );
    const layer = this.layer;
    const dataConfig = extend(
      {},
      DEFAULT_DATACONFIG,
      layer.options.dataConfig || {}
    );
    if (layer.options.material) {
      this.painterSymbol.material = layer.options.material;
    }
    if (layer.options.sideMaterial) {
      this.sidePainterSymbol.material = layer.options.sideMaterial;
    } else {
      this.sidePainterSymbol.material = layer.options.material;
    }
    const sceneConfig = {
      cullFace: layer.options.cullFace,
    };
    Object.defineProperty(sceneConfig, "castShadow", {
      enumerable: true,
      get: () => {
        return layer.options["castShadow"];
      },
    });
    Object.defineProperty(sceneConfig, "depthMask", {
      enumerable: true,
      get: () => {
        return layer.options["depthMask"];
      },
    });
    const topDataConfig = extend({}, dataConfig);
    topDataConfig.upsideUpTexture = true;
    const painter = new StandardPainter(
      this.regl,
      layer,
      this.painterSymbol,
      sceneConfig,
      0,
      topDataConfig
    );
    this.sidePainter = new StandardPainter(
      this.regl,
      layer,
      this.sidePainterSymbol,
      sceneConfig,
      0,
      dataConfig
    );
    return painter;
  }

  _startFrame(...args: any) {
    super._startFrame(...args);
    const painter = this.painter;
    this.painter = this.sidePainter;
    super._startFrame(...args);
    this.painter = painter;
  }

  _renderMeshes(...args: any) {
    const context = args[0];
    const sceneFilter = context.sceneFilter;
    context.sceneFilter = (mesh) => {
      return (!sceneFilter || sceneFilter(mesh)) && topFilter(mesh);
    };
    const status0 = super._renderMeshes(...args);
    context.sceneFilter = (mesh) => {
      return (!sceneFilter || sceneFilter(mesh)) && topFilter(mesh);
    };
    const painter = this.painter;
    this.painter = this.sidePainter;
    const status1: any = (context.sceneFilter = (mesh) => {
      return (!sceneFilter || sceneFilter(mesh)) && sideFilter(mesh);
    });
    super._renderMeshes(...args);
    this.painter = painter;
    context.sceneFilter = sceneFilter;
    return {
      redraw: status0.redraw || status1.redraw,
      drawCount: (status0.drawCount || 0) + (status1.drawCount || 0),
    };
  }

  createMesh(painter, PackClass, symbol, features, atlas, center) {
    const meshes = [];
    this._extrudeCenter = center;
    const data = this._createPackData(features, symbol, true, false);
    const sideData = this._createPackData(features, symbol, false, true);
    if (data) {
      const topMesh = this._createMesh(
        data,
        painter,
        PackClass,
        symbol,
        features,
        null,
        center
      );
      topMesh.meshes[0].properties.top = 1;
      meshes.push(topMesh);
    }
    if (sideData) {
      const sideMesh = this._createMesh(
        sideData,
        painter,
        PackClass,
        symbol,
        features,
        null,
        center
      );
      sideMesh.meshes[0].properties.side = 1;
      meshes.push(sideMesh);
    }
    return meshes;
  }

  _createPackData(features, symbol, top, side) {
    const map = this.getMap();
    symbol = SYMBOL;
    const center = this._extrudeCenter;
    const extent = Infinity;
    const tileRatio = 1;
    // 原zoom是用来计算functiont-type 的symbol属性值
    const zoom = map.getZoom();
    const tilePoint = new maptalks.Point(0, 0);
    const tileCoord = new maptalks.Coordinate(0, 0);
    const dataConfig = extend(
      {},
      DEFAULT_DATACONFIG,
      this.layer.options.dataConfig
    );
    dataConfig.uv = true;
    if (dataConfig.top) {
      dataConfig.top = top;
    }
    if (dataConfig.side) {
      dataConfig.side = side;
    }
    if (dataConfig.top === false && dataConfig.side === false) {
      return null;
    }
    const debugIndex = undefined;
    if (!features.length) {
      return null;
    }
    const glRes = map.getGLRes();
    const projectionCode = map.getProjection().code;
    const material = top
      ? this.painterSymbol && this.painterSymbol.material
      : this.sidePainterSymbol && this.sidePainterSymbol.material;
    const textureWidth =
      (material && material.textureWidth) || DEFAULT_TEX_WIDTH;
    const centimeterToPoint = [
      meterToPoint(map, 1, tileCoord, glRes) / 100,
      meterToPoint(map, 1, tileCoord, glRes, 1) / 100,
    ];
    const data = build3DExtrusion(
      features,
      dataConfig,
      extent,
      tilePoint,
      textureWidth,
      map.getGLRes(),
      1,
      tileRatio,
      centimeterToPoint,
      this._zScale,
      symbol,
      zoom,
      projectionCode,
      debugIndex,
      Float32Array,
      center
    );
    return data;
  }

  updateMesh(polygon: unknown): any {
    const uid = polygon[ID_PROP];
    let feature = this.features[uid];
    if (!feature || !this.meshes) {
      return;
    }
    const data = this._createPackData(
      [feature],
      this.painterSymbol,
      true,
      false
    );
    let index = 0;
    if (data && data.data) {
      this._updateMeshData(this.meshes[index++], feature.id, data);
    }
    const sideData = this._createPackData(
      [feature],
      this.painterSymbol,
      false,
      true
    );
    if (sideData && sideData.data) {
      this._updateMeshData(this.meshes[index++], feature.id, sideData);
    }
  }

  _convertGeo(geo) {
    if (!geo.getProperties()) {
      geo.setProperties({});
    }
    if (!geo.getProperties()[PROP_OMBB]) {
      const coordinates = geo.getCoordinates();
      if (geo instanceof maptalks.MultiPolygon) {
        const ombb = [];
        for (let i = 0; i < coordinates.length; i++) {
          const shell = coordinates[i] && coordinates[i][0];
          ombb[i] = computeOMBB(shell);
        }
        geo.getProperties()[PROP_OMBB] = ombb;
      } else {
        const ombb = computeOMBB(coordinates[0]);
        geo.getProperties()[PROP_OMBB] = ombb;
      }
    }
    return super._convertGeo(geo);
  }

  resizeCanvas(canvasSize) {
    super.resizeCanvas(canvasSize);
    if (this.sidePainter) {
      this.sidePainter.resize(this.canvas.width, this.canvas.height);
    }
  }

  onRemove() {
    super.onRemove();
    if (this.sidePainter) {
      this.sidePainter.delete();
      delete this.sidePainter;
    }
  }

  drawOutline(fbo) {
    super.drawOutline(fbo);
    if (this._outlineAll) {
      if (this.sidePainter) {
        this.sidePainter.outlineAll(fbo);
      }
    }
    if (this._outlineFeatures) {
      for (let i = 0; i < this._outlineFeatures.length; i++) {
        if (this.sidePainter) {
          this.sidePainter.outline(fbo, this._outlineFeatures[i]);
        }
      }
    }
  }

  getShadowMeshes() {
    if (!this.painter) {
      return [];
    }
    return this.painter.getShadowMeshes();
  }
}

ExtrudePolygonLayer.registerRenderer("gl", ExtrudePolygonLayerRenderer);
ExtrudePolygonLayer.registerRenderer("canvas", null);

export default ExtrudePolygonLayer;
