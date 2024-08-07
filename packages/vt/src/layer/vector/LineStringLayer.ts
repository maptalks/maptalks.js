import * as maptalks from "maptalks";

import { LINE_GRADIENT_PROP_KEY, LINE_SYMBOL } from "./util/symbols";

import { LinePack } from "@maptalks/vector-packer";
import Vector3DLayer from "./Vector3DLayer";
import Vector3DLayerRenderer from "./Vector3DLayerRenderer";
import { extend } from "../../common/Util";
import { fromJSON } from "./util/from_json";

const options = {
  meshRenderOrder: 1,
};

class LineStringLayer extends Vector3DLayer {
  /**
   * Reproduce a LineStringLayer from layer's JSON.
   * @param  {Object} layerJSON - layer's JSON
   * @return {LineStringLayer}
   * @static
   * @private
   * @function
   */
  static fromJSON(json: object): LineStringLayer {
    return fromJSON(json, "LineStringLayer", LineStringLayer);
  }
}

LineStringLayer.mergeOptions(options);

LineStringLayer.registerJSONType("LineStringLayer");

const GRADIENT_PROP_KEY = (LINE_GRADIENT_PROP_KEY + "").trim();

type LineSymbol = typeof LINE_SYMBOL;

interface PainterSymbol extends LineSymbol {
  lineGradientProperty: string;
}

class LineStringLayerRenderer extends Vector3DLayerRenderer {
  GeometryTypes = [maptalks.LineString, maptalks.MultiLineString];
  painterSymbol: PainterSymbol;
  meshes: Record<string, unknown>[];
  painter: any;

  //@internal
  _isCreatingMesh: boolean;
  //@internal
  _meshCenter: number[];

  constructor(...args: any) {
    super(...args);
  }

  createPainter() {
    const LineGradientPainter =
      Vector3DLayer.get3DPainterClass("line-gradient");
    this.painterSymbol = extend(
      {},
      {
        lineGradientProperty: GRADIENT_PROP_KEY,
      },
      LINE_SYMBOL
    );
    this._defineSymbolBloom(
      this.painterSymbol,
      LineGradientPainter.getBloomSymbol()
    );
    const sceneConfig = extend({}, this.layer.options.sceneConfig || {});
    if (sceneConfig.depthMask === undefined) {
      sceneConfig.depthMask = true;
    }
    const painter = new LineGradientPainter(
      this.regl,
      this.layer,
      this.painterSymbol,
      sceneConfig,
      0
    );
    return painter;
  }

  buildMesh() {
    let { features, center } = this._getFeaturesToRender();
    features = features.filter((fea) => !!fea.properties[GRADIENT_PROP_KEY]);
    if (!features.length) {
      return;
    }
    const showHideUpdated = this._showHideUpdated;
    this._meshCenter = center;

    //因为有透明度和没有透明度的多边形绘制逻辑不同，需要分开

    const symbol = extend({}, this.painterSymbol);
    const promise = this.createMesh(
      this.painter,
      LinePack,
      symbol,
      features,
      null,
      center
    );

    this._isCreatingMesh = true;
    promise.then((mm: Record<string, any>) => {
      if (this.meshes) {
        this.painter.deleteMesh(this.meshes);
      }
      const meshes = [];

      const childMeshes = mm && mm.meshes;
      if (childMeshes) {
        meshes.push(...childMeshes);
        for (let j = 0; j < childMeshes.length; j++) {
          childMeshes[j].feaGroupIndex = 0;
          childMeshes[j].geometry.properties.originElements =
            childMeshes[j].geometry.properties.elements.slice();
        }
      }

      this.meshes = meshes;
      if (showHideUpdated) {
        this._showHideUpdated = showHideUpdated;
      }
      this._isCreatingMesh = false;
      this.setToRedraw();
    });
  }
}

LineStringLayer.registerRenderer("gl", LineStringLayerRenderer);
LineStringLayer.registerRenderer("canvas", null);

export default LineStringLayer;
