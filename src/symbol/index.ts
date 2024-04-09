//通过stops和base，插值计算出结果，要求输入值必须为数值类型
export type FunctionTypeExponential = {
    stops: Array<Array<number>>;
    base?: number;
    property?: string;
    default?: number;
    type: 'exponential'
}

//把输入的property值直接作为输出值，必须定义property
export type FunctionTypeIdentity = {
    property: string;
    default?: any;
    type: 'identity'
}

//用stops把输入值划分为几个区间来定义各自的输出值，即落在某个区间的输入值都输出同一个输出值
export type FunctionTypeInterval = {
    stops: Array<[number, any]>;
    property?: string;
    default?: any;
    type: 'interval'
}

//输入值必须等于stops中某个值时，则输出相应的输出值，就是key:value
export type FunctionTypeCategorical = {
    stops: Array<[number, any]>;
    property?: string;
    default?: any;
    type: 'categorical'
}

//颜色插值,会根据颜色区间自动进行渐变色的获取
export type FunctionTypeColor_Interpolate = {
    stops: Array<[number, string]>;
    property?: string;
    default?: any;
    type: 'color-interpolate'
}

export type SymbolBooleanType = boolean | FunctionTypeIdentity | FunctionTypeInterval | FunctionTypeCategorical;
export type SymbolNumberType = number | FunctionTypeExponential | FunctionTypeIdentity | FunctionTypeInterval | FunctionTypeCategorical;
export type SymbolColorType = string | Array<number> | FunctionTypeColor_Interpolate;



export type SymbolCommon = {
    visible?: SymbolBooleanType;
    opacity?: SymbolNumberType;
    shadowBlur?: SymbolNumberType;
    shadowColor?: SymbolColorType;
    shadowOffsetX?: SymbolNumberType;
    shadowOffsetY?: SymbolNumberType;
}

export type MarkerCommonSymbol = {
    markerOpacity?: SymbolNumberType;
    markerWidth?: SymbolNumberType;
    markerHeight?: SymbolNumberType;
    markerDx?: SymbolNumberType;
    markerDy?: SymbolNumberType;
    markerHorizontalAlignment?: 'left' | 'middle' | 'right';
    markerVerticalAlignment?: 'top' | 'middle' | 'bottom';
    markerPlacement?: 'point' | 'vertex' | 'line' | 'vertex-first' | 'vertex-last';
    markerRotation?: number;
}

export type FileMarkerSymbol = {
    markerFile: string;
} & MarkerCommonSymbol & SymbolCommon;

export type VectorMarkerSymbol = {
    markerType: 'ellipse' | 'cross' | 'x' | 'diamond' | 'bar' | 'square' | 'rectangle' | 'triangle' | 'pin' | 'pie';
    markerFill?: SymbolColorType;
    markerFillPatternFile?: string;
    markerFillOpacity?: number;
    markerLineColor?: SymbolColorType;
    markerLineWidth?: number;
    markerLineOpacity?: number;
    markerLineDasharray?: Array<number>;
    markerLinePatternFile?: string;
} & MarkerCommonSymbol & SymbolCommon;

type SVGPathItem = {
    path: string;
    fill?: string;

}
export type PathMarkerSymbol = {
    markerType: 'path';
    markerPath: string | Array<SVGPathItem>;
    markerPathWidth: number;
    markerPathHeight: number;
} & MarkerCommonSymbol & SymbolCommon;

export type TextSymbol = {
    textName?: string;
    textPlacement?: 'point' | 'vertex' | 'line' | 'vertex-first' | 'vertex-last';
    textFaceName?: string;
    textFont?: string;
    textWeight?: string;
    textStyle?: string;
    textSize?: SymbolNumberType;
    textFill?: SymbolColorType;
    textOpacity?: SymbolNumberType;
    textHaloFill?: SymbolColorType;
    textHaloRadius?: SymbolNumberType;
    textHaloOpacity?: SymbolNumberType;
    textWrapWidth?: number;
    textWrapCharacter?: string;
    textLineSpacing?: number;
    textHorizontalAlignment?: 'left' | 'middle' | 'right';
    textVerticalAlignment?: 'top' | 'middle' | 'bottom';
    textAlign?: 'left' | 'right' | 'center';
    textRotation?: number;
    textDx?: SymbolNumberType;
    textDy?: SymbolNumberType;
}

export type LineSymbol = {
    lineColor?: SymbolColorType;
    lineWidth?: SymbolNumberType;
    lineDasharray?: Array<number>;
    lineOpacity?: SymbolNumberType;
    lineJoin?: 'round' | 'bevel' | 'miter';
    lineCap?: 'butt' | 'round' | 'square';
    linePatternFile?: string;
    lineDx?: SymbolNumberType;
    lineDy?: SymbolNumberType;
}

export type FillSymbol = {
    polygonFill?: SymbolColorType;
    polygonOpacity?: SymbolNumberType;
    polygonPatternFile?: string;
} & LineSymbol;

export type AnyMarkerSymbol = FileMarkerSymbol | VectorMarkerSymbol | PathMarkerSymbol | TextSymbol;

export type AnySymbol = FillSymbol | LineSymbol | TextSymbol | FileMarkerSymbol | VectorMarkerSymbol | PathMarkerSymbol;