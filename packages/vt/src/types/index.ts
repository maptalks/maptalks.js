import type {
  FillSymbol,
  LineSymbol,
  MarkerCommonSymbol,
  TextSymbol,
} from "maptalks";

export interface FillDataConfig {
  type?: "fill";
}

export interface LineDataConfig {
  type?: "line";
}

export interface IconDataConfig {
  type?: "point";
}

export interface TextDataConfig {
  type?: "point";
}

export interface LitDataConfig {
  type?: "3d-extrusion" | "line-extrusion";
  altitudeProperty?: string | null;
  minHeightProperty?: string | null;
  altitudeScale?: number;
  defaultAltitude?: number;
  topThickness?: number;
  top?: boolean;
  side?: boolean;
}

export type VtDataConfig =
  | FillDataConfig
  | LineDataConfig
  | IconDataConfig
  | TextDataConfig
  | LitDataConfig;

export interface VtSceneConfig {
  collision?: boolean;
  fading?: boolean;
  fadingDuration?: number;
  fadeInDelay?: number;
  fadeOutDelay?: number;
  uniquePlacement?: number;
  depthFunc?: "always" | "<=";
  depthRange?: number[];
}

export interface LitRenderPlugin {
  type: "lit";
  dataConfig: LitDataConfig;
  sceneConfig: {};
}

export interface LitMaterial {
  baseColorTexture?: string | null;
  baseColorFactor?: number[];
  hsv?: number[];
  baseColorIntensity?: number;
  contrast?: number;
  outputSRGB?: number;
  metallicRoughnessTexture?: string | null;
  roughnessFactor?: number[];
  metallicFactor?: number[];
  normalTexture?: string | null;
  uvScale?: number[];
  uvOffset?: number[];
  uvRotation?: number;
  uvOffsetAnim?: number[];
  normalMapFactor?: number;
  emissiveTexture?: string | null;
  emissiveFactor?: number[];
  emitColorFactor?: number;
  emitMultiplicative?: number;
}

export interface LitSymbol {
  bloom?: boolean;
  ssr?: boolean;
  polygonOpacity?: number;
  material?: LitMaterial;
}

export interface VtTextRenderPlugin {
  dataConfig: {
    type: "point";
  };
  sceneConfig: {
    collision: boolean;
    fading: boolean;
    depthFunc: string;
  };
  type: "text";
}

export interface VtTextStyle {
  renderPlugin: VtTextRenderPlugin;
  filter: Array<unknown> | object;
  symbol: TextSymbol;
}

export interface VtWaterRenderPlugin {
  type: "water";
  dataConfig: {
    type: "fill";
  };
}

export interface WaterSymbol {
  ssr?: boolean;
  texWaveNormal?: string | null;
  texWavePerturbation?: string | null;
  waterBaseColor?: number[];
  contrast?: number;
  hsv?: number[];
  uvScale?: number;
  animation?: boolean;
  waterSpeed?: number;
  waterDirection?: number;
}

export type VtSymbol =
  | FillSymbol
  | LineSymbol
  | MarkerCommonSymbol
  | TextSymbol
  | WaterSymbol
  | LitSymbol;

export interface VtBaseStyle {
  name?: string;
  renderPlugin: {
    dataConfig: VtDataConfig;
    sceneConfig: VtSceneConfig;
    type: "point" | "text" | "fill" | "water" | "lit";
  };
  filter: any;
  symbol: VtSymbol;
}

export interface VtComposeStyle {
  style: VtBaseStyle;
}

export type VtStyle = VtBaseStyle[] | VtComposeStyle;

export interface BackgroundStyle {
  enable?: boolean;
  color?: number[] | string;
  opacity?: number;
  depthRange?: number[];
  patternFile?: string | null;
}

export interface BackgroundConfig {
  enable: boolean;
  renderPlugin: {
    type: "fill";
    sceneConfig: VtSceneConfig;
  };
  symbol: FillSymbol;
}
