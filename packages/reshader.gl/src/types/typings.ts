import REGL, { Texture, Texture2DOptions, TextureImageData } from "@maptalks/regl";
import { mat4 } from "gl-matrix";
import AbstractTexture from "../AbstractTexture";

export type UrlModifierFunction = (url: string) => string

/* eslint-disable @typescript-eslint/ban-types */
export type MixinConstructor = new (...args: any[]) => {};
/* eslint-enable @typescript-eslint/ban-types */

export type TypedArray = Uint8Array | Uint16Array  | Uint32Array | Int8Array | Int16Array | Float32Array;

export type NumberArray = TypedArray | number[]

export type AttributeData = NumberArray | any;

export type GeometryDesc = {
    'positionSize'?: number,
    'primitive'?: REGL.PrimitiveType,
    //name of position attribute
    'positionAttribute'?: string,
    'normalAttribute'?: string,
    'uv0Attribute'?: string,
    'uv1Attribute'?: string,
    'color0Attribute'?: string,
    'colorAttribute'?: string,
    'tangentAttribute'?: string,
    'pickingIdAttribute'?: string,
    'textureCoordMatrixAttribute'?: string,
    'altitudeAttribute'?: string,
    'fillEmptyDataInMissingAttribute'?: boolean,
    'static'?: boolean
}

export type GeometryElements = { array: NumberArray }

export type AttributeKey = { key: string }
export type ActiveAttributes = { name: string, type: number }[] & AttributeKey

export type ShaderUniformValue = number | boolean | NumberArray | null | AbstractTexture | Texture

export type ShaderUniforms = {
    meshConfig?: MeshOptions,
    primitive?: REGL.PrimitiveType
} & {
    [_: string]: ShaderUniformValue
}

export type ShaderDefines = {
    [_: string]: number | string
}

export type MeshOptions = {
    transparent?: boolean
    bloom?: boolean
    ssr?: boolean
    castShadow?: boolean
    picking?: boolean
    disableVAO?: boolean
}

export type MatrixFunction = () => mat4

export type AttributeBufferData = { buffer?: REGL.Buffer, data?: NumberArray, divisor?: number }

export type AttributeType = NumberArray | REGL.Buffer | AttributeBufferData;

export type InstancedAttribute = Record<string, AttributeType>;


export type ImageObject = {
    array: TextureImageData,
    width: number,
    height: number,
}

export type TextureConfig = {
    url?: string,
    image?: ImageObject,
    hdr?: boolean,
    /**
     * hdr 纹理的最大 RGBMRange，默认为9
     * @english
     * max RGBMRange for hdr texture, default is 9
     */
    maxRange?: number,
    promise?: Promise<any>,
    persistent?: boolean
} & Texture2DOptions;
