import * as maptalks from "maptalks";

import { ID_PROP } from "./util/convert_to_feature";
import { PolygonPack } from "../../packer";
import Vector3DLayer from "./Vector3DLayer";
import Vector3DLayerRenderer from "./Vector3DLayerRenderer";
import { extend } from "../../common/Util";
import { fromJSON } from "./util/from_json";

class PolygonLayer extends Vector3DLayer {
  /**
   * Reproduce a PolygonLayer from layer's JSON.
   * @param  {Object} layerJSON - layer's JSON
   * @return {PolygonLayer}
   * @static
   * @private
   * @function
   */
  static fromJSON(json: object): PolygonLayer {
    return fromJSON(json, "PolygonLayer", PolygonLayer);
  }
}

PolygonLayer.registerJSONType("PolygonLayer");

const SYMBOL = {
  polygonFill: {
    type: "identity",
    default: [1, 1, 1, 1],
    property: "_symbol_polygonFill",
  },
  polygonPatternFile: {
    type: "identity",
    default: undefined,
    property: "_symbol_polygonPatternFile",
  },
  polygonOpacity: {
    type: "identity",
    default: 1,
    property: "_symbol_polygonOpacity",
  },
  uvScale: {
    type: "identity",
    default: [1, 1],
    property: "_symbol_uvScale",
  },
  uvOffset: {
    type: "identity",
    default: [0, 0],
    property: "_symbol_uvOffset",
  },
  uvOffsetInMeter: {
    type: "identity",
    default: false,
    property: "_symbol_uvOffsetInMeter",
  },
  polygonPatternFileWidth: {
    type: "identity",
    default: undefined,
    property: "_symbol_polygonPatternFileWidth",
  },
  polygonPatternFileHeight: {
    type: "identity",
    default: undefined,
    property: "_symbol_polygonPatternFileHeight",
  },
  polygonPatternFileOrigin: {
    type: "identity",
    default: undefined,
    property: "_symbol_polygonPatternFileOrigin",
  },
  polygonPatternUV: {
    type: "identity",
    default: undefined,
    property: "_symbol_polygonPatternUV",
  },
};

export class PolygonLayerRenderer extends Vector3DLayerRenderer {
  GeometryTypes = [maptalks.Polygon, maptalks.MultiPolygon];
  atlas: unknown[];
  painter: any;
  protected painterSymbol: Record<string, unknown>;
  protected meshes: Record<string, unknown>[];

  //@internal
  _meshCenter: number[];
  //@internal
  _isCreatingMesh: boolean;

  getPolygonOffsetCount() {
    return this.options["altitude"] > 0 ? 0 : 2;
  }

  buildMesh(atlas?: unknown[]) {
    const { features, center } = this._getFeaturesToRender();
    if (!features.length) {
      return;
    }
    const showHideUpdated = this._showHideUpdated;
    this._meshCenter = center;

    //因为有透明度和没有透明度的多边形绘制逻辑不同，需要分开
    const featureGroups = this._groupPolygonFeatures(features);

    const symbol = extend({}, SYMBOL);
    const promises = featureGroups.map((feas, i) =>
      this.createMesh(
        this.painter,
        PolygonPack,
        symbol,
        feas,
        atlas && atlas[i],
        center
      )
    );

    this._isCreatingMesh = true;
    Promise.all(promises).then((mm) => {
      if (this.meshes) {
        this.painter.deleteMesh(this.meshes);
      }
      mm = flatten(mm);
      const meshes = [];
      const atlas = [];
      for (let i = 0; i < mm.length; i++) {
        const childMeshes = mm[i] && mm[i].meshes;
        if (childMeshes) {
          meshes.push(...childMeshes);
          for (let j = 0; j < childMeshes.length; j++) {
            childMeshes[j].feaGroupIndex = i;
            childMeshes[j].geometry.properties.originElements =
              childMeshes[j].geometry.properties.elements.slice();
            if (i === 1) {
              // featureGroups中给透明Polygon单独分配的一组数据
              childMeshes[j].transparent = true;
            }
          }
          atlas[i] = mm[i].atlas;
        }
      }
      this.meshes = meshes;
      this.atlas = atlas;
      if (showHideUpdated) {
        this._showHideUpdated = showHideUpdated;
      }
      this._isCreatingMesh = false;
      this.setToRedraw();
      this.layer.fire("buildmesh");
    });
  }

  getRayCastData(mesh?: any, indiceIndex?: number) {
    const feature = this.painter.getRayCastData(mesh, indiceIndex);
    if (!feature || !feature.feature) {
      return null;
    }
    const uid = feature.feature[ID_PROP];
    return this._geometries[uid];
  }

  //@internal
  _groupPolygonFeatures(features: any[]) {
    const feas = [];
    const alphaFeas = [];
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (f.properties && f.properties["_symbol_polygonOpacity"] < 1) {
        alphaFeas.push(f);
      } else {
        feas.push(f);
      }
    }
    return [feas, alphaFeas];
  }

  createPainter() {
    const FillPainter = Vector3DLayer.get3DPainterClass("fill");
    const painterSymbol = (this.painterSymbol = extend({}, SYMBOL));
    this._defineSymbolBloom(painterSymbol, FillPainter.getBloomSymbol());
    const painter = new FillPainter(
      this.regl,
      this.layer,
      painterSymbol,
      this.layer.options.sceneConfig,
      0
    );
    return painter;
  }

  updateMesh(polygon?: unknown) {
    return this._updateMesh(
      polygon,
      this.meshes,
      this.atlas,
      this._meshCenter,
      this.painter,
      PolygonPack,
      SYMBOL,
      this._groupPolygonFeatures
    );
  }
}

PolygonLayer.registerRenderer("gl", PolygonLayerRenderer);
PolygonLayer.registerRenderer("canvas", null);

export default PolygonLayer;

function flatten(meshes: any[]) {
  const flattended = [];
  for (let i = 0; i < meshes.length; i++) {
    if (Array.isArray(meshes[i])) {
      flattended.push(...meshes[i]);
    } else {
      flattended.push(meshes[i]);
    }
  }
  return flattended;
}
